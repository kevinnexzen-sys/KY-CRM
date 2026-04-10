
import React, { useState, useEffect } from 'react';
import { 
  Mail, Inbox, Send, Archive, Trash2, Plus, Search, 
  MoreVertical, Reply, CornerUpRight, Star, Paperclip, 
  RefreshCw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LogIn, Lock, File,
  X, Minimize2, Image, Check, Sparkles, AlertCircle, ArrowRight, Eye, FileText, FilePlus,
  LayoutTemplate, Edit2, Save, Loader2, FileType, DollarSign, Circle,
  Clock, User as UserIcon, ArrowUpDown, Smile
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateAIResponse } from '../services/geminiService';
import { WorkOrder, WorkOrderStatus, Priority, EmailTemplate, Email } from '../types';

const MOCK_EMAILS_DATA = [
  { 
    id: 1, 
    from: 'Alice Johnson', 
    email: 'alice.j@example.com',
    subject: 'Re: HVAC Repair Estimate - 123 Maple Ave', 
    preview: 'Hi Kevin, thanks for the estimate. Can we proceed with the repair this Tuesday? Also, regarding the warranty...', 
    body: `Hi Kevin,\n\nThanks for the estimate. Can we proceed with the repair this Tuesday?\n\nAlso, regarding the warranty on the new compressor, is that 5 years or 10 years?\n\nBest,\nAlice`,
    date: '10:42 AM', 
    unread: true, 
    folder: 'inbox',
    avatar: 'AJ',
    aiAnalysis: null as any,
    aiSummary: null as string | null,
    attachments: [] as any[]
  },
  { 
    id: 2, 
    from: 'Google Business Profile', 
    email: 'noreply@google.com',
    subject: 'Performance report for Nexzen Services', 
    preview: 'Your business profile views are up 15% this month. See how customers are finding you.', 
    body: `Your Monthly Performance Report\n\nViews: 1,240 (+15%)\nSearches: 850 (+5%)\n\nKeep your profile updated to maintain momentum.`,
    date: 'Yesterday', 
    unread: false, 
    folder: 'inbox',
    avatar: 'G',
    aiAnalysis: null as any,
    aiSummary: null as string | null,
    attachments: [] as any[]
  },
  { 
    id: 3, 
    from: 'Bob Smith', 
    email: 'bob.smith@example.com',
    subject: 'Urgent: Leaking Pipe in Basement', 
    preview: 'I have a major leak in the kitchen under the sink. It started about an hour ago and I cannot stop it.', 
    body: `Kevin,\n\nI have a major leak in the kitchen under the sink. It started about an hour ago and I cannot stop it. Can you send someone immediately?\n\nThanks,\nBob`,
    date: 'Oct 24', 
    unread: false, 
    folder: 'inbox',
    avatar: 'BS',
    aiAnalysis: {
        isServiceRequest: true,
        customerName: 'Bob Smith',
        serviceType: 'Plumbing',
        priority: 'Urgent',
        address: '123 Main St (Inferred)',
        confidence: 0.85,
        summary: 'Major kitchen sink leak reported.',
        detectedAttachments: null
    },
    aiSummary: null as string | null,
    attachments: [] as any[]
  },
  { 
    id: 4, 
    from: 'Supplier Inc.', 
    email: 'orders@supplier.com',
    subject: 'Invoice #9923 Paid', 
    preview: 'Receipt for your recent order of copper fittings and PVC pipes.', 
    body: `Receipt attached for Order #9923.\n\nTotal: $450.00\nDate: Oct 20, 2023\n\nThank you for your business.`,
    date: 'Oct 20', 
    unread: false, 
    folder: 'inbox',
    avatar: 'S',
    aiAnalysis: null as any,
    aiSummary: null as string | null,
    attachments: [] as any[]
  },
];

export const EmailClient: React.FC = () => {
  const { 
    isEmailConnected, setIsEmailConnected, emailDraft, clearEmailDraft, 
    clients, addWorkOrder, workOrders,
    emailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate,
    isGmailAuthenticated, hasGmailConfig, checkGmailAuth, fetchGmailList, fetchGmailMessage, fetchGmailConfig, sendGmail, logoutGmail,
    archiveGmail, trashGmail, markAsUnread, markAsRead,
    emailActivity, updateEmailActivity, currentUser
  } = useData();
  
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  
  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'important'>('all');
  
  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // Template Manager State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<string | null>(null);
  
  // AI State
  const [isScanning, setIsScanning] = useState(false);
  const [hasAutoChecked, setHasAutoChecked] = useState(false);
  const [isInsightExpanded, setIsInsightExpanded] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real Gmail Loading State
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [configDetails, setConfigDetails] = useState<any>(null);
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  // Mark as important state (local for now, in real app would be a Gmail label)
  const [importantEmails, setImportantEmails] = useState<Set<string>>(new Set());

  // Effect to handle incoming drafts from other modules
  useEffect(() => {
    if (emailDraft) {
      if (!isGmailAuthenticated) {
         // In real app, prompt login
         handleToast("Please connect your Gmail account first.");
         return;
      }
      setComposeTo(emailDraft.to);
      setComposeSubject(emailDraft.subject);
      setComposeBody(emailDraft.body);
      setIsComposeOpen(true);
      clearEmailDraft();
    }
  }, [emailDraft, isGmailAuthenticated, clearEmailDraft]);

  // Fetch real emails when authenticated or folder changes
  useEffect(() => {
    if (isGmailAuthenticated) {
      loadEmails(selectedFolder);
    }
  }, [isGmailAuthenticated, selectedFolder]);

  const loadEmails = async (folder: string = 'inbox') => {
    setIsLoadingEmails(true);
    // Map folder names to Gmail labels if needed
    const gmailFolder = folder.toLowerCase();
    const gmailEmails = await fetchGmailList(gmailFolder);
    
    const mapped = gmailEmails.map(e => ({
      ...e,
      preview: e.snippet,
      body: e.snippet, // Initially just snippet, will fetch full body on select
      avatar: e.from.charAt(0).toUpperCase(),
      aiAnalysis: null,
      aiSummary: null,
      attachments: []
    }));
    setEmails(mapped);
    setIsLoadingEmails(false);
  };

  // Listen for OAuth success
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkGmailAuth();
        handleToast("Gmail connected successfully!");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkGmailAuth]);

  const handleConnectGoogle = async () => {
    if (!hasGmailConfig) {
      const config = await fetchGmailConfig();
      setConfigDetails(config);
      setShowConfigGuide(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get auth URL");
      }
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (e: any) {
      console.error(e);
      handleToast(e.message || "Failed to initiate Google login");
      // If it failed, maybe show config guide anyway
      const config = await fetchGmailConfig();
      setConfigDetails(config);
      setShowConfigGuide(true);
    }
  };

  const handleLogoutGoogle = async () => {
    await logoutGmail();
    setEmails([]);
    setSelectedEmail(null);
    handleToast("Gmail disconnected");
  };

  // Fetch full message body and mark as read when an email is selected
  useEffect(() => {
    const fetchFullBody = async () => {
      if (selectedEmail && !selectedEmail.fullBodyFetched && isGmailAuthenticated) {
        const fullMsg = await fetchGmailMessage(selectedEmail.id);
        if (fullMsg) {
          const updated = { ...selectedEmail, body: fullMsg.body, fullBodyFetched: true, unread: false };
          setSelectedEmail(updated);
          setEmails(prev => prev.map(e => e.id === selectedEmail.id ? updated : e));
          
          // Mark as read in Gmail
          if (selectedEmail.unread) {
            await markAsRead(selectedEmail.id);
          }
        }
      }
    };
    fetchFullBody();
  }, [selectedEmail?.id, isGmailAuthenticated]);

  const handleToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- TEMPLATE LOGIC ---
  const handleInsertTemplate = (template: EmailTemplate) => {
    setComposeSubject(template.subject);
    setComposeBody(template.body);
    setShowTemplateMenu(false);
    handleToast(`Template "${template.name}" inserted`);
  };

  const handleNewTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: 'New Template',
      subject: '',
      body: ''
    };
    addEmailTemplate(newTemplate);
    setSelectedTemplateId(newTemplate.id);
    setEditingTemplate(newTemplate);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateEmailTemplate(editingTemplate.id, editingTemplate);
      handleToast('Template saved');
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteEmailTemplate(id);
      if (selectedTemplateId === id) {
        setSelectedTemplateId(null);
        setEditingTemplate(null);
      }
      handleToast('Template deleted');
    }
  };

  // --- AI LOGIC ---

  const handleCheckMail = async () => {
    if (!isGmailAuthenticated) {
      handleToast("Please connect Gmail first");
      return;
    }
    setIsScanning(true);
    await loadEmails(selectedFolder);
    setIsScanning(false);
    handleToast("Inbox refreshed");
  };

  const handleScanInbox = async () => {
    if (!isGmailAuthenticated) {
      handleToast("Please connect Gmail first");
      return;
    }
    
    // Scan unread emails in the current folder that haven't been analyzed
    const unreadEmails = emails.filter(e => e.unread && !e.aiAnalysis);
    if (unreadEmails.length === 0) {
      handleToast("No new unread emails to scan in this folder.");
      return;
    }

    setIsScanning(true);
    handleToast(`Scanning ${unreadEmails.length} emails with AI...`);
    
    // Scan up to 5 unread emails to avoid hitting rate limits too hard in one go
    const toScan = unreadEmails.slice(0, 5);
    for (const email of toScan) {
      await analyzeEmail(email, emails);
    }
    
    setIsScanning(false);
    handleToast("Inbox scan complete");
  };

  const analyzeEmail = async (email: any, currentEmailList: any[]) => {
    try {
        const images = email.attachments?.map((att: any) => ({
            data: att.data,
            mimeType: att.type
        })) || [];

        const prompt = `
            Analyze the following email content and any attached images to extract structured work order details.
            
            Tasks:
            1.  **OCR & Image Analysis**: If images are provided, extract relevant text (e.g. error codes, invoice numbers) and analyze visual urgency (e.g. fire, water damage).
            2.  **Priority Inference**: Determine priority (Low, Medium, High, Urgent) based on keywords (e.g. "leak", "emergency", "smoke") AND visual evidence.
            3.  **Data Extraction**: Extract Customer Name, Address, Service Type, and Corporation Name (if applicable).
            
            Return ONLY a valid JSON object with no markdown:
            {
                "isServiceRequest": boolean,
                "customerName": string,
                "corporation": string | null,
                "address": string,
                "serviceType": string,
                "priority": "Low" | "Medium" | "High" | "Urgent",
                "summary": string,
                "confidence": number (0.0 to 1.0),
                "detectedAttachments": string (Description of what was found in images, e.g. "Thermostat showing Error 503")
            }

            Email Subject: ${email.subject}
            Email Body: ${email.body}
        `;

        const responseText = await generateAIResponse(prompt, undefined, images);
        // Clean markdown if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonStr);

        if (analysis.isServiceRequest) {
            // Update email with analysis
            const emailWithAnalysis = { ...email, aiAnalysis: analysis };
            
            // Auto-create if confidence is VERY high (> 0.98)
            if (analysis.confidence > 0.98) {
                const newOrder: WorkOrder = {
                    id: `WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
                    customerName: analysis.customerName,
                    email: email.email,
                    serviceType: analysis.serviceType,
                    address: analysis.address || 'Address Pending',
                    status: WorkOrderStatus.NEW,
                    priority: analysis.priority as Priority,
                    date: new Date().toISOString().split('T')[0],
                    probability: 100,
                    description: `Auto-created from email: ${analysis.summary}. [AI Note: ${analysis.detectedAttachments}]`,
                    corporation: 'Nexzen',
                    createdAt: new Date().toISOString(),
                    subtasks: [],
                    history: []
                };
                
                addWorkOrder(newOrder);
                emailWithAnalysis.aiAnalysis.autoCreatedId = newOrder.id;
                handleToast(`Work Order ${newOrder.id} Auto-Created`);
            } else {
                handleToast("Work Order Suggestion Ready");
            }

            // Update state
            setEmails(prev => prev.map(e => e.id === email.id ? emailWithAnalysis : e));
            // Update selected if needed
            if (selectedEmail?.id === email.id) {
                setSelectedEmail(emailWithAnalysis);
            }
        } else {
            handleToast("No service request details found in this email.");
            // Optionally mark it as analyzed so we don't show the button again, 
            // but the user might want to try again if they think the AI missed something.
            // For now, just the toast is fine.
        }
    } catch (error) {
        console.error("AI Parse Error", error);
    }
  };

  const handleManualCreate = (email: any) => {
    if (!email.aiAnalysis) return;
    const analysis = email.aiAnalysis;
    
    const newOrder: WorkOrder = {
        id: `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`,
        customerName: analysis.customerName,
        email: email.email,
        serviceType: analysis.serviceType,
        address: analysis.address || 'Address Pending',
        status: WorkOrderStatus.NEW,
        priority: analysis.priority as Priority,
        date: new Date().toISOString().split('T')[0],
        probability: 100,
        description: `Created from email: ${analysis.summary}`,
        corporation: analysis.corporation || 'Nexzen',
        createdAt: new Date().toISOString(),
        subtasks: [],
        history: []
    };
    
    addWorkOrder(newOrder);
    
    const updatedEmail = { 
        ...email, 
        aiAnalysis: { ...analysis, autoCreatedId: newOrder.id } 
    };
    
    setEmails(prev => prev.map(e => e.id === email.id ? updatedEmail : e));
    setSelectedEmail(updatedEmail);
    handleToast(`Work Order ${newOrder.id} Created`);
  };

  const handleAnalyzeServiceRequest = async () => {
    if (!selectedEmail) return;
    setIsAnalyzing(true);
    try {
        await analyzeEmail(selectedEmail, emails);
        handleToast("Analysis complete");
    } catch (error) {
        console.error(error);
        handleToast("Analysis failed");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSummarize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedEmail) return;
    setIsSummarizing(true);
    try {
        const prompt = `Summarize this email in 2 sentences:\nSubject: ${selectedEmail.subject}\nBody: ${selectedEmail.body}`;
        const summary = await generateAIResponse(prompt);
         const updatedEmail = { ...selectedEmail, aiSummary: summary };
         setEmails(prev => prev.map(email => email.id === selectedEmail.id ? updatedEmail : email));
         setSelectedEmail(updatedEmail);
         handleToast("Summary generated");
         setIsInsightExpanded(true);
    } catch (error) {
        console.error(error);
        handleToast("Failed to generate summary");
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleGenerateAiTemplate = async () => {
    if (!selectedEmail) {
        handleToast("Please open an email to generate an AI suggestion.");
        return;
    }

    setIsGeneratingTemplate(true);
    try {
        const images = selectedEmail.attachments?.map((att: any) => ({
            data: att.data,
            mimeType: att.type
        })) || [];

        const prompt = `
            You are a helpful CRM assistant for Nexzen Services. 
            Draft a professional and empathetic email reply to the following customer email.
            
            Customer Name: ${selectedEmail.from}
            Subject: "${selectedEmail.subject}"
            Body: "${selectedEmail.body}"
            
            ${selectedEmail.aiAnalysis ? `Context from AI Analysis: This is a ${selectedEmail.aiAnalysis.priority} priority request for ${selectedEmail.aiAnalysis.serviceType}.` : ''}
            
            Tasks:
            1. Generate a professional reply. 
            2. If it's a new service request, mention that a technician will be dispatched or an inspection scheduled soon.
            3. Use [Dispatcher Name] as a placeholder for the sender.
            
            Return ONLY a valid JSON object:
            {
                "subject": "Re: ${selectedEmail.subject}",
                "body": "Your professional reply here..."
            }
        `;

        const responseText = await generateAIResponse(prompt, undefined, images);
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result = JSON.parse(jsonStr);
            setComposeSubject(result.subject);
            setComposeBody(result.body);
            handleToast("AI Template Suggested");
        } catch (e) {
            setComposeBody(responseText);
            handleToast("AI Suggestion Ready (Text)");
        }
    } catch (error) {
        console.error("Template Gen Error", error);
        handleToast("Failed to generate suggestion");
    } finally {
        setIsGeneratingTemplate(false);
    }
  };

  const handleCreateEstimate = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleToast('Estimate draft created from email');
  };

  const handleArchive = async () => {
    if (selectedEmail) {
        try {
            await archiveGmail(selectedEmail.id);
            setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
            setSelectedEmail(null);
            handleToast("Conversation archived");
        } catch (e) {
            handleToast("Failed to archive");
        }
    }
  };

  const handleDelete = async () => {
    if (selectedEmail) {
        try {
            await trashGmail(selectedEmail.id);
            setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
            setSelectedEmail(null);
            handleToast("Conversation moved to trash");
        } catch (e) {
            handleToast("Failed to delete");
        }
    }
  };

  const handleMarkUnread = async () => {
    if (selectedEmail) {
        try {
            await markAsUnread(selectedEmail.id);
            setEmails(prev => prev.map(e => e.id === selectedEmail.id ? { ...e, unread: true } : e));
            setSelectedEmail(null);
            handleToast("Marked as unread");
        } catch (e) {
            handleToast("Failed to mark as unread");
        }
    }
  };

  const toggleReadStatus = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const email = emails.find(e => e.id === id);
    if (!email) return;

    try {
        if (email.unread) {
            await markAsRead(id);
        } else {
            await markAsUnread(id);
        }
        
        setEmails(prev => prev.map(email => {
          if (email.id === id) {
            const updated = { ...email, unread: !email.unread };
            if (selectedEmail?.id === id) {
              setSelectedEmail(updated);
            }
            return updated;
          }
          return email;
        }));
        handleToast("Read status updated");
    } catch (err) {
        handleToast("Failed to update status");
    }
  };

  // --- STANDARD EMAIL LOGIC ---

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedEmail) return;
    
    try {
      await sendGmail(selectedEmail.from, `Re: ${selectedEmail.subject}`, replyText, selectedEmail.id);
      setReplyText('');
      handleToast(`Reply sent to ${selectedEmail.from}`);
      // Refresh list to show sent email if needed, or just add locally
      handleCheckMail();
    } catch (e) {
      handleToast("Failed to send reply");
    }
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendGmail(composeTo, composeSubject, composeBody);
      setIsComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      handleToast(`Email sent to ${composeTo}`);
      handleCheckMail();
    } catch (e) {
      handleToast("Failed to send email");
    }
  };

  const getFilteredEmails = () => {
      let filtered = [...emails];

      // Folder filter
      if (selectedFolder === 'wo_requests') {
          filtered = filtered.filter(e => e.aiAnalysis && !e.aiAnalysis.autoCreatedId);
      } else if (selectedFolder !== 'templates') {
          filtered = filtered.filter(e => e.folder === selectedFolder);
      }

      // Search filter
      if (searchTerm) {
          const q = searchTerm.toLowerCase();
          filtered = filtered.filter(e => 
            e.subject.toLowerCase().includes(q) || 
            e.from.toLowerCase().includes(q) ||
            e.snippet?.toLowerCase().includes(q)
          );
      }

      // Status filter
      if (filterStatus === 'unread') {
          filtered = filtered.filter(e => e.unread);
      } else if (filterStatus === 'important') {
          filtered = filtered.filter(e => importantEmails.has(e.id));
      }

      // Sorting
      filtered.sort((a, b) => {
          let comparison = 0;
          if (sortBy === 'date') {
              comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          } else if (sortBy === 'sender') {
              comparison = a.from.localeCompare(b.from);
          }
          return sortOrder === 'asc' ? -comparison : comparison;
      });

      return filtered;
  }

  const toggleImportant = (emailId: string) => {
      setImportantEmails(prev => {
          const next = new Set(prev);
          if (next.has(emailId)) next.delete(emailId);
          else next.add(emailId);
          return next;
      });
  };

  const handleAIDraftReply = async () => {
      if (!selectedEmail) return;
      setIsDraftingAI(true);
      try {
          const prompt = `
            Draft a professional and empathetic reply to the following email.
            The reply should address the client's concerns and suggest a next step (e.g. scheduling a technician).
            
            Email From: ${selectedEmail.from}
            Email Subject: ${selectedEmail.subject}
            Email Body: ${selectedEmail.body}
            
            AI Analysis (if any): ${JSON.stringify(selectedEmail.aiAnalysis || {})}
            
            Return ONLY the reply text.
          `;
          const draft = await generateAIResponse(prompt);
          setReplyText(draft.trim());
      } catch (e) {
          console.error(e);
          handleToast("Failed to generate AI draft");
      } finally {
          setIsDraftingAI(false);
      }
  };

  const otherReplying = selectedEmail ? emailActivity[selectedEmail.id] : null;
  const isSomeoneElseReplying = otherReplying && otherReplying.userId !== currentUser?.id;

  // --- CONNECT SCREEN ---
  if (!isGmailAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Connect Your Gmail</h2>
            <p className="text-slate-500 mt-2">
              Sync your Gmail account to receive work order inquiries and reply to clients directly from DealPipeline.
            </p>
          </div>
          
          <div className="space-y-4 pt-4">
            {!hasGmailConfig && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-bold mb-1">Configuration Required</p>
                  <p>Google OAuth credentials are not yet set up. Click below to see instructions.</p>
                </div>
              </div>
            )}
            <button 
              onClick={handleConnectGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-medium text-slate-700"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {hasGmailConfig ? 'Sign in with Google' : 'Setup Google Integration'}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Lock className="w-3 h-3" /> Secure OAuth 2.0 Connection
            </div>
          </div>
        </div>

        {/* Config Guide Modal */}
        {showConfigGuide && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" /> Google Integration Setup
                </h3>
                <button onClick={() => setShowConfigGuide(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Important Security Note</p>
                    <p>Google requires OAuth authentication to happen in a secure popup window. This window will close automatically once you authorize the application.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">1. Google Cloud Console Setup</h4>
                  <p className="text-sm text-slate-600">
                    Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-medium">Google Cloud Credentials</a> page and create an OAuth 2.0 Client ID for a "Web Application".
                  </p>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Authorized Redirect URI</p>
                    <div className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded-lg">
                      <code className="text-xs text-emerald-700 break-all">{configDetails?.redirectUri}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(configDetails?.redirectUri);
                          handleToast("Redirect URI copied!");
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">2. Environment Variables</h4>
                  <p className="text-sm text-slate-600">
                    Once you have your Client ID and Secret, add them to your environment variables in AI Studio:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 ml-2">
                    <li><code className="bg-slate-100 px-1 rounded">GOOGLE_CLIENT_ID</code></li>
                    <li><code className="bg-slate-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code></li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setShowConfigGuide(false)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    I've Configured the Variables
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EMAIL INTERFACE ---
  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="w-4 h-4 text-green-400" />
          {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR: FOLDERS */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 space-y-3">
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="w-full flex items-center gap-2 justify-center bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" /> Compose
          </button>
          
          <button 
            onClick={handleCheckMail}
            disabled={isScanning}
            className={`w-full flex items-center gap-2 justify-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-2 rounded-xl font-medium transition-colors ${isScanning ? 'opacity-70' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} /> 
            {isScanning ? 'Refreshing...' : 'Check Mail'}
          </button>

          <button 
            onClick={handleScanInbox}
            disabled={isScanning}
            className={`w-full flex items-center gap-2 justify-center bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 py-2 rounded-xl font-bold transition-colors ${isScanning ? 'opacity-70' : ''}`}
          >
            <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} /> 
            {isScanning ? 'Scanning...' : 'Scan Inbox with AI'}
          </button>
        </div>
        
        <nav className="flex-1 px-2 space-y-1">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox, count: selectedFolder === 'inbox' ? emails.filter(e => e.unread).length : 0 },
            { id: 'wo_requests', label: 'WO Requests', icon: Sparkles, count: emails.filter(e => e.aiAnalysis && !e.aiAnalysis.autoCreatedId).length, highlight: true },
            { id: 'sent', label: 'Sent', icon: Send, count: selectedFolder === 'sent' ? emails.length : 0 },
            { id: 'drafts', label: 'Drafts', icon: File, count: 0 },
            { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
            { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
            { id: 'templates', label: 'Templates', icon: LayoutTemplate, count: emailTemplates.length },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedFolder(item.id);
                setSelectedEmail(null);
                setEditingTemplate(null);
                setSelectedTemplateId(null);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedFolder === item.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${selectedFolder === item.id ? 'text-emerald-600' : item.highlight ? 'text-purple-500' : 'text-slate-400'}`} />
                {item.label}
              </div>
              {item.count > 0 && (
                <span className={`text-xs font-bold ${selectedFolder === item.id ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className="px-4 py-6 border-t border-slate-200">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Filters</h4>
          <div className="space-y-1">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-slate-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filterStatus === 'all' ? 'bg-emerald-500' : 'bg-slate-300'}`} /> All Messages
            </button>
            <button 
              onClick={() => setFilterStatus('unread')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'unread' ? 'bg-slate-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filterStatus === 'unread' ? 'bg-blue-500' : 'bg-slate-300'}`} /> Unread
            </button>
            <button 
              onClick={() => setFilterStatus('important')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'important' ? 'bg-slate-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <div className={`w-2 h-2 rounded-full ${filterStatus === 'important' ? 'bg-amber-500' : 'bg-slate-300'}`} /> Important
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200">
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-3 text-sm text-slate-500 truncate">
               <div className="w-2 h-2 rounded-full bg-green-500"></div>
               Gmail Connected
             </div>
             <button 
               onClick={handleLogoutGoogle}
               className="text-xs text-red-600 hover:text-red-700 font-medium text-left"
             >
               Disconnect Account
             </button>
           </div>
        </div>
      </div>

      {/* TEMPLATES MANAGER VIEW */}
      {selectedFolder === 'templates' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Template List */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Templates</h3>
              <button 
                onClick={handleNewTemplate}
                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                title="New Template"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {emailTemplates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setEditingTemplate(template);
                  }}
                  className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedTemplateId === template.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900">{template.name}</div>
                  <div className="text-xs text-slate-500 truncate mt-1">{template.subject}</div>
                </div>
              ))}
              {emailTemplates.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">No templates found. Create one!</div>
              )}
            </div>
          </div>

          {/* Template Editor */}
          <div className="flex-1 bg-white flex flex-col">
            {editingTemplate ? (
              <>
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Edit2 className="w-4 h-4" /> Editing: {editingTemplate.name}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteTemplate(editingTemplate.id)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                    <button 
                      onClick={handleSaveTemplate}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-2 font-medium"
                    >
                      <Save className="w-3 h-3" /> Save Changes
                    </button>
                  </div>
                </div>
                <div className="p-8 space-y-4 max-w-3xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                    <input 
                      type="text" 
                      value={editingTemplate.name}
                      onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Subject</label>
                    <input 
                      type="text" 
                      value={editingTemplate.subject}
                      onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Body</label>
                    <textarea 
                      value={editingTemplate.body}
                      onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}
                      className="w-full p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[300px]"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Tip: Use placeholders like [Client Name] or [Date] which you can manually replace when composing.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <LayoutTemplate className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a template to edit or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STANDARD EMAIL VIEW (List + Reading Pane) */}
      {selectedFolder !== 'templates' && (
      <>
        {/* MIDDLE: EMAIL LIST */}
        <div className={`${selectedEmail ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 flex-col border-r border-slate-200 bg-white`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search mail..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-0 rounded-lg text-sm transition-all" 
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setSortBy('date')}
                  className={`p-1.5 rounded-md transition-all ${sortBy === 'date' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Sort by Date"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSortBy('sender')}
                  className={`p-1.5 rounded-md transition-all ${sortBy === 'sender' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                  title="Sort by Sender"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>
              <button 
                onClick={handleCheckMail}
                disabled={isScanning}
                className={`p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all ${isScanning ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {getFilteredEmails().map((email) => (
              <div 
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors group/item ${
                  selectedEmail?.id === email.id 
                    ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600' 
                    : email.aiAnalysis 
                      ? 'bg-purple-50/20 border-l-4 border-l-purple-400' 
                      : 'border-l-4 border-l-transparent ' + (email.unread ? 'bg-white' : 'bg-slate-50/30')
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <button 
                      onClick={(e) => toggleReadStatus(e, email.id)}
                      className={`shrink-0 w-2.5 h-2.5 rounded-full transition-all ${
                        email.unread ? 'bg-emerald-600' : 'bg-transparent border border-slate-300 group-hover/item:border-emerald-400'
                      }`}
                      title={email.unread ? "Mark as Read" : "Mark as Unread"}
                    />
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          toggleImportant(email.id);
                      }}
                      className={`shrink-0 p-1 rounded hover:bg-slate-100 transition-colors ${importantEmails.has(email.id) ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${importantEmails.has(email.id) ? 'fill-current' : ''}`} />
                    </button>
                    <span className={`text-sm truncate ${email.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {email.from}
                    </span>
                  </div>
                  <span className={`text-xs whitespace-nowrap ${email.unread ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    {email.date}
                  </span>
                </div>
                <div className={`text-sm mb-1 flex items-center gap-1.5 ${email.unread ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                  <span className="truncate">{email.subject}</span>
                  {email.aiAnalysis && (
                    <div className="shrink-0 text-purple-600" title="AI Analysis Available">
                       <Sparkles className="w-3.5 h-3.5 fill-purple-100" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {email.preview}
                </div>
                
                {/* AI Badge for List */}
                {email.aiAnalysis && (
                    <div className="mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-[10px] text-purple-600 font-medium">
                            {email.aiAnalysis.autoCreatedId ? 'Order Created' : 'Manual Review Needed'}
                        </span>
                    </div>
                )}
                {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                    </div>
                )}
              </div>
            ))}
            {getFilteredEmails().length === 0 && (
                <div className="p-8 text-center text-slate-400">
                    <p>No emails in {selectedFolder === 'wo_requests' ? 'WO Requests' : selectedFolder}</p>
                </div>
            )}
          </div>
        </div>

        {/* RIGHT: READING PANE */}
        <div className={`${selectedEmail ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white`}>
          {selectedEmail ? (
            <>
              {/* Header Toolbar */}
              <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                 <div className="flex items-center gap-3 text-slate-500">
                   <button className="lg:hidden p-2 hover:bg-slate-100 rounded-full" onClick={() => setSelectedEmail(null)}>
                     <ChevronLeft className="w-5 h-5" />
                   </button>
                   <button onClick={handleArchive} className="p-2 hover:bg-slate-100 rounded-full" title="Archive">
                     <Archive className="w-5 h-5" />
                   </button>
                   <button onClick={handleDelete} className="p-2 hover:bg-slate-100 rounded-full" title="Delete">
                     <Trash2 className="w-5 h-5" />
                   </button>
                   <div className="h-4 w-px bg-slate-300 mx-1"></div>
                   <button onClick={handleMarkUnread} className="p-2 hover:bg-slate-100 rounded-full" title="Mark Unread">
                     <Mail className="w-5 h-5" />
                   </button>
                   
                   <div className="h-4 w-px bg-slate-300 mx-1"></div>
                   
                   <button className="p-2 hover:bg-slate-100 rounded-full" title="Reply">
                     <Reply className="w-5 h-5" />
                   </button>
                   <button className="p-2 hover:bg-slate-100 rounded-full" title="Forward">
                     <CornerUpRight className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={handleCreateEstimate}
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors ml-2 font-medium" 
                     title="Create Estimate from Email"
                   >
                     <DollarSign className="w-4 h-4" />
                     <span className="text-xs">Estimate</span>
                   </button>
                 </div>
                 <div className="flex items-center gap-2 text-slate-400">
                   <span className="text-xs">1 of {getFilteredEmails().length}</span>
                   <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
                   <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight className="w-4 h-4" /></button>
                 </div>
              </div>

              {/* Email Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                
                {/* AI Insight Card (Collapsible) */}
                {selectedEmail.aiAnalysis ? (
                    <div className={`mb-8 rounded-xl border shadow-sm animate-in slide-in-from-top-4 overflow-hidden transition-all ${
                        selectedEmail.aiAnalysis.autoCreatedId 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-emerald-50 border-emerald-200'
                    }`}>
                        {/* Header (Clickable for toggle) */}
                        <div 
                            className="p-4 flex justify-between items-start cursor-pointer hover:bg-black/5 transition-colors"
                            onClick={() => setIsInsightExpanded(!isInsightExpanded)}
                        >
                            <div className="flex gap-3">
                                <div className={`p-2 rounded-lg ${selectedEmail.aiAnalysis.autoCreatedId ? 'bg-green-100 text-green-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${selectedEmail.aiAnalysis.autoCreatedId ? 'text-green-900' : 'text-emerald-900'}`}>
                                        {selectedEmail.aiAnalysis.autoCreatedId ? 'Work Order Auto-Created' : 'Potential Work Order Detected'}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    selectedEmail.aiAnalysis.confidence >= 0.8 ? 'bg-green-500' : 
                                                    selectedEmail.aiAnalysis.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} 
                                                style={{ width: `${Math.round(selectedEmail.aiAnalysis.confidence * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium">
                                            {Math.round(selectedEmail.aiAnalysis.confidence * 100)}% Confidence
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                                <div className="flex items-center gap-3">
                                    {!selectedEmail.aiAnalysis.autoCreatedId && (
                                         <button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleManualCreate(selectedEmail);
                                          }}
                                          className="flex px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-emerald-700 items-center gap-2 transition-all hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-300"
                                        >
                                            <FilePlus className="w-4 h-4" /> Create Work Order <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button 
                                      onClick={handleSummarize}
                                      disabled={isSummarizing}
                                      className="hidden sm:flex px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-50 items-center gap-1 transition-colors"
                                    >
                                   {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                   Summarize
                                </button>
                                {selectedEmail.aiAnalysis.autoCreatedId && (
                                    <span className="px-3 py-1 bg-white text-green-700 text-xs font-bold rounded-full border border-green-200 shadow-sm">
                                        {selectedEmail.aiAnalysis.autoCreatedId}
                                    </span>
                                )}
                                <button className="text-slate-500 hover:text-slate-700">
                                    {isInsightExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Collapsible Content */}
                        {isInsightExpanded && (
                            <div className="px-4 pb-4 pl-[4.5rem] animate-in slide-in-from-top-2 fade-in duration-200">
                                {selectedEmail.aiSummary && (
                                    <div className="mb-4 bg-white/60 p-3 rounded-lg border border-emerald-100">
                                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                                            <FileType className="w-3 h-3" /> Concise Summary
                                        </p>
                                        <p className="text-sm text-slate-800 leading-relaxed">{selectedEmail.aiSummary}</p>
                                    </div>
                                )}
                                {!selectedEmail.aiAnalysis.autoCreatedId ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-700">
                                            <div><span className="text-slate-500">Customer:</span> <span className="font-medium text-slate-900">{selectedEmail.aiAnalysis.customerName}</span></div>
                                            <div><span className="text-slate-500">Trade:</span> <span className="font-medium text-slate-900">{selectedEmail.aiAnalysis.serviceType}</span></div>
                                            <div><span className="text-slate-500">Priority:</span> <span className={`font-medium ${selectedEmail.aiAnalysis.priority === 'Urgent' ? 'text-red-600' : 'text-slate-900'}`}>{selectedEmail.aiAnalysis.priority}</span></div>
                                            <div><span className="text-slate-500">Address:</span> <span className="font-medium text-slate-900 truncate" title={selectedEmail.aiAnalysis.address}>{selectedEmail.aiAnalysis.address}</span></div>
                                            {selectedEmail.aiAnalysis.detectedAttachments && (
                                                <div className="col-span-2 pt-2 border-t border-emerald-200/50 mt-1">
                                                    <span className="text-slate-500">Visual Analysis:</span> {selectedEmail.aiAnalysis.detectedAttachments}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleManualCreate(selectedEmail);
                                              }}
                                              className="flex-1 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-700 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                Create Work Order <ArrowRight className="w-3 h-3" />
                                            </button>
                                             <button 
                                              onClick={handleSummarize}
                                              disabled={isSummarizing}
                                              className="px-3 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                                                Summarize
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                                        <div><span className="text-slate-500">Customer:</span> {selectedEmail.aiAnalysis.customerName}</div>
                                        <div><span className="text-slate-500">Trade:</span> {selectedEmail.aiAnalysis.serviceType}</div>
                                        <div className="col-span-2 mt-1 pt-2 border-t border-green-200/50">
                                            <span className="text-slate-500">Status:</span> Order successfully generated and assigned to the dispatch queue.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Generic AI Actions for non-WO emails */
                    <div className="mb-6 flex gap-2">
                        <button 
                            onClick={handleAnalyzeServiceRequest}
                            disabled={isAnalyzing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-emerald-200"
                        >
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Analyze Service Request
                        </button>
                        {selectedEmail.aiSummary ? (
                             <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-purple-600" /> AI Summary
                                    </p>
                                    <button 
                                        onClick={handleSummarize}
                                        disabled={isSummarizing}
                                        className="text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${isSummarizing ? 'animate-spin' : ''}`} /> Regenerate
                                    </button>
                                </div>
                                <p className="text-sm text-slate-800 leading-relaxed">{selectedEmail.aiSummary}</p>
                            </div>
                        ) : (
                            <button 
                                onClick={handleSummarize}
                                disabled={isSummarizing}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                            >
                                {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
                                Summarize with AI
                            </button>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700">
                       {selectedEmail.avatar}
                     </div>
                     <div>
                       <div className="flex items-center gap-3">
                         <h3 className="text-xl font-bold text-slate-900">{selectedEmail.subject}</h3>
                         <button 
                           onClick={() => toggleImportant(selectedEmail.id)}
                           className={`p-1.5 rounded-lg border transition-all ${importantEmails.has(selectedEmail.id) ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                         >
                           <Star className={`w-4 h-4 ${importantEmails.has(selectedEmail.id) ? 'fill-current' : ''}`} />
                         </button>
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="font-medium text-slate-700">{selectedEmail.from}</span>
                          <span className="text-slate-400 text-sm">&lt;{selectedEmail.email}&gt;</span>
                       </div>
                     </div>
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                     {selectedEmail.date}
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-line leading-relaxed mb-6">
                  {selectedEmail.body}
                </div>

                {/* Attachments Section */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mb-8 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Paperclip className="w-4 h-4" /> Attachments ({selectedEmail.attachments.length})
                        </h4>
                        <div className="flex flex-wrap gap-4">
                            {selectedEmail.attachments.map((att: any, idx: number) => (
                                <div key={idx} className="group relative w-32 h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer">
                                    {att.type.startsWith('image/') ? (
                                        <img src={`data:${att.type};base64,${att.data}`} alt={att.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <File className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button className="p-1.5 bg-white rounded-full text-slate-700 hover:text-emerald-600"><Eye className="w-4 h-4" /></button>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-1.5 text-[10px] truncate">
                                        {att.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reply Box */}
                <div className="mt-10 border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
                  {isSomeoneElseReplying && (
                    <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center gap-3 animate-pulse">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <div className="text-xs text-amber-800">
                        <span className="font-bold">{otherReplying.userName}</span> is currently drafting a reply to this email. 
                        To prevent duplicate efforts, please coordinate before sending.
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-50 p-3 flex items-center justify-between border-b border-slate-200 text-slate-500">
                     <div className="flex items-center gap-2">
                       <Reply className="w-4 h-4 ml-1" />
                       <span className="text-sm">Replying to <strong>{selectedEmail.from}</strong></span>
                     </div>
                     <button 
                        onClick={handleAIDraftReply}
                        disabled={isDraftingAI}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-all border border-purple-100 disabled:opacity-50"
                      >
                        {isDraftingAI ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI Draft
                      </button>
                  </div>
                  <textarea 
                    value={replyText} 
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => updateEmailActivity(selectedEmail.id, { userId: currentUser?.id, userName: currentUser?.name, type: 'replying' })}
                    onBlur={() => {
                      if (!replyText) updateEmailActivity(selectedEmail.id, null);
                    }}
                    placeholder="Write a reply..."
                    className="w-full p-4 min-h-[150px] focus:outline-none resize-none text-sm"
                  ></textarea>
                  <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center">
                     <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                          title="Insert Template"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                     </div>
                     <button 
                       onClick={handleSendReply}
                       className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
                     >
                       Send Reply <Send className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                 <Mail className="w-10 h-10 text-slate-300" />
               </div>
               <p className="text-lg font-medium text-slate-500">Select an email to read</p>
            </div>
          )}
        </div>
      </>
      )}

      {/* COMPOSE MODAL */}
      {isComposeOpen && (
        <div className="absolute bottom-0 right-10 w-[500px] bg-white rounded-t-xl shadow-2xl border border-slate-200 z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white px-4 py-3 rounded-t-xl flex justify-between items-center cursor-pointer" onClick={() => setIsComposeOpen(false)}>
                <span className="font-bold text-sm">New Message</span>
                <div className="flex gap-2">
                    <Minimize2 className="w-4 h-4 text-slate-400 hover:text-white" />
                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                </div>
            </div>
            {/* Body */}
            <form onSubmit={handleSendCompose} className="flex-1 flex flex-col relative">
                <div className="relative">
                  <input 
                      className="w-full border-b border-slate-100 px-4 py-2 text-sm focus:outline-none" 
                      placeholder="To" 
                      value={composeTo}
                      onChange={e => setComposeTo(e.target.value)}
                      list="clients-list"
                      required
                      autoFocus
                  />
                  <datalist id="clients-list">
                    {clients.map(client => (
                      <option key={client.id} value={client.email}>{client.name}</option>
                    ))}
                  </datalist>
                </div>
                 <input 
                    className="border-b border-slate-100 px-4 py-2 text-sm focus:outline-none" 
                    placeholder="Subject" 
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    required
                />
                <textarea 
                    className="flex-1 p-4 text-sm focus:outline-none resize-none min-h-[300px]" 
                    placeholder="Message..."
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                ></textarea>
                
                {/* Footer */}
                <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex gap-2 relative items-center">
                         <button type="button" className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><Paperclip className="w-4 h-4" /></button>
                         <button type="button" className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><Image className="w-4 h-4" /></button>
                         <div className="relative">
                           <button 
                              type="button" 
                              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                              className="p-2 hover:bg-slate-200 rounded-full text-slate-500" 
                              title="Insert Template"
                           >
                              <FileText className="w-4 h-4" />
                           </button>
                           {showTemplateMenu && (
                             <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                               <div className="p-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                 Select Template
                               </div>
                               <div className="max-h-48 overflow-y-auto">
                                 {emailTemplates.map(template => (
                                   <button 
                                     key={template.id}
                                     type="button"
                                     onClick={() => handleInsertTemplate(template)}
                                     className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-600 truncate"
                                   >
                                     {template.name}
                                   </button>
                                 ))}
                                 {emailTemplates.length === 0 && (
                                   <div className="px-4 py-2 text-xs text-slate-400 italic">No templates available</div>
                                 )}
                               </div>
                             </div>
                           )}
                         </div>
                         
                         {/* AI SUGGESTION BUTTON */}
                         <button 
                            type="button" 
                            onClick={handleGenerateAiTemplate}
                            disabled={isGeneratingTemplate}
                            className={`p-2 hover:bg-emerald-50 rounded-full transition-all ${isGeneratingTemplate ? 'text-emerald-600 animate-pulse' : 'text-emerald-50 hover:text-emerald-700'}`}
                            title="Generate AI Template Suggestion"
                         >
                            {isGeneratingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                         </button>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setIsComposeOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 text-sm">Discard</button>
                        <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2">
                            Send <Send className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
      )}
    </div>
  );
};
