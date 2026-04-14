
export enum View {
  DASHBOARD = 'DASHBOARD',
  WORK_ORDERS = 'WORK_ORDERS',
  APPROVED_WORK_ORDERS = 'APPROVED_WORK_ORDERS',
  INVOICES = 'INVOICES',
  CORPORATIONS = 'CORPORATIONS',
  CLIENTS = 'CLIENTS',
  TECHNICIANS = 'TECHNICIANS',
  MAP = 'MAP',
  EMPLOYEES = 'EMPLOYEES',
  TASKS = 'TASKS',
  REMINDERS = 'REMINDERS',
  CHAT = 'CHAT',
  EMAIL = 'EMAIL',
  QUICK_PHONE = 'QUICK_PHONE',
  OPEN_PHONE = 'OPEN_PHONE',
  PDF_EDITOR = 'PDF_EDITOR',
  OFFICE_EXPENSE = 'OFFICE_EXPENSE',
  INTEGRATIONS = 'INTEGRATIONS',
  CALENDAR_INTEGRATION = 'CALENDAR_INTEGRATION',
  WORKFLOW_BUILDER = 'WORKFLOW_BUILDER',
  BROWSER = 'BROWSER',
  LIVE_MONITORING = 'LIVE_MONITORING',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  APP_BUILDER = 'APP_BUILDER',
  MOBILE_APP = 'MOBILE_APP',
  TRAINING = 'TRAINING',
  AUTOMATION = 'AUTOMATION',
  SCHEDULER = 'SCHEDULER',
  DISPATCH = 'DISPATCH',
  INVENTORY = 'INVENTORY'
}

export enum WorkOrderStatus {
  NEW = 'New',
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  INSPECTION_DONE = 'Inspection Done',
  ESTIMATE_PENDING = 'Estimate Pending',
  ESTIMATE_APPROVED = 'Estimate Approved',
  ESTIMATE_DECLINED = 'Estimate Declined',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  INVOICED = 'Invoiced'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Master Admin' | 'Admin' | 'Team Lead' | 'Technician' | 'Dispatcher';
  permissions: string[];
  deviceId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface Customer {
  id: string | number;
  name: string;
  type: 'Residential' | 'Corporation';
  contact: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  customerName: string;
  email?: string;
  phone?: string;
  serviceType: string;
  address: string;
  status: WorkOrderStatus;
  priority: Priority;
  date: string; // Due Date
  createdAt: string;
  assignedTechId?: string;
  assignedTechName?: string;
  techPhone?: string;
  scheduleDateDisplay?: string;
  scheduleTime?: string;
  probability: number;
  description?: string;
  notes?: string; // Notes/Outcomes field
  reportText?: string;
  fee?: string;
  serviceFee?: string;
  corporation?: string;
  lat?: number;
  lng?: number;
  laborCost?: number;
  partsCost?: number;
  subtasks: Subtask[];
  history: AuditLog[];
  timeline?: { title: string; date?: string; sub?: string; active: boolean }[];
  reminderTime?: string; // ISO string or time format
  reminderSet?: boolean;
  isConfirmed?: boolean;
  isApproved?: boolean;
  materials?: { id: string; name: string; status: 'PENDING' | 'ORDERED' | 'RECEIVED'; cost: number }[];
  estimateId?: string;
  invoiceId?: string;
}

export interface Invoice {
  id: string;
  workOrderId: string;
  client: string;
  date: string;
  amount: string;
  laborCost: number;
  partsCost: number;
  type: 'INVOICE' | 'ESTIMATE';
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'DRAFT' | 'SENT' | 'APPROVED' | 'DECLINED';
  items?: { description: string; quantity: number; price: number }[];
}

export interface Technician {
  id: string;
  name: string;
  trade: 'HVAC' | 'Plumbing' | 'Electrical' | 'General';
  status: 'Active' | 'On Leave' | 'Busy';
  lat: number;
  lng: number;
  rating: number;
  workload: number; // 0-100%
  email?: string;
  phone?: string;
  skills: string[];
  performanceHistory: {
    date: string;
    jobId: string;
    rating: number;
    comment: string;
  }[];
  schedule: {
    date: string;
    jobId: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isSelf: boolean;
  groupId?: string;
  attachments?: { type: 'image' | 'file', url: string, name: string }[];
}

export interface ChatGroup {
  id: string;
  name: string;
  type: 'direct' | 'group';
  members: string[]; // User IDs
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  avatar: string;
  isOnline?: boolean;
}

export interface KPIData {
  label: string;
  value: number;
  trend?: string;
  colorClass: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  scenario: string;
  technicianPersona: 'HVAC' | 'Plumber' | 'Electrician' | 'Handyman';
  score: number;
  status: 'Pass' | 'Fail';
  transcript: string[];
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  active: boolean;
  history: string[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'Active' | 'Pending Approval' | 'Inactive';
  
  // Personal
  dob: string;
  bloodGroup: string;
  nidPassport: string;
  presentAddress: string;
  permanentAddress: string;
  
  // Family
  fathersName: string;
  mothersName: string;
  maritalStatus: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Education
  education: {
    school: string;
    schoolYear: string;
    college: string;
    collegeYear: string;
    university: string;
    universityYear: string;
    highestDegree: string;
  };
  
  // Experience
  experience: {
    lastCompany: string;
    designation: string;
    yearsOfExperience: string;
    currentPosition: {
      department: string;
      designation: string;
      employeeId: string;
      salary: string;
      joinDate: string;
    };
  };
  
  // Documents
  documents: {
    applicantPhoto?: string;
    nidPassportCopy?: string;
    guardianPhoto?: string;
    cvResume?: string;
    sscCertificate?: string;
    hscCertificate?: string;
    familyMembersPhotos?: string;
    emergencyContactIdPhotos?: string;
    certificatePhotos?: string;
  };
  
  // Access
  corporationAccess: string[];
  permissions: string[];
}

export interface Task {
  id: number;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string;
  priority: Priority;
  reminderSet?: boolean;
  description?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  label: string;
  config: any;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  trigger: string;
  action: string;
  steps: WorkflowStep[];
  updatedAt: string;
  updatedBy: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  steps: WorkflowStep[];
  versions: WorkflowVersion[];
  assignedTo?: string[]; // For Technician role access
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowName: string;
  startTime: string;
  endTime?: string;
  status: 'Running' | 'Completed' | 'Failed';
  currentStepIndex: number;
  logs: string[];
  error?: string;
}

export interface WorkflowKPI {
  completionRate: number;
  avgExecutionTime: number; // in seconds
  errorFrequency: number;
  totalExecutions: number;
  history: { date: string; completions: number; errors: number }[];
}

export interface DeviceRegistration {
  id: string;
  userId: string;
  deviceName: string;
  deviceFingerprint: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  registeredAt: string;
}

export interface OTPStatus {
  userId: string;
  otp: string;
  expiresAt: number;
}

export interface Email {
  id: string;
  from: string;
  email: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  unread: boolean;
  folder: string;
  avatar: string;
  fullBodyFetched?: boolean;
  aiAnalysis?: {
    isServiceRequest: boolean;
    customerName: string;
    corporation: string | null;
    address: string;
    serviceType: string;
    priority: Priority;
    summary: string;
    confidence: number;
    detectedAttachments: string;
    autoCreatedId?: string;
  } | null;
  aiSummary?: string | null;
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    data?: string;
  }[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface ScheduledEmail {
  id: string;
  workOrderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string; // ISO string
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  price: number;
  supplier: string;
  lastRestocked: string;
  workOrderIds: string[]; // Linked work orders that need this part
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  itemName: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER_REQUIRED';
  message: string;
  timestamp: string;
  isResolved: boolean;
}
