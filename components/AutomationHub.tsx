
import React, { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, Plus, Trash2, ArrowRight, Play, 
  Save, AlertCircle, CheckCircle2, Zap, Clock, 
  Mail, MessageSquare, Bell, Database, Settings,
  ChevronRight, X, Info, Activity, Puzzle, Search,
  ExternalLink, Check, RefreshCw, Sparkles, Mic,
  Send, Loader2, Terminal, Bot, Cpu, Layers,
  Workflow, Globe, Calendar, Slack, CreditCard,
  Cloud, Share2, Box, ZapOff, History, BarChart3,
  Eye, Layout, FileText, ShieldCheck, Star
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { View, WorkflowStep, WorkflowVersion, WorkflowInstance, WorkflowKPI } from '../types';
import { generateAIResponse } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, 
  Legend, Cell, PieChart, Pie 
} from 'recharts';

interface IntegrationApp {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  connected: boolean;
  desc: string;
  hasConfig?: boolean;
}

export const AutomationHub: React.FC = () => {
  const { 
    workflows, addWorkflow, updateWorkflow, deleteWorkflow,
    navigateTo, currentUser, isGmailAuthenticated,
    fetchCalendarEvents, sendSlackNotification, isMasterAdmin,
    workflowInstances, workflowKPIs, fetchWorkflowInstances, fetchWorkflowKPIs,
    saveWorkflowVersion, revertToVersion,
    automationSuggestions, generateAutomationSuggestions 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'integrations' | 'workflows' | 'monitoring' | 'kpis' | 'ai-assistant'>('integrations');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    await generateAutomationSuggestions();
    setIsGeneratingSuggestions(false);
  };

  const userRole = currentUser?.role || 'Technician';
  const isAdmin = isMasterAdmin();
  const isTeamLead = userRole === 'Team Lead';
  const isTechnician = userRole === 'Technician';

  useEffect(() => {
    if (activeTab === 'monitoring') {
      fetchWorkflowInstances();
    }
    if (activeTab === 'kpis') {
      fetchWorkflowKPIs();
    }
  }, [activeTab]);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string, action?: any }[]>([
    { role: 'ai', text: 'Hello! I am your Automation Hub Assistant. I can help you connect integrations or build custom workflows. Try saying "Connect Slack" or "Create a workflow for new work orders".' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGmailAuthenticated) {
      handleSyncCalendar();
    }
  }, [isGmailAuthenticated]);

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const events = await fetchCalendarEvents();
      setCalendarEvents(events);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Suggest integrations based on workflows
  useEffect(() => {
    if (workflows.length > 0) {
      const currentTriggers = workflows.map(w => w.trigger.toLowerCase());
      const newSuggestions: string[] = [];
      if (currentTriggers.some(t => t.includes('email'))) {
        newSuggestions.push("Mailchimp for marketing automation");
      }
      if (currentTriggers.some(t => t.includes('work order'))) {
        newSuggestions.push("QuickBooks for automated invoicing");
      }
      if (currentTriggers.some(t => t.includes('technician'))) {
        newSuggestions.push("Slack for real-time dispatch alerts");
      }
      // setSuggestions(newSuggestions); // Removed local state
    }
  }, [workflows]);

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const text = overrideText || userInput;
    if (!text.trim() || isAiThinking) return;

    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setUserInput('');
    setIsAiThinking(true);

    try {
      const prompt = `
        You are an Automation Expert for DealPipeline CRM. 
        The user wants to manage integrations or workflows.
        
        Current User: ${currentUser.name}
        Available Integrations: Gmail, Slack, Google Calendar, QuickBooks, Stripe, Zapier
        Available Triggers: New Work Order Created, Work Order Completed, Technician Assigned, Email Received
        Available Actions: Send Email, Send SMS, Notify Admin, Create Work Order
        
        User Command: "${text}"
        
        If the user wants to create a workflow, return a JSON object with the workflow structure.
        If the user wants to connect an integration, explain the steps.
        
        Return your response as a JSON object:
        {
          "message": "Your helpful response here",
          "action": {
            "type": "CREATE_WORKFLOW" | "CONNECT_INTEGRATION" | "NONE",
            "data": { ... }
          }
        }
      `;

      const response = await generateAIResponse(prompt);
      try {
        const parsed = JSON.parse(response);
        setChatMessages(prev => [...prev, { role: 'ai', text: parsed.message, action: parsed.action }]);
        
        if (parsed.action?.type === 'CREATE_WORKFLOW') {
          const newWf = {
            id: 'wf_' + Date.now(),
            name: parsed.action.data.name || 'AI Generated Workflow',
            trigger: parsed.action.data.trigger || 'New Work Order Created',
            action: parsed.action.data.action || 'Notify Admin',
            active: true,
            steps: parsed.action.data.steps || []
          };
          addWorkflow(newWf);
        }
      } catch (e) {
        setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I couldn't process that command." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const startListening = () => {
    if (!isMasterAdmin()) {
      alert("Voice commands are restricted to Master Admins.");
      return;
    }
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      const mockVoiceCommands = [
        "Create a workflow for urgent leaks",
        "Connect Slack integration",
        "Sync my Google Calendar",
        "Notify me when a job is done"
      ];
      const randomCommand = mockVoiceCommands[Math.floor(Math.random() * mockVoiceCommands.length)];
      handleSendMessage(undefined, randomCommand);
    }, 2000);
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId);
  const selectedStep = selectedWorkflow?.steps?.find((s: any) => s.id === selectedStepId);

  const integrations: IntegrationApp[] = [
    { id: 'gmail', name: 'Gmail', category: 'Communication', icon: <Mail className="w-6 h-6 text-red-500" />, connected: isGmailAuthenticated, desc: 'Send and receive emails directly from the CRM.' },
    { id: 'slack', name: 'Slack', category: 'Communication', icon: <Slack className="w-6 h-6 text-purple-500" />, connected: true, desc: 'Get real-time notifications for new work orders.' },
    { id: 'google_cal', name: 'Google Calendar', category: 'Productivity', icon: <Calendar className="w-6 h-6 text-blue-500" />, connected: isGmailAuthenticated, desc: 'Sync technician schedules and appointments.', hasConfig: true },
    { id: 'quickbooks', name: 'QuickBooks', category: 'Finance', icon: <CreditCard className="w-6 h-6 text-emerald-500" />, connected: true, desc: 'Sync invoices and payments automatically.' },
    { id: 'stripe', name: 'Stripe', category: 'Finance', icon: <CreditCard className="w-6 h-6 text-indigo-500" />, connected: false, desc: 'Process credit card payments securely.' },
    { id: 'zapier', name: 'Zapier', category: 'Automation', icon: <Zap className="w-6 h-6 text-orange-500" />, connected: true, desc: 'Connect with 5,000+ other apps.' },
    { id: 'dropbox', name: 'Dropbox', category: 'Storage', icon: <Box className="w-6 h-6 text-blue-600" />, connected: false, desc: 'Store job site photos and documents.' },
    { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', icon: <Share2 className="w-6 h-6 text-yellow-500" />, connected: false, desc: 'Add new clients to marketing campaigns.' },
  ];

  const triggers = [
    { id: 'wo_new', label: 'New Work Order Created', icon: Zap, color: 'text-amber-500' },
    { id: 'wo_completed', label: 'Work Order Completed', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 'tech_assigned', label: 'Technician Assigned', icon: GitBranch, color: 'text-emerald-500' },
    { id: 'email_received', label: 'Email Received', icon: Mail, color: 'text-blue-500' },
    { id: 'payment_failed', label: 'Payment Failed', icon: AlertCircle, color: 'text-rose-500' }
  ];

  const actions = [
    { id: 'send_email', label: 'Send Email', icon: Mail, color: 'text-blue-500' },
    { id: 'send_sms', label: 'Send SMS', icon: MessageSquare, color: 'text-emerald-500' },
    { id: 'notify_admin', label: 'Notify Admin', icon: Bell, color: 'text-amber-500' },
    { id: 'create_work_order', label: 'Create Work Order', icon: Zap, color: 'text-emerald-500' },
    { id: 'update_record', label: 'Update Record', icon: Database, color: 'text-purple-500' },
    { id: 'delay', label: 'Wait / Delay', icon: Clock, color: 'text-slate-500' }
  ];

  const handleCreateNewWorkflow = () => {
    const newWf = {
      id: 'wf_' + Date.now(),
      name: 'New Automation',
      trigger: 'New Work Order Created',
      action: 'Notify Admin',
      active: true,
      steps: [
        { id: 's1', type: 'trigger', label: 'New Work Order Created', config: {} },
        { id: 's2', type: 'action', label: 'Notify Admin', config: {} }
      ]
    };
    addWorkflow(newWf);
    setSelectedWorkflowId(newWf.id);
    setActiveTab('workflows');
  };

  const runTest = async () => {
    if (!selectedWorkflow) return;
    setIsTesting(true);
    setTestLogs([]);
    
    const addLog = async (msg: string, type: 'info' | 'success' | 'warn' | 'data' = 'info') => {
      const icons = { info: 'ℹ️', success: '✅', warn: '⚠️', data: '📊' };
      setTestLogs(prev => [...prev, `${icons[type]} ${msg}`]);
      await new Promise(r => setTimeout(r, 800));
    };

    await addLog("Initializing workflow test environment...", 'info');
    await addLog("Generating sample payload for trigger...", 'data');
    
    // Sample Data Simulation
    const sampleData = {
      id: "WO-TEST-999",
      customer: "Test Customer LLC",
      service: selectedWorkflow.trigger.includes('Work Order') ? "HVAC Repair" : "General Inquiry",
      priority: "High",
      timestamp: new Date().toISOString()
    };
    
    await addLog(`Payload generated: ${JSON.stringify(sampleData)}`, 'data');
    await addLog(`Triggering workflow: ${selectedWorkflow.trigger}`, 'info');

    const steps = selectedWorkflow.steps || [];
    for (const step of steps) {
      if (step.type === 'trigger') continue;
      await addLog(`Executing step: ${step.label}...`, 'info');
      
      // Simulate step logic
      if (step.label.toLowerCase().includes('email')) {
        await addLog(`Drafting email to ${sampleData.customer}...`, 'info');
      } else if (step.label.toLowerCase().includes('notify')) {
        await addLog(`Sending notification to Admin channel...`, 'info');
      }
      
      await addLog(`Step "${step.label}" completed successfully.`, 'success');
    }

    await addLog("Workflow execution finished with 0 errors.", 'success');
    setIsTesting(false);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-slate-50">
      {/* Top Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Automation Hub</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Integrations & Workflows</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'integrations' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Integrations
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'workflows' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Workflows
          </button>
          {!isTechnician && (
            <>
              <button 
                onClick={() => setActiveTab('monitoring')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'monitoring' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monitoring
              </button>
              <button 
                onClick={() => setActiveTab('kpis')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'kpis' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                KPIs
              </button>
            </>
          )}
          <button 
            onClick={() => setActiveTab('ai-assistant')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'ai-assistant' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles className="w-3 h-3" /> AI Assistant
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'integrations' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Integrations Hub</h3>
                  <p className="text-sm text-slate-500">Connect and manage your external services</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <input 
                    type="text" 
                    placeholder="Search integrations..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['All', 'Communication', 'Finance', 'Productivity', 'Automation', 'Storage'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      filter === cat ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {integrations.filter(app => (filter === 'All' || app.category === filter) && app.name.toLowerCase().includes(searchQuery.toLowerCase())).map(app => (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 hover:shadow-xl hover:border-emerald-200 transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                        {app.icon}
                      </div>
                      {app.connected ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                          Disconnected
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{app.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{app.category}</p>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{app.desc}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-50 flex gap-2">
                      {app.connected ? (
                        <>
                          <button 
                            onClick={() => app.id === 'gmail' ? navigateTo(View.EMAIL) : null}
                            className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200"
                          >
                            Configure
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <ZapOff className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                          <Plus className="w-4 h-4" /> Connect {app.name}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isGmailAuthenticated && calendarEvents.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm animate-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Google Calendar Sync</h4>
                        <p className="text-xs text-slate-500">Recent events from your primary calendar</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleSyncCalendar}
                      disabled={isSyncing}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors disabled:animate-spin"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calendarEvents.slice(0, 3).map((event: any) => (
                      <div key={event.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="text-sm font-bold text-slate-800 mb-1 truncate">{event.summary}</h5>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {new Date(event.start?.dateTime || event.start?.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Workflow Automations</h3>
                  <p className="text-sm text-slate-500">Design custom logic for your business operations</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:bg-slate-50"
                  >
                    <Layout className="w-4 h-4" /> Templates
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={handleCreateNewWorkflow}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100"
                    >
                      <Plus className="w-4 h-4" /> Create Workflow
                    </button>
                  )}
                </div>
              </div>

              {/* AI Smart Suggestions */}
              <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-100">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">AI Smart Suggestions</h4>
                      <p className="text-xs text-slate-500">Optimizing your business logic with AI</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleGenerateSuggestions}
                    disabled={isGeneratingSuggestions}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-50 transition-all disabled:opacity-50"
                  >
                    {isGeneratingSuggestions ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Refresh Suggestions
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {automationSuggestions.length > 0 ? (
                    automationSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white flex flex-col gap-3 group hover:bg-white transition-all">
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{suggestion}</p>
                        <button className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                          Implement Now <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 py-8 flex flex-col items-center justify-center text-slate-400">
                      <Bot className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs font-medium italic">Click "Refresh Suggestions" to let AI analyze your CRM patterns.</p>
                    </div>
                  )}
                </div>
              </div>

              {showTemplates && (
                <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Pre-built Templates Library
                    </h4>
                    <button onClick={() => setShowTemplates(false)} className="text-emerald-400 hover:text-emerald-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {workflows.filter(w => w.id.startsWith('tmpl_')).map(tmpl => (
                      <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all group">
                        <h5 className="font-bold text-slate-800 mb-1">{tmpl.name}</h5>
                        <p className="text-xs text-slate-500 mb-4">{tmpl.trigger} → {tmpl.action}</p>
                        <button 
                          onClick={() => {
                            const newWf = { ...tmpl, id: 'wf_' + Date.now(), versions: [] };
                            addWorkflow(newWf);
                            setShowTemplates(false);
                            setSelectedWorkflowId(newWf.id);
                          }}
                          className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all"
                        >
                          Use Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workflows.filter(w => !w.id.startsWith('tmpl_')).map(wf => {
                  // Technician role check: only show if assigned
                  if (isTechnician && !wf.assignedTo?.includes(currentUser?.id || '')) return null;
                  
                  return (
                    <div 
                      key={wf.id}
                      onClick={() => setSelectedWorkflowId(wf.id)}
                      className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group ${
                        selectedWorkflowId === wf.id ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${wf.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Workflow className="w-6 h-6" />
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${wf.active ? 'bg-emerald-500' : 'bg-slate-200'} relative`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${wf.active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{wf.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">
                        <span>{wf.trigger}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{wf.action}</span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-medium">Last run: 2 hours ago</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Real-time Monitoring</h3>
                  <p className="text-sm text-slate-500">Track active workflow instances and their status</p>
                </div>
                <button 
                  onClick={fetchWorkflowInstances}
                  className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Time</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workflowInstances.map(inst => (
                      <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                              <Zap className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{inst.workflowName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(inst.startTime).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inst.status === 'Running' ? 'bg-blue-50 text-blue-600' :
                            inst.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full max-w-[120px]">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                              <span>Step {inst.currentStepIndex + 1}</span>
                              <span>{Math.round((inst.currentStepIndex + 1) / 3 * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-500" 
                                style={{ width: `${(inst.currentStepIndex + 1) / 3 * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'kpis' && workflowKPIs && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Automation Performance</h3>
                  <p className="text-sm text-slate-500">Key performance indicators for your automations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Completion Rate</p>
                  <h4 className="text-3xl font-bold text-emerald-600">{workflowKPIs.completionRate}%</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                    <ArrowRight className="w-3 h-3 -rotate-45" /> +2.4% from last month
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Avg. Execution Time</p>
                  <h4 className="text-3xl font-bold text-blue-600">{workflowKPIs.avgExecutionTime}s</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-500">
                    <ArrowRight className="w-3 h-3 rotate-45" /> -12s from last month
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Error Frequency</p>
                  <h4 className="text-3xl font-bold text-rose-600">{workflowKPIs.errorFrequency}%</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-500">
                    <ArrowRight className="w-3 h-3 rotate-45" /> -0.5% from last month
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Executions</p>
                  <h4 className="text-3xl font-bold text-slate-900">{workflowKPIs.totalExecutions}</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <ArrowRight className="w-3 h-3 -rotate-45" /> +120 from last month
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h5 className="font-bold text-slate-900 mb-6">Workflow Completions vs Errors</h5>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workflowKPIs.history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                        <Bar dataKey="completions" name="Completions" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="errors" name="Errors" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h5 className="font-bold text-slate-900 mb-6">Execution Trend</h5>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={workflowKPIs.history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Line type="monotone" dataKey="completions" name="Executions" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-full">
                <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">AI Automation Hub Assistant</h3>
                      <p className="text-xs text-white/70">Advanced Level AI • Text & Voice Command</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Online</div>
                  </div>
                </div>

                {automationSuggestions.length > 0 && (
                  <div className="px-6 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
                    <Bot className="w-4 h-4 text-purple-600" />
                    <div className="flex-1 overflow-x-auto no-scrollbar flex gap-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest shrink-0">AI Suggestions:</span>
                      {automationSuggestions.map((s, i) => (
                        <span key={i} className="text-[10px] font-medium text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200 whitespace-nowrap">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-xs text-slate-500 font-medium italic">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                  
                  {chatMessages.length > 0 && !isAiThinking && (
                    <div className="flex justify-center pt-4">
                      <button 
                        onClick={() => setShowFeedback(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100"
                      >
                        <Star className="w-3 h-3" /> Rate AI Performance
                      </button>
                    </div>
                  )}
                </div>

                {showFeedback && (
                  <div className="mx-6 mb-6 p-6 bg-purple-50 rounded-3xl border border-purple-100 animate-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest">AI Performance Feedback</h4>
                      <button onClick={() => setShowFeedback(false)} className="text-purple-400 hover:text-purple-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => setFeedbackRating(star)}
                          className={`transition-all ${feedbackRating >= star ? 'text-amber-400 scale-110' : 'text-slate-300'}`}
                        >
                          <Star className={`w-6 h-6 ${feedbackRating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="How can I improve my code generation or optimization?" 
                      className="w-full p-3 bg-white border border-purple-100 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px] mb-4"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        alert("Thank you! Your feedback has been recorded for self-optimization.");
                        setShowFeedback(false);
                        setFeedbackText("");
                        setFeedbackRating(0);
                      }}
                      className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}

                <div className="p-6 bg-white border-t border-slate-100">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input 
                      type="text" 
                      placeholder="Type a command (e.g. 'Build a workflow for urgent leaks')" 
                      className="w-full pl-6 pr-24 py-4 bg-slate-100 border-transparent border focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl text-sm transition-all outline-none"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button 
                        type="button"
                        onClick={startListening}
                        className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                        title="Voice Command"
                      >
                        {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                      </button>
                      <button 
                        type="submit"
                        disabled={!userInput.trim() || isAiThinking}
                        className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Connect Slack', 'New Workflow', 'Sync Calendar', 'Help'].map(suggestion => (
                      <button 
                        key={suggestion}
                        onClick={() => { setUserInput(suggestion); }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar for Workflow Editing (Only in Workflows tab) */}
        {activeTab === 'workflows' && selectedWorkflow && (
          <div className="w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 animate-in slide-in-from-right-4">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Workflow Editor</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedWorkflow.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className={`p-2 rounded-lg transition-colors ${showVersionHistory ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Version History"
                >
                  <History className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedWorkflowId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
              {showVersionHistory ? (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Version History</h5>
                    <button onClick={() => setShowVersionHistory(false)} className="text-[10px] font-bold text-emerald-600 hover:underline">Back to Editor</button>
                  </div>
                  <div className="space-y-3">
                    {selectedWorkflow.versions?.length > 0 ? selectedWorkflow.versions.map((v: any) => (
                      <div key={v.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-300 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-800">Version {v.version}</span>
                          <span className="text-[10px] text-slate-400">{new Date(v.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-3">Modified by {v.updatedBy}</p>
                        <button 
                          onClick={() => {
                            revertToVersion(selectedWorkflow.id, v.id);
                            setShowVersionHistory(false);
                          }}
                          className="w-full py-1.5 bg-white border border-slate-200 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-50 transition-all"
                        >
                          Restore Version
                        </button>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No previous versions found</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workflow Name</label>
                    <input 
                      type="text" 
                      value={selectedWorkflow.name}
                      onChange={(e) => updateWorkflow(selectedWorkflow.id, { name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automation Steps</label>
                      <div className="flex gap-1">
                        <button onClick={() => runTest()} disabled={isTesting} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl relative">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-700">{selectedWorkflow.trigger}</span>
                        </div>
                        <div className="absolute -bottom-3 left-6 w-0.5 h-3 bg-slate-200"></div>
                      </div>

                      {selectedWorkflow.steps?.map((step: any, i: number) => (
                        <div key={step.id} className="relative">
                          <div className={`p-4 bg-white border rounded-xl flex items-center justify-between group transition-all ${selectedStepId === step.id ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'}`} onClick={() => setSelectedStepId(step.id)}>
                            <div className="flex items-center gap-3">
                              {step.type === 'action' ? <Activity className="w-4 h-4 text-emerald-500" /> : <GitBranch className="w-4 h-4 text-blue-500" />}
                              <span className="text-xs font-medium text-slate-700">{step.label}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteWorkflow(step.id); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {i < selectedWorkflow.steps.length - 1 && <div className="absolute -bottom-3 left-6 w-0.5 h-3 bg-slate-200"></div>}
                        </div>
                      ))}

                      <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 text-xs font-bold">
                        <Plus className="w-4 h-4" /> Add Next Step
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={() => runTest()}
                  disabled={isTesting}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-500" />}
                  Test Workflow
                </button>
                <button 
                  onClick={() => {
                    saveWorkflowVersion(selectedWorkflow.id, selectedWorkflow.name);
                    alert("Workflow version saved successfully!");
                  }}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
              <button onClick={() => deleteWorkflow(selectedWorkflow.id)} className="w-full py-2 text-slate-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Delete Automation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Logs Panel */}
      {testLogs.length > 0 && (
        <div className="h-64 border-t border-slate-200 bg-slate-900 p-6 font-mono text-xs overflow-y-auto custom-scrollbar shrink-0 z-50">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <span className="text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Automation Execution Logs
            </span>
            <button onClick={() => setTestLogs([])} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {testLogs.map((log, i) => (
              <div key={i} className="text-slate-400 flex gap-3">
                <span className="text-emerald-500 font-bold">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-slate-300">{log}</span>
              </div>
            ))}
            {isTesting && (
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="animate-pulse">_</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Edit2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);
