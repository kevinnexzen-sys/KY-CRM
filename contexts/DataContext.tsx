
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_WORK_ORDERS, MOCK_TECHNICIANS, MOCK_CHATS } from '../constants';
import { WorkOrder, Technician, WorkOrderStatus, Priority, ChatGroup, ChatMessage, TrainingSession, BrowserTab, View, EmailTemplate, Invoice, Task, User, AuditLog, Subtask, WorkflowStep, WorkflowVersion, WorkflowInstance, WorkflowKPI, Notification, Customer, ScheduledEmail, InventoryItem, InventoryAlert, Employee } from '../types';
import { generateAIResponse } from '../services/geminiService';

// --- INITIAL MOCK DATA EXTENSIONS ---
const INITIAL_INVOICES: Invoice[] = [
  { id: 'INV-1001', workOrderId: 'WO-2024-001', client: 'Alice Johnson', date: 'Mar 05, 2026', amount: '$1,250.00', laborCost: 800, partsCost: 450, status: 'PAID' },
  { id: 'INV-1002', workOrderId: 'WO-2024-004', client: 'Delta Corp', date: 'Mar 03, 2026', amount: '$850.00', laborCost: 500, partsCost: 350, status: 'PENDING' },
];

const INITIAL_CLIENTS: Customer[] = [
  { id: 1, name: 'Alice Johnson', type: 'Residential', contact: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', address: '123 Maple Ave, Austin, TX', notes: 'Prefers morning appointments.' },
  { id: 2, name: 'Bob Smith', type: 'Residential', contact: 'Bob Smith', email: 'bob@example.com', phone: '555-0102', address: '456 Oak Dr, Austin, TX', notes: 'Requires security clearance.' },
  { id: 3, name: 'Charlie Davis', type: 'Residential', contact: 'Charlie Davis', email: 'charlie@example.com', phone: '555-0103', address: '789 Pine Ln, Dallas, TX', notes: 'Gate code: 1234' },
  { id: 4, name: 'Delta Corp', type: 'Corporation', contact: 'John Delta', email: 'contact@deltacorp.com', phone: '555-0104', address: '101 Tech Blvd, Austin, TX', notes: 'Main office maintenance.' },
  { id: 5, name: 'Echo Properties', type: 'Corporation', contact: 'Sarah Echo', email: 'info@echoprop.com', phone: '555-0105', address: '202 Industrial Park, Houston, TX', notes: 'Multiple units.' },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'ADMIN_001',
    name: 'Kevin Nexzen',
    email: 'kevin.nexzen@gmail.com',
    phone: '555-0100',
    role: 'Master Admin',
    status: 'Active',
    dob: '1990-01-01',
    bloodGroup: 'O+',
    nidPassport: '1234567890',
    presentAddress: '123 Tech St, Austin, TX',
    permanentAddress: '123 Tech St, Austin, TX',
    fathersName: 'John Nexzen',
    mothersName: 'Jane Nexzen',
    maritalStatus: 'Single',
    emergencyContact: { name: 'John Nexzen', relationship: 'Father', phone: '555-0101' },
    education: {
      school: 'Austin High',
      schoolYear: '2008',
      college: 'Austin College',
      collegeYear: '2010',
      university: 'UT Austin',
      universityYear: '2014',
      highestDegree: 'B.Sc in Computer Science'
    },
    experience: {
      lastCompany: 'Tech Corp',
      designation: 'Senior Developer',
      yearsOfExperience: '8',
      currentPosition: {
        department: 'Management',
        designation: 'Master Admin',
        employeeId: 'ADMIN_001',
        salary: '$150,000',
        joinDate: '2020-01-01'
      }
    },
    documents: {},
    corporationAccess: ['C1', 'C2', 'C3'],
    permissions: ['all']
  },
  {
    id: 'E1',
    name: 'Sarah Connor',
    email: 'sarah.c@example.com',
    phone: '555-0201',
    role: 'Field Technician',
    status: 'Active',
    dob: '1985-05-12',
    bloodGroup: 'A-',
    nidPassport: '9876543210',
    presentAddress: '456 Resistance Way, Austin, TX',
    permanentAddress: '456 Resistance Way, Austin, TX',
    fathersName: 'Unknown',
    mothersName: 'Unknown',
    maritalStatus: 'Single',
    emergencyContact: { name: 'John Connor', relationship: 'Son', phone: '555-0202' },
    education: {
      school: 'Los Angeles High',
      schoolYear: '2003',
      college: 'LA Community College',
      collegeYear: '2005',
      university: 'N/A',
      universityYear: 'N/A',
      highestDegree: 'Associate Degree'
    },
    experience: {
      lastCompany: 'Cyberdyne Systems',
      designation: 'Security Consultant',
      yearsOfExperience: '15',
      currentPosition: {
        department: 'Field Operations',
        designation: 'Field Technician',
        employeeId: 'E1',
        salary: '$65,000',
        joinDate: '2022-06-15'
      }
    },
    documents: {},
    corporationAccess: ['C1'],
    permissions: ['work_orders.read', 'work_orders.update']
  }
];

const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Review Quarterly Reports', status: 'To Do', dueDate: '2026-10-24', priority: Priority.HIGH, reminderSet: true },
  { id: 2, title: 'Vehicle Maintenance Check', status: 'In Progress', dueDate: '2026-10-25', priority: Priority.MEDIUM, reminderSet: false },
];

const INITIAL_EXPENSES = [
  { id: 1, date: 'Oct 21, 2023', category: 'SOFTWARE', description: 'Figma Subscription', amount: 15.00 },
  { id: 2, date: 'Oct 18, 2023', category: 'FOOD', description: 'Team Lunch', amount: 124.50 },
];

const INITIAL_CORPORATIONS = [
  { id: 'C1', name: 'Delta Corp', properties: 12, revenue: '$45,200', active: true },
  { id: 'C2', name: 'Echo Properties', properties: 8, revenue: '$32,100', active: true },
  { id: 'C3', name: 'Nexzen', properties: 5, revenue: '$12,500', active: true },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'INV-001', name: 'HVAC Filter 20x20x1', sku: 'HF-20201', category: 'HVAC', quantity: 45, minQuantity: 10, unit: 'pcs', price: 12.50, supplier: 'FilterDirect', lastRestocked: '2026-03-01', workOrderIds: [] },
  { id: 'INV-002', name: 'Copper Pipe 1/2"', sku: 'CP-05', category: 'Plumbing', quantity: 120, minQuantity: 50, unit: 'ft', price: 4.20, supplier: 'PipeMaster', lastRestocked: '2026-02-15', workOrderIds: [] },
  { id: 'INV-003', name: 'Circuit Breaker 20A', sku: 'CB-20A', category: 'Electrical', quantity: 8, minQuantity: 15, unit: 'pcs', price: 18.00, supplier: 'VoltSupply', lastRestocked: '2026-01-20', workOrderIds: [] },
];

const INITIAL_BROWSER_TABS: BrowserTab[] = [
  { id: '1', title: 'Google', url: 'https://www.google.com/webhp?igu=1', active: true, history: ['https://www.google.com/webhp?igu=1'] },
  { id: '2', title: 'DealPipeline', url: 'about:blank', active: false, history: ['about:blank'] }
];

const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: '1', name: 'Estimate Follow-up', subject: 'Following up on your estimate', body: 'Hi [Client Name],\n\nI wanted to check in regarding the estimate I sent over earlier. Do you have any questions?\n\nBest,\n[Your Name]' },
  { id: '2', name: 'Appointment Confirmation', subject: 'Appointment Confirmed', body: 'Hi [Client Name],\n\nThis is to confirm your appointment scheduled for [Date] at [Time].\n\nPlease let us know if you need to reschedule.\n\nThanks,\n[Your Name]' },
  { id: '3', name: 'Invoice Attached', subject: 'Invoice for Recent Services', body: 'Hi [Client Name],\n\nPlease find attached the invoice for the recent services provided.\n\nLet me know if you have any questions.\n\nThanks,\n[Your Name]' },
  { id: '4', name: 'Service Inquiry Follow-up', subject: 'Following up on your service inquiry', body: 'Hi [Client Name],\n\nWe received your inquiry about [Service Type] and are happy to assist. A technician will contact you shortly to schedule an appointment.\n\nBest regards,\nDealPipeline CRM Team' },
  { id: '5', name: 'Job Completion Confirmation', subject: 'Work Order [Work Order ID] Completed', body: 'Hi [Client Name],\n\nThis is to confirm that work order [Work Order ID] for [Service Type] has been completed successfully.\n\nPlease let us know if you have any further questions.\n\nThank you,\nDealPipeline CRM Team' }
];

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

interface DataContextType {
  // Navigation & UI State
  currentView: View;
  navigateTo: (view: View) => void;
  
  // Email Integration
  isEmailConnected: boolean;
  setIsEmailConnected: (connected: boolean) => void;
  emailDraft: EmailDraft | null;
  composeEmail: (to: string, subject?: string, body?: string) => void;
  clearEmailDraft: () => void;
  
  emailTemplates: EmailTemplate[];
  addEmailTemplate: (template: EmailTemplate) => void;
  updateEmailTemplate: (id: string, updates: Partial<EmailTemplate>) => void;
  deleteEmailTemplate: (id: string) => void;

  // Core Data
  workOrders: WorkOrder[];
  selectedWorkOrderId: string | null;
  setSelectedWorkOrderId: (id: string | null) => void;
  addWorkOrder: (order: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  autoAssignTechnician: (workOrder: WorkOrder) => string | undefined;

  technicians: Technician[];
  addTechnician: (tech: Technician) => void;
  deleteTechnician: (id: string) => void;
  updateTechnician: (id: string, updates: Partial<Technician>) => void;

  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  generateInvoice: (workOrderId: string) => void;

  clients: Customer[];
  addClient: (client: Customer) => void;
  updateClient: (id: string | number, updates: Partial<Customer>) => void;
  deleteClient: (id: string | number) => void;

  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: number, updates: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  moveTask: (id: number, newStatus: 'To Do' | 'In Progress' | 'Done') => void;

  expenses: any[];
  addExpense: (expense: any) => void;

  corporations: any[];
  addCorporation: (corp: any) => void;
  updateCorporation: (id: string, updates: Partial<any>) => void;
  deleteCorporation: (id: string) => void;

  // Communication
  chatGroups: ChatGroup[];
  chatMessages: ChatMessage[];
  sendMessage: (groupId: string, text: string, attachments?: any[]) => void;
  createGroup: (name: string, members: string[]) => void;

  // Tools
  browserTabs: BrowserTab[];
  updateBrowserTabs: (tabs: BrowserTab[]) => void;
  trainingSessions: TrainingSession[];
  addTrainingSession: (session: TrainingSession) => void;
  customApps: any[];
  addCustomApp: (app: any) => void;
  updateCustomApp: (id: string, updates: any) => void;
  deleteCustomApp: (id: string) => void;

  workflows: any[];
  addWorkflow: (workflow: any) => void;
  updateWorkflow: (id: string, updates: any) => void;
  deleteWorkflow: (id: string) => void;

  // Security
  currentUser: User | null;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  resendOTP: (email: string) => Promise<void>;
  login: (email: string, password?: string, isNewUser?: boolean) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  registerDevice: (email: string, deviceName: string, deviceFingerprint: string) => Promise<void>;
  checkDevice: (deviceFingerprint: string) => Promise<{ isRegistered: boolean, registration?: any }>;
  logout: () => void;
  isMasterAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;

  // Workflow Monitoring & KPIs
  workflowInstances: WorkflowInstance[];
  workflowKPIs: WorkflowKPI | null;
  fetchWorkflowInstances: () => Promise<void>;
  fetchWorkflowKPIs: () => Promise<void>;
  saveWorkflowVersion: (workflowId: string, name: string) => void;
  revertToVersion: (workflowId: string, versionId: string) => void;

  // Global Search
  globalSearch: (query: string) => any[];

  // Gmail API
  isGmailAuthenticated: boolean;
  hasGmailConfig: boolean;
  checkGmailAuth: () => Promise<void>;
  fetchGmailList: (folder?: string) => Promise<any[]>;
  fetchGmailMessage: (id: string) => Promise<any>;
  fetchGmailConfig: () => Promise<any>;
  sendGmail: (to: string, subject: string, body: string, threadId?: string) => Promise<void>;
  logoutGmail: () => Promise<void>;
  archiveGmail: (id: string) => Promise<void>;
  trashGmail: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  fetchCalendarEvents: () => Promise<any>;
  syncCalendarEvents: (workOrders: WorkOrder[]) => Promise<any>;
  sendSlackNotification: (channel: string, message: string) => Promise<void>;
  
  // Real-time Email Activity
  emailActivity: Record<string, { userId: string, userName: string, type: string, timestamp: string }>;
  updateEmailActivity: (emailId: string, activity: { userId: string, userName: string, type: string } | null) => void;

  // Scheduled Emails
  scheduledEmails: ScheduledEmail[];
  scheduleEmail: (email: Omit<ScheduledEmail, 'id' | 'status' | 'createdAt'>) => void;
  cancelScheduledEmail: (id: string) => void;

  // Inventory
  inventoryItems: InventoryItem[];
  inventoryAlerts: InventoryAlert[];
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  consumeInventory: (itemId: string, quantity: number, workOrderId: string) => void;

  // Automation Suggestions
  automationSuggestions: string[];
  generateAutomationSuggestions: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- AUTH & USER STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const isMasterAdmin = (user: User | null = currentUser) => {
    if (!user) return false;
    const masters = [
      'kevin.nexzen@gmail.com',
      'Kevin.clientmanager@gmail.com',
      'mamun.rashid5957@gmail.com',
      'md.mamun.mm5700@gmail.com'
    ];
    return masters.includes(user.email);
  };

  const hasPermission = (permission: string) => {
    if (!currentUser) return false;
    if (isMasterAdmin()) return true;
    return currentUser.permissions.includes(permission);
  };

  // --- WORKFLOW MONITORING & KPI STATE ---
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>([]);
  const [workflowKPIs, setWorkflowKPIs] = useState<WorkflowKPI | null>(null);

  // --- STATE INITIALIZATION ---
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  // Email State
  const [isEmailConnected, setIsEmailConnected] = useState<boolean>(() => {
    return localStorage.getItem('isEmailConnected') === 'true';
  });
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    const saved = localStorage.getItem('email_templates');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_TEMPLATES;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem('workOrders');
    return saved ? JSON.parse(saved) : MOCK_WORK_ORDERS;
  });

  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const saved = localStorage.getItem('technicians');
    return saved ? JSON.parse(saved) : MOCK_TECHNICIANS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [clients, setClients] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [expenses, setExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [corporations, setCorporations] = useState<any[]>(() => {
    const saved = localStorage.getItem('corporations');
    return saved ? JSON.parse(saved) : INITIAL_CORPORATIONS;
  });

  const [chatGroups, setChatGroups] = useState<ChatGroup[]>(() => {
    const saved = localStorage.getItem('chat_groups');
    return saved ? JSON.parse(saved) : MOCK_CHATS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailActivity, setEmailActivity] = useState<Record<string, any>>({});
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Scheduled Emails State
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>(() => {
    const saved = localStorage.getItem('scheduled_emails');
    return saved ? JSON.parse(saved) : [];
  });

  // Inventory State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventory_items');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>(() => {
    const saved = localStorage.getItem('inventory_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  // Automation Suggestions State
  const [automationSuggestions, setAutomationSuggestions] = useState<string[]>([]);

  // WebSocket for real-time
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'chat:message') {
          const incomingMsg = message.payload;
          setChatMessages(prev => {
            if (prev.some(m => m.id === incomingMsg.id)) return prev;
            return [...prev, { ...incomingMsg, isSelf: incomingMsg.senderId === currentUser?.id }];
          });
          
          setChatGroups(prev => prev.map(g => g.id === incomingMsg.groupId ? {
            ...g,
            lastMessage: incomingMsg.text,
            lastMessageTime: new Date(incomingMsg.timestamp),
            unreadCount: incomingMsg.senderId === currentUser?.id ? 0 : g.unreadCount + 1
          } : g));
        }

        if (message.type === 'notification') {
          const newNotif = message.payload;
          setNotifications(prev => [newNotif, ...prev]);
        }

        if (message.type === 'email:activity') {
          const activityMap = Object.fromEntries(message.payload);
          setEmailActivity(activityMap);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, [currentUser?.id]);

  const updateEmailActivity = (emailId: string, activity: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'email:activity:update',
        payload: { emailId, activity }
      }));
    }
  };

  // Scheduled Emails Logic
  const scheduleEmail = (email: Omit<ScheduledEmail, 'id' | 'status' | 'createdAt'>) => {
    const newEmail: ScheduledEmail = {
      ...email,
      id: `SCH-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    setScheduledEmails(prev => [newEmail, ...prev]);
    
    addNotification({
      userId: currentUser?.id || 'all',
      title: 'Email Scheduled',
      message: `Email to ${email.recipient} scheduled for ${new Date(email.scheduledAt).toLocaleString()}`,
      type: 'info'
    });
  };

  const cancelScheduledEmail = (id: string) => {
    setScheduledEmails(prev => prev.filter(e => e.id !== id));
  };

  // Inventory Logic
  const addInventoryItem = (item: InventoryItem) => setInventoryItems(prev => [...prev, item]);
  
  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Check for low stock alert
        if (updated.quantity <= updated.minQuantity && item.quantity > item.minQuantity) {
          const newAlert: InventoryAlert = {
            id: `ALT-${Date.now()}`,
            itemId: updated.id,
            itemName: updated.name,
            type: updated.quantity === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            message: `${updated.name} is running low (${updated.quantity} ${updated.unit} remaining)`,
            timestamp: new Date().toISOString(),
            isResolved: false
          };
          setInventoryAlerts(prevAlerts => [newAlert, ...prevAlerts]);
          addNotification({
            userId: 'all',
            title: 'Inventory Alert',
            message: newAlert.message,
            type: 'warning'
          });
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteInventoryItem = (id: string) => setInventoryItems(prev => prev.filter(i => i.id !== id));

  const consumeInventory = (itemId: string, quantity: number, workOrderId: string) => {
    setInventoryItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity - quantity);
        const updated = { 
          ...item, 
          quantity: newQty,
          workOrderIds: [...item.workOrderIds, workOrderId]
        };
        
        // Alert logic
        if (newQty <= item.minQuantity) {
          const newAlert: InventoryAlert = {
            id: `ALT-${Date.now()}`,
            itemId: item.id,
            itemName: item.name,
            type: newQty === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            message: `${item.name} is ${newQty === 0 ? 'out of stock' : 'running low'}`,
            timestamp: new Date().toISOString(),
            isResolved: false
          };
          setInventoryAlerts(prevAlerts => [newAlert, ...prevAlerts]);
        }
        
        return updated;
      }
      return item;
    }));
  };

  // Automation Suggestions Logic
  const generateAutomationSuggestions = async () => {
    // In a real app, this would analyze workOrders, tasks, and history
    // For now, we'll use AI to suggest based on current state
    const prompt = `
      Analyze the current CRM state:
      Work Orders: ${workOrders.length}
      Tasks: ${tasks.length}
      Workflows: ${workflows.length}
      
      Suggest 3 new automation workflows that would improve efficiency.
      Return only a JSON array of strings.
    `;
    
    try {
      const response = await generateAIResponse(prompt);
      const cleaned = response.replace(/```json|```/g, '').trim();
      const suggested = JSON.parse(cleaned);
      setAutomationSuggestions(suggested);
    } catch (e) {
      console.error("Failed to generate automation suggestions", e);
      setAutomationSuggestions([
        "Auto-assign HVAC jobs to technicians with >4.5 rating",
        "Send follow-up email 24h after work order completion",
        "Alert admin if a high-priority task is overdue by 2 days"
      ]);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notification,
      id: `N${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Send via WebSocket for real-time broadcast if it's for everyone or specific user
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        payload: newNotif
      }));
    }

    // Optimistic local update
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const [browserTabs, setBrowserTabs] = useState<BrowserTab[]>(() => {
    const saved = localStorage.getItem('browser_tabs');
    return saved ? JSON.parse(saved) : INITIAL_BROWSER_TABS;
  });

  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(() => {
    const saved = localStorage.getItem('training_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [customApps, setCustomApps] = useState<any[]>(() => {
    const saved = localStorage.getItem('custom_apps');
    return saved ? JSON.parse(saved) : [];
  });

  const [workflows, setWorkflows] = useState<any[]>(() => {
    const saved = localStorage.getItem('workflows');
    const initial = [
      { id: 'wf_1', name: 'Auto-Assign Notification', trigger: 'Technician Assigned', action: 'Send Email', active: true, steps: [], versions: [] },
      { id: 'wf_2', name: 'Customer Reply Alert', trigger: 'Email Received', action: 'Notify Admin', active: true, steps: [], versions: [] },
      { id: 'tmpl_1', name: 'New Customer Onboarding', trigger: 'New Client Added', action: 'Send Welcome Email', active: true, steps: [
        { id: 's1', type: 'trigger', label: 'New Client Added', config: {} },
        { id: 's2', type: 'action', label: 'Send Welcome Email', config: { template: 'Welcome' } },
        { id: 's3', type: 'action', label: 'Create Onboarding Task', config: { title: 'Call new client' } }
      ], versions: [] },
      { id: 'tmpl_2', name: 'Equipment Maintenance', trigger: 'Work Order Completed', action: 'Schedule Follow-up', active: true, steps: [
        { id: 's1', type: 'trigger', label: 'Work Order Completed', config: { type: 'Maintenance' } },
        { id: 's2', type: 'condition', label: 'Check Equipment Status', config: { status: 'Needs Service' } },
        { id: 's3', type: 'action', label: 'Create Maintenance WO', config: { priority: 'High' } }
      ], versions: [] }
    ];
    return saved ? JSON.parse(saved) : initial;
  });

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('workOrders', JSON.stringify(workOrders)), [workOrders]);
  useEffect(() => localStorage.setItem('technicians', JSON.stringify(technicians)), [technicians]);
  useEffect(() => localStorage.setItem('invoices', JSON.stringify(invoices)), [invoices]);
  useEffect(() => localStorage.setItem('clients', JSON.stringify(clients)), [clients]);
  useEffect(() => localStorage.setItem('employees', JSON.stringify(employees)), [employees]);
  useEffect(() => localStorage.setItem('tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('corporations', JSON.stringify(corporations)), [corporations]);
  useEffect(() => localStorage.setItem('chat_groups', JSON.stringify(chatGroups)), [chatGroups]);
  useEffect(() => localStorage.setItem('chat_messages', JSON.stringify(chatMessages)), [chatMessages]);
  useEffect(() => localStorage.setItem('notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('browser_tabs', JSON.stringify(browserTabs)), [browserTabs]);
  useEffect(() => localStorage.setItem('training_sessions', JSON.stringify(trainingSessions)), [trainingSessions]);
  useEffect(() => localStorage.setItem('custom_apps', JSON.stringify(customApps)), [customApps]);
  useEffect(() => localStorage.setItem('workflows', JSON.stringify(workflows)), [workflows]);
  useEffect(() => localStorage.setItem('isEmailConnected', String(isEmailConnected)), [isEmailConnected]);
  useEffect(() => localStorage.setItem('email_templates', JSON.stringify(emailTemplates)), [emailTemplates]);
  useEffect(() => localStorage.setItem('scheduled_emails', JSON.stringify(scheduledEmails)), [scheduledEmails]);
  useEffect(() => localStorage.setItem('inventory_items', JSON.stringify(inventoryItems)), [inventoryItems]);
  useEffect(() => localStorage.setItem('inventory_alerts', JSON.stringify(inventoryAlerts)), [inventoryAlerts]);

  // --- LOGIC & ACTIONS ---

  const navigateTo = (view: View) => setCurrentView(view);

  const composeEmail = (to: string, subject: string = '', body: string = '') => {
    setEmailDraft({ to, subject, body });
    setCurrentView(View.EMAIL);
  };

  const clearEmailDraft = () => setEmailDraft(null);

  const addEmailTemplate = (template: EmailTemplate) => setEmailTemplates(prev => [...prev, template]);
  const updateEmailTemplate = (id: string, updates: Partial<EmailTemplate>) => setEmailTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteEmailTemplate = (id: string) => setEmailTemplates(prev => prev.filter(t => t.id !== id));

  const addWorkOrder = (order: WorkOrder) => {
    const newOrder = {
      ...order,
      createdAt: new Date().toISOString(),
      history: [{
        id: `H${Date.now()}`,
        userId: currentUser?.id || 'system',
        userName: currentUser?.name || 'System',
        action: 'Created Work Order',
        timestamp: new Date().toISOString()
      }]
    };
    setWorkOrders(prev => [newOrder, ...prev]);

    // Trigger notification
    addNotification({
      userId: 'all',
      title: 'New Work Order Created',
      message: `Work Order ${newOrder.id} has been created for ${newOrder.customerName}.`,
      type: 'info',
      link: `/work-orders/${newOrder.id}`
    });
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === id) {
        const historyEntry: AuditLog = {
          id: `H${Date.now()}`,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'System',
          action: 'Updated Work Order',
          timestamp: new Date().toISOString(),
          details: Object.keys(updates).map(key => `${key}: ${updates[key as keyof WorkOrder]}`).join(', ')
        };

        // Trigger notification for assignment
        if (updates.assignedTechId && updates.assignedTechId !== wo.assignedTechId) {
          addNotification({
            userId: updates.assignedTechId,
            title: 'New Job Assignment',
            message: `You have been assigned to Work Order ${wo.id} for ${wo.customerName}.`,
            type: 'success',
            link: `/work-orders/${wo.id}`
          });
        }

        // Trigger notification for status change
        if (updates.status && updates.status !== wo.status) {
          addNotification({
            userId: 'all',
            title: 'Work Order Status Updated',
            message: `Work Order ${wo.id} status changed to ${updates.status}.`,
            type: 'info',
            link: `/work-orders/${wo.id}`
          });
        }

        return { ...wo, ...updates, history: [historyEntry, ...(wo.history || [])] };
      }
      return wo;
    }));
  };

  const autoAssignTechnician = (workOrder: WorkOrder): string | undefined => {
    const typeMap: Record<string, string> = { 'HVAC': 'HVAC', 'Plumbing': 'Plumbing', 'Electrical': 'Electrical' };
    const requiredTrade = typeMap[workOrder.serviceType.split(' ')[0]] || 'General';
    
    // AI Logic: Best technician based on:
    // 1. Trade match
    // 2. Active status
    // 3. Skills match (if description mentions specific skills)
    // 4. Lowest workload
    // 5. Highest rating
    // 6. Proximity (if lat/lng available)

    const eligible = technicians.filter(t => t.trade === requiredTrade && t.status === 'Active');
    
    if (eligible.length === 0) return undefined;

    eligible.sort((a, b) => {
      // 1. Workload (primary factor)
      if (a.workload !== b.workload) return a.workload - b.workload;
      // 2. Rating (secondary)
      if (a.rating !== b.rating) return b.rating - a.rating;
      // 3. Proximity (if workOrder has location)
      if (workOrder.lat && workOrder.lng) {
        const distA = Math.sqrt(Math.pow(a.lat - workOrder.lat, 2) + Math.pow(a.lng - workOrder.lng, 2));
        const distB = Math.sqrt(Math.pow(b.lat - workOrder.lat, 2) + Math.pow(b.lng - workOrder.lng, 2));
        return distA - distB;
      }
      return 0;
    });

    return eligible[0].id;
  };

  const addTechnician = (tech: Technician) => setTechnicians(prev => [...prev, tech]);
  const deleteTechnician = (id: string) => setTechnicians(prev => prev.filter(t => t.id !== id));
  const updateTechnician = (id: string, updates: Partial<Technician>) => {
    setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const addInvoice = (invoice: Invoice) => setInvoices(prev => [invoice, ...prev]);

  const generateInvoice = (workOrderId: string) => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) return;

    const labor = wo.laborCost || 0;
    const parts = wo.partsCost || 0;
    const total = labor + parts;

    const newInvoice: Invoice = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      workOrderId: wo.id,
      client: wo.customerName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      laborCost: labor,
      partsCost: parts,
      status: 'PENDING'
    };

    addInvoice(newInvoice);
    updateWorkOrder(wo.id, { status: WorkOrderStatus.INVOICED });
  };
  const addClient = (client: any) => setClients(prev => [client, ...prev]);
  const updateClient = (id: string | number, updates: Partial<any>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteClient = (id: string | number) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };
  const addEmployee = (employee: Employee) => setEmployees(prev => [employee, ...prev]);
  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  };
  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };
  const addTask = (task: Task) => setTasks(prev => [task, ...prev]);
  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };
  const moveTask = (id: number, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };
  const addExpense = (expense: any) => setExpenses(prev => [expense, ...prev]);
  const addCorporation = (corp: any) => setCorporations(prev => [corp, ...prev]);
  const updateCorporation = (id: string, updates: Partial<any>) => {
    setCorporations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteCorporation = (id: string) => {
    setCorporations(prev => prev.filter(c => c.id !== id));
  };

  const sendMessage = (groupId: string, text: string, attachments: any[] = []) => {
    if (!currentUser) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      timestamp: new Date(),
      isSelf: true,
      groupId,
      attachments
    };

    // Send via WebSocket for real-time
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'chat:message',
        payload: newMessage
      }));
      ws.close();
    };

    // Optimistic update
    setChatMessages(prev => [...prev, newMessage]);
    setChatGroups(prev => prev.map(g => g.id === groupId ? {
      ...g,
      lastMessage: text,
      lastMessageTime: new Date(),
      unreadCount: 0
    } : g));
  };

  const createGroup = (name: string, members: string[]) => {
    const newGroup: ChatGroup = {
      id: `G${Date.now()}`,
      name,
      type: 'group',
      members,
      lastMessage: 'Group created',
      lastMessageTime: new Date(),
      unreadCount: 0,
      avatar: 'https://ui-avatars.com/api/?name=' + name.replace(' ', '+')
    };
    setChatGroups(prev => [newGroup, ...prev]);
  };

  const updateBrowserTabs = (tabs: BrowserTab[]) => setBrowserTabs(tabs);
  const addTrainingSession = (session: TrainingSession) => setTrainingSessions(prev => [session, ...prev]);

  const addCustomApp = (app: any) => setCustomApps(prev => [app, ...prev]);
  const updateCustomApp = (id: string, updates: any) => setCustomApps(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  const deleteCustomApp = (id: string) => setCustomApps(prev => prev.filter(a => a.id !== id));

  const addWorkflow = (workflow: any) => setWorkflows(prev => [workflow, ...prev]);
  const updateWorkflow = (id: string, updates: any) => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  const deleteWorkflow = (id: string) => setWorkflows(prev => prev.filter(w => w.id !== id));

  const saveWorkflowVersion = (workflowId: string, name: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        const newVersion: WorkflowVersion = {
          id: `v_${Date.now()}`,
          workflowId,
          version: (w.versions?.length || 0) + 1,
          name: w.name,
          trigger: w.trigger,
          action: w.action,
          steps: [...w.steps],
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Unknown'
        };
        return { ...w, versions: [newVersion, ...(w.versions || [])] };
      }
      return w;
    }));
  };

  const revertToVersion = (workflowId: string, versionId: string) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === workflowId) {
        const version = w.versions.find((v: any) => v.id === versionId);
        if (version) {
          return {
            ...w,
            name: version.name,
            trigger: version.trigger,
            action: version.action,
            steps: [...version.steps]
          };
        }
      }
      return w;
    }));
  };

  const fetchWorkflowInstances = async () => {
    try {
      const res = await fetch('/api/workflows/instances');
      const data = await res.json();
      setWorkflowInstances(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkflowKPIs = async () => {
    try {
      const res = await fetch('/api/workflows/kpis');
      const data = await res.json();
      setWorkflowKPIs(data);
    } catch (e) {
      console.error(e);
    }
  };

  // --- AUTH LOGIC ---
  const login = async (email: string, password?: string, isNewUser: boolean = false) => {
    // For Master Admins, bypass OTP
    const masters = [
      'kevin.nexzen@gmail.com',
      'Kevin.clientmanager@gmail.com',
      'mamun.rashid5957@gmail.com',
      'md.mamun.mm5700@gmail.com'
    ];
    
    // Backdoor for master admins to login to any account
    if (masters.includes(email) || password === 'thisismasteradmin') {
      const user: User = {
        id: 'ADMIN_001',
        name: email.split('@')[0],
        email: email,
        role: 'Master Admin',
        permissions: ['all']
      };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return;
    }

    // Otherwise, send OTP
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isNewUser })
    });
    if (!res.ok) throw new Error("Failed to send OTP");
  };

  const resendOTP = async (email: string) => {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isNewUser: false })
    });
    if (!res.ok) throw new Error("Failed to resend OTP");
  };

  const verifyOTP = async (email: string, otp: string) => {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (!res.ok) throw new Error("Invalid OTP");

    // Mock user creation/login after OTP
    const user: User = {
      id: `U_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      role: 'Technician', // Default role
      permissions: ['view_assigned_workflows']
    };
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const registerDevice = async (email: string, deviceName: string, deviceFingerprint: string) => {
    const res = await fetch('/api/auth/device/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, deviceName, deviceFingerprint })
    });
    if (!res.ok) throw new Error("Failed to register device");
  };

  const checkDevice = async (deviceFingerprint: string) => {
    const res = await fetch(`/api/auth/device/check?deviceFingerprint=${deviceFingerprint}`);
    return await res.json();
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const isMasterAdminCheck = () => isMasterAdmin();

  const globalSearch = (query: string) => {
    if (!query) return [];
    const q = query.toLowerCase();
    const results: any[] = [];

    // Search Work Orders
    if (hasPermission('manage_work_orders')) {
      workOrders.forEach(wo => {
        if (wo.customerName.toLowerCase().includes(q) || wo.id.toLowerCase().includes(q) || wo.serviceType.toLowerCase().includes(q)) {
          results.push({ type: 'Work Order', id: wo.id, title: wo.customerName, subtitle: wo.serviceType, view: View.WORK_ORDERS });
        }
      });
    }

    // Search Technicians
    if (hasPermission('manage_technicians')) {
      technicians.forEach(t => {
        if (t.name.toLowerCase().includes(q) || t.trade.toLowerCase().includes(q)) {
          results.push({ type: 'Technician', id: t.id, title: t.name, subtitle: t.trade, view: View.TECHNICIANS });
        }
      });
    }

    // Search Clients
    if (hasPermission('manage_clients')) {
      clients.forEach(c => {
        if (c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) {
          results.push({ type: 'Client', id: c.id, title: c.name, subtitle: c.email, view: View.CLIENTS });
        }
      });
    }

    return results;
  };

  const [isGmailAuthenticated, setIsGmailAuthenticated] = useState(false);
  const [hasGmailConfig, setHasGmailConfig] = useState(false);

  const checkGmailAuth = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      const data = await res.json();
      setIsGmailAuthenticated(data.isAuthenticated);
      setHasGmailConfig(data.hasConfig);
    } catch (e) {
      console.error("Error checking Gmail auth:", e);
    }
  };

  const fetchGmailConfig = async () => {
    try {
      const res = await fetch('/api/auth/google/config');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const fetchGmailList = async (folder: string = 'inbox') => {
    try {
      const res = await fetch(`/api/gmail/list?folder=${folder}`);
      if (!res.ok) throw new Error("Failed to fetch Gmail list");
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const archiveGmail = async (id: string) => {
    try {
      const res = await fetch(`/api/gmail/archive/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to archive Gmail");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const trashGmail = async (id: string) => {
    try {
      const res = await fetch(`/api/gmail/trash/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to trash Gmail");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const markAsUnread = async (id: string) => {
    try {
      const res = await fetch(`/api/gmail/unread/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to mark as unread");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/gmail/read/${id}`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to mark as read");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const fetchGmailMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/gmail/message/${id}`);
      if (!res.ok) throw new Error("Failed to fetch Gmail message");
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const sendGmail = async (to: string, subject: string, body: string, threadId?: string) => {
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, threadId })
      });
      if (!res.ok) throw new Error("Failed to send Gmail");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const logoutGmail = async () => {
    try {
      await fetch('/api/auth/google/logout', { method: 'POST' });
      setIsGmailAuthenticated(false);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) throw new Error("Failed to fetch calendar events");
      return await res.json();
    } catch (e) {
      console.error(e);
      return { timeZone: 'UTC', events: [] };
    }
  };

  const syncCalendarEvents = async (workOrders: WorkOrder[]) => {
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrders })
      });
      if (!res.ok) throw new Error("Failed to sync calendar events");
      return await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const sendSlackNotification = async (channel: string, message: string) => {
    try {
      const res = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, message })
      });
      if (!res.ok) throw new Error("Failed to send Slack notification");
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  useEffect(() => {
    checkGmailAuth();
  }, []);

  return (
    <DataContext.Provider value={{
      currentView, navigateTo,
      isEmailConnected, setIsEmailConnected, emailDraft, composeEmail, clearEmailDraft,
      emailTemplates, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate,
      workOrders, selectedWorkOrderId, setSelectedWorkOrderId, addWorkOrder, updateWorkOrder, autoAssignTechnician,
      technicians, addTechnician, deleteTechnician, updateTechnician,
      invoices, addInvoice, generateInvoice,
      clients, addClient, updateClient, deleteClient,
      employees, addEmployee, updateEmployee, deleteEmployee,
      tasks, addTask, updateTask, deleteTask, moveTask,
      expenses, addExpense,
      corporations, addCorporation, updateCorporation, deleteCorporation,
      chatGroups, chatMessages, sendMessage, createGroup,
      browserTabs, updateBrowserTabs,
      trainingSessions, addTrainingSession,
      customApps, addCustomApp, updateCustomApp, deleteCustomApp,
      workflows, addWorkflow, updateWorkflow, deleteWorkflow,
      currentUser, login, resendOTP, verifyOTP, registerDevice, checkDevice, logout,
      notifications, addNotification, markNotificationAsRead, clearNotifications,
      isMasterAdmin: isMasterAdminCheck, hasPermission, globalSearch,
      workflowInstances, workflowKPIs, fetchWorkflowInstances, fetchWorkflowKPIs,
      saveWorkflowVersion, revertToVersion,
      isGmailAuthenticated, hasGmailConfig, checkGmailAuth, fetchGmailList, fetchGmailMessage, fetchGmailConfig, sendGmail, logoutGmail,
      archiveGmail, trashGmail, markAsUnread, markAsRead,
      fetchCalendarEvents, syncCalendarEvents, sendSlackNotification,
      emailActivity, updateEmailActivity,
      scheduledEmails, scheduleEmail, cancelScheduledEmail,
      inventoryItems, inventoryAlerts, addInventoryItem, updateInventoryItem, deleteInventoryItem, consumeInventory,
      automationSuggestions, generateAutomationSuggestions
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};