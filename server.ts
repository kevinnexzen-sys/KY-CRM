import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const getOAuth2Client = (redirectUri?: string) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Real-time state
  const activeUsers = new Map();
  const emailActivity = new Map(); // emailId -> { userId, userName, type: 'replying' | 'viewing' }
  const otps = new Map(); // userId -> { otp, expiresAt }
  const deviceRegistrations = new Map(); // deviceFingerprint -> { userId, status, registeredAt }
  const workflowInstances = new Map(); // instanceId -> WorkflowInstance
  const workflowKPIs = {
    completionRate: 94.5,
    avgExecutionTime: 125,
    errorFrequency: 2.1,
    totalExecutions: 1450,
    history: [
      { date: '2026-02-24', completions: 140, errors: 3 },
      { date: '2026-02-25', completions: 155, errors: 2 },
      { date: '2026-02-26', completions: 132, errors: 5 },
      { date: '2026-02-27', completions: 168, errors: 1 },
      { date: '2026-02-28', completions: 145, errors: 4 },
    ]
  };

  const MASTER_ADMIN_EMAILS = [
    'kevin.nexzen@gmail.com',
    'Kevin.clientmanager@gmail.com',
    'mamun.rashid5957@gmail.com',
    'md.mamun.mm5700@gmail.com'
  ];

  wss.on("connection", (ws) => {
    console.log("New client connected");
    
    // Send initial state
    ws.send(JSON.stringify({
      type: "status:all",
      payload: Array.from(activeUsers.values())
    }));

    ws.send(JSON.stringify({
      type: "email:activity",
      payload: Array.from(emailActivity.entries())
    }));

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "status:update") {
          activeUsers.set(message.userId, {
            ...message.payload,
            id: message.userId,
            lastSeen: new Date().toISOString()
          });
          
          // Broadcast to all clients
          const broadcastData = JSON.stringify({
            type: "status:all",
            payload: Array.from(activeUsers.values())
          });
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }

        if (message.type === "email:activity:update") {
          const { emailId, activity } = message.payload;
          if (activity) {
            emailActivity.set(emailId, { ...activity, timestamp: new Date().toISOString() });
          } else {
            emailActivity.delete(emailId);
          }

          // Broadcast activity
          const broadcastData = JSON.stringify({
            type: "email:activity",
            payload: Array.from(emailActivity.entries())
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastData);
            }
          });
        }

        if (message.type === "chat:message") {
          // Broadcast chat message to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "chat:message",
                payload: message.payload
              }));
            }
          });
        }

        if (message.type === "notification") {
          // Broadcast notification to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "notification",
                payload: message.payload
              }));
            }
          });
        }
      } catch (e) {
        console.error("Error processing message:", e);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google OAuth Routes
  app.get("/api/auth/google/url", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: "Google OAuth credentials not configured in environment variables." });
    }

    const appUrl = process.env.APP_URL || `http://localhost:3000`;
    const redirectUri = `${appUrl.replace(/\/$/, '')}/auth/google/callback`;
    const client = getOAuth2Client(redirectUri);
    
    const url = client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events"
      ],
      prompt: "consent"
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    const appUrl = process.env.APP_URL || `http://localhost:3000`;
    const redirectUri = `${appUrl.replace(/\/$/, '')}/auth/google/callback`;
    const client = getOAuth2Client(redirectUri);

    try {
      const { tokens } = await client.getToken(code as string);
      
      // Store tokens in a secure cookie
      res.cookie("google_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/google/status", (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ 
      isAuthenticated: !!tokens,
      hasConfig: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });
  });

  app.get("/api/auth/google/config", (req, res) => {
    const appUrl = process.env.APP_URL || `http://localhost:3000`;
    res.json({
      clientId: process.env.GOOGLE_CLIENT_ID ? "Configured" : "Missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Configured" : "Missing",
      redirectUri: `${appUrl.replace(/\/$/, '')}/auth/google/callback`,
      appUrl: appUrl
    });
  });

  app.post("/api/auth/google/logout", (req, res) => {
    res.clearCookie("google_tokens", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });
    res.json({ success: true });
  });

  // Gmail API Routes
  app.get("/api/gmail/list", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      const folder = (req.query.folder as string || 'inbox').toLowerCase();
      let q = "label:INBOX";
      if (folder === 'sent') q = "label:SENT";
      if (folder === 'trash') q = "label:TRASH";
      if (folder === 'archive') q = "-label:INBOX -label:TRASH -label:SENT";

      const response = await gmail.users.messages.list({
        userId: "me",
        maxResults: 20,
        q: q
      });

      const messages = response.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async (msg) => {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!
          });
          
          const headers = details.data.payload?.headers || [];
          const subject = headers.find(h => h.name === "Subject")?.value || "(No Subject)";
          const from = headers.find(h => h.name === "From")?.value || "Unknown";
          const date = headers.find(h => h.name === "Date")?.value || "";
          
          const labelIds = details.data.labelIds || [];
          let mappedFolder = 'inbox';
          if (labelIds.includes('SENT')) mappedFolder = 'sent';
          if (labelIds.includes('TRASH')) mappedFolder = 'trash';
          if (!labelIds.includes('INBOX') && !labelIds.includes('SENT') && !labelIds.includes('TRASH')) mappedFolder = 'archive';

          return {
            id: msg.id,
            from,
            subject,
            snippet: details.data.snippet || "",
            date,
            unread: labelIds.includes("UNREAD"),
            folder: mappedFolder
          };
        })
      );

      res.json(detailedMessages);
    } catch (error) {
      console.error("Error fetching Gmail messages:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  app.get("/api/gmail/message/:id", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      const response = await gmail.users.messages.get({
        userId: "me",
        id: req.params.id
      });

      // Simple body extraction (handles plain text)
      let body = "";
      const parts = response.data.payload?.parts || [];
      if (parts.length > 0) {
        const textPart = parts.find(p => p.mimeType === "text/plain");
        if (textPart && textPart.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString();
        } else {
          // Fallback to first part if no plain text
          if (parts[0].body?.data) {
            body = Buffer.from(parts[0].body.data, "base64").toString();
          }
        }
      } else if (response.data.payload?.body?.data) {
        body = Buffer.from(response.data.payload.body.data, "base64").toString();
      }

      const headers = response.data.payload?.headers || [];
      const subject = headers.find(h => h.name === "Subject")?.value || "";
      const from = headers.find(h => h.name === "From")?.value || "";
      const date = headers.find(h => h.name === "Date")?.value || "";

      res.json({
        id: response.data.id,
        from,
        subject,
        body,
        date,
        labelIds: response.data.labelIds
      });
    } catch (error) {
      console.error("Error fetching Gmail message details:", error);
      res.status(500).json({ error: "Failed to fetch email details" });
    }
  });

  app.post("/api/gmail/send", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    const { to, subject, body, threadId } = req.body;

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
      const messageParts = [
        `To: ${to}`,
        `Content-Type: text/plain; charset=utf-8`,
        `MIME-Version: 1.0`,
        `Subject: ${utf8Subject}`,
        "",
        body,
      ];
      const message = messageParts.join("\n");

      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
          threadId: threadId
        },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending Gmail message:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/gmail/archive/:id", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      await gmail.users.messages.modify({
        userId: "me",
        id: req.params.id,
        requestBody: {
          removeLabelIds: ["INBOX"]
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error archiving Gmail message:", error);
      res.status(500).json({ error: "Failed to archive email" });
    }
  });

  app.post("/api/gmail/trash/:id", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      await gmail.users.messages.trash({
        userId: "me",
        id: req.params.id
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error trashing Gmail message:", error);
      res.status(500).json({ error: "Failed to trash email" });
    }
  });

  app.post("/api/gmail/unread/:id", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      await gmail.users.messages.modify({
        userId: "me",
        id: req.params.id,
        requestBody: {
          addLabelIds: ["UNREAD"]
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking Gmail message as unread:", error);
      res.status(500).json({ error: "Failed to mark as unread" });
    }
  });

  app.post("/api/gmail/read/:id", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const gmail = google.gmail({ version: "v1", auth: client });

      await gmail.users.messages.modify({
        userId: "me",
        id: req.params.id,
        requestBody: {
          removeLabelIds: ["UNREAD"]
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking Gmail message as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  // Calendar API Routes
  app.get("/api/calendar/events", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const calendar = google.calendar({ version: "v3", auth: client });

      // Fetch the primary calendar's metadata to get the time zone
      const calendarMetadata = await calendar.calendars.get({ calendarId: "primary" });
      const timeZone = calendarMetadata.data.timeZone || "UTC";

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Fetch from 1 week ago
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Fetch up to 30 days ahead
        singleEvents: true,
        orderBy: "startTime",
      });

      res.json({
        timeZone,
        events: response.data.items || []
      });
    } catch (error) {
      console.error("Error fetching Calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar/sync", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not authenticated" });

    const { workOrders } = req.body; // Expecting an array of work orders to sync

    try {
      const tokens = JSON.parse(tokensStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const calendar = google.calendar({ version: "v3", auth: client });

      const results = [];
      for (const wo of workOrders) {
        // Check if event already exists (using a private extended property or searching by title/description)
        // For simplicity in this demo, we'll just create them if they have a specific tag in description
        
        const event = {
          summary: `CRM: ${wo.serviceType} - ${wo.customerName}`,
          location: wo.address,
          description: `Work Order ID: ${wo.id}\nPriority: ${wo.priority}\nSynced from DealPipeline CRM`,
          start: {
            dateTime: `${wo.date}T09:00:00Z`, // Default to 9 AM UTC for now, or handle properly
            timeZone: "UTC",
          },
          end: {
            dateTime: `${wo.date}T11:00:00Z`, // Default 2 hour duration
            timeZone: "UTC",
          },
          extendedProperties: {
            private: {
              crmWorkOrderId: wo.id
            }
          }
        };

        // Search for existing event with this CRM ID
        const existingResponse = await calendar.events.list({
          calendarId: "primary",
          privateExtendedProperty: [`crmWorkOrderId=${wo.id}`]
        });

        const existingItems = existingResponse.data.items || [];

        if (existingItems.length > 0) {
          // Update existing
          const updated = await calendar.events.update({
            calendarId: "primary",
            eventId: existingItems[0].id!,
            requestBody: event
          });
          results.push({ id: wo.id, status: 'updated', googleId: updated.data.id });
        } else {
          // Create new
          const created = await calendar.events.insert({
            calendarId: "primary",
            requestBody: event
          });
          results.push({ id: wo.id, status: 'created', googleId: created.data.id });
        }
      }

      res.json({ success: true, results });
    } catch (error) {
      console.error("Error syncing Calendar events:", error);
      res.status(500).json({ error: "Failed to sync calendar events" });
    }
  });

  app.post("/api/slack/notify", (req, res) => {
    const { channel, message } = req.body;
    console.log(`[SLACK MOCK] Sending to #${channel}: ${message}`);
    res.json({ success: true, ts: Date.now().toString() });
  });

  // --- SECURITY & AUTH ROUTES ---
  app.post("/api/auth/otp/send", async (req, res) => {
    const { email, userId, isNewUser } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    
    otps.set(userId || email, { otp, expiresAt });

    // Send OTP to Master Admin via Gmail API
    const tokensStr = req.cookies.google_tokens;
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        const client = getOAuth2Client();
        client.setCredentials(tokens);
        const gmail = google.gmail({ version: "v1", auth: client });

        const subject = isNewUser ? "New User Registration OTP" : "User Login OTP";
        const body = `An OTP has been requested for ${email}. OTP: ${otp}. This OTP expires in 10 minutes.`;

        for (const masterEmail of MASTER_ADMIN_EMAILS) {
          const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
          const messageParts = [
            `To: ${masterEmail}`,
            `Content-Type: text/plain; charset=utf-8`,
            `MIME-Version: 1.0`,
            `Subject: ${utf8Subject}`,
            "",
            body,
          ];
          const message = messageParts.join("\n");
          const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

          await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw: encodedMessage },
          });
        }
      } catch (e) {
        console.error("Error sending OTP email:", e);
      }
    } else {
      console.log(`[OTP MOCK] No Gmail tokens. OTP for ${email}: ${otp} (Sent to Master Admin)`);
    }

    res.json({ success: true, message: "OTP sent to the admin" });
  });

  app.post("/api/auth/otp/verify", (req, res) => {
    const { email, userId, otp } = req.body;
    const key = userId || email;
    const stored = otps.get(key);

    if (stored && stored.otp === otp && stored.expiresAt > Date.now()) {
      otps.delete(key);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid or expired OTP" });
    }
  });

  app.post("/api/auth/device/register", (req, res) => {
    const { userId, deviceName, deviceFingerprint } = req.body;
    deviceRegistrations.set(deviceFingerprint, {
      userId,
      deviceName,
      status: 'Approved', // Auto-approving for demo purposes, but logic is there
      registeredAt: new Date().toISOString()
    });
    res.json({ success: true });
  });

  app.get("/api/auth/device/check", (req, res) => {
    const { deviceFingerprint } = req.query;
    const registration = deviceRegistrations.get(deviceFingerprint);
    res.json({ isRegistered: !!registration, registration });
  });

  // --- WORKFLOW MONITORING & KPI ROUTES ---
  app.get("/api/workflows/instances", (req, res) => {
    // Mock active instances
    const instances = [
      { id: 'inst_1', workflowId: 'wf_1', workflowName: 'Auto-Assign Notification', startTime: new Date(Date.now() - 5000).toISOString(), status: 'Running', currentStepIndex: 1, logs: ['Triggered by WO-2026-001', 'Finding technician...'] },
      { id: 'inst_2', workflowId: 'wf_2', workflowName: 'Customer Reply Alert', startTime: new Date(Date.now() - 15000).toISOString(), status: 'Completed', currentStepIndex: 2, logs: ['Triggered by Email from Alice', 'Notification sent to Admin'] }
    ];
    res.json(instances);
  });

  app.get("/api/workflows/kpis", (req, res) => {
    res.json(workflowKPIs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
