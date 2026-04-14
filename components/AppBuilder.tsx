
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, Layout, Globe, Github, 
  Terminal, Play, CheckCircle2, Loader2, Smartphone, 
  Monitor, Cpu, Zap, Cloud, Code, ChevronRight, 
  AlertTriangle, RefreshCw, Layers, Plus, Trash2,
  Settings, BarChart3, Table as TableIcon, MousePointer2,
  Save, Share2, Eye, Brain, Workflow, Activity,
  Database, Shield, ZapOff, MessageSquare
} from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

// --- TYPES FOR THE AUTONOMOUS ARCHITECTURE ---
export interface AIAgent {
  id: string;
  name: string;
  role: string;
  systemInstruction: string;
  tools: string[];
  status: 'idle' | 'running' | 'paused';
  memory: string[];
}

export interface UIComponent {
  id: string;
  type: 'header' | 'card' | 'table' | 'chart' | 'form' | 'button' | 'stat' | 'agent-node' | 'chat-widget';
  props: any;
}

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  label: string;
  config: any;
}

export interface AppWorkflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface AppManifest {
  id: string;
  name: string;
  theme: 'indigo' | 'slate' | 'emerald' | 'rose' | 'amber';
  layout: 'canvas' | 'grid';
  components: UIComponent[];
  agents: AIAgent[];
  workflows: AppWorkflow[];
}

const INITIAL_MANIFEST: AppManifest = {
  id: 'app_' + Date.now(),
  name: "Autonomous Ops Center",
  theme: "emerald",
  layout: "canvas",
  agents: [
    {
      id: 'agent_1',
      name: "Dispatch Optimizer",
      role: "Autonomous Scheduler",
      systemInstruction: "You are an autonomous dispatcher. Your goal is to assign work orders to the most qualified technicians based on location and workload.",
      tools: ["database_access", "geolocation", "notification_service"],
      status: 'idle',
      memory: []
    }
  ],
  workflows: [
    {
      id: 'wf_1',
      name: 'Auto-Dispatch Flow',
      steps: [
        { id: 's1', type: 'trigger', label: 'New Work Order', config: {} },
        { id: 's2', type: 'action', label: 'Analyze Technician Availability', config: {} },
        { id: 's3', type: 'action', label: 'Assign & Notify', config: {} },
        { id: 's4', type: 'action', label: 'Monitor Technician Availability', config: {} }
      ]
    }
  ],
  components: [
    {
      id: 'c1',
      type: "header",
      props: {
        title: "AI Command Center",
        subtitle: "Managing autonomous field agents"
      }
    },
    {
      id: 'c2',
      type: "agent-node",
      props: {
        agentId: 'agent_1',
        title: "Dispatch Agent Status"
      }
    },
    {
      id: 'c3',
      type: "agent-node",
      props: {
        agentId: 'placeholder_agent',
        title: "Agent Status"
      }
    }
  ]
};

export const AppBuilder: React.FC = () => {
  const { addCustomApp } = useData();
  const [userInput, setUserInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'agent', content: string }[]>([
    { role: 'agent', content: "I am the Master Architect. I can build autonomous AI agents, complex workflows, and full-scale applications. What is your command?" }
  ]);
  
  const [manifest, setManifest] = useState<AppManifest>(INITIAL_MANIFEST);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewDevice, setViewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'building' | 'live'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'build' | 'agents' | 'workflows' | 'ai'>('ai');
  
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const selectedComponent = manifest.components.find(c => c.id === selectedId);
  const selectedAgent = manifest.agents.find(a => a.id === selectedId);
  const selectedWorkflow = manifest.workflows.find(w => w.id === selectedId);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, isAgentThinking]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleBuildRequest = async () => {
    if (!userInput.trim()) return;

    const userQuery = userInput;
    setHistory(prev => [...prev, { role: 'user', content: userQuery }]);
    setUserInput('');
    setIsAgentThinking(true);

    try {
      const prompt = `
        You are the Master AI Architect. You build autonomous systems.
        Current Manifest: ${JSON.stringify(manifest)}
        User Instruction: "${userQuery}"
        
        Task: 
        1. Analyze the request.
        2. Create or update the structured App Manifest in JSON format.
        3. The manifest must include: id, name, theme, layout, components, agents, and workflows.
        4. Agents must have: id, name, role, systemInstruction, tools[], status, memory[].
        5. Workflows must have: id, name, steps[]. Steps have: id, type ('trigger'|'action'|'condition'|'delay'), label, config{}.
        6. Components supported: 
           - 'header', 'stat', 'card', 'table', 'chart', 'form', 'button', 'agent-node', 'chat-widget'.
           - 'agent-node' connects to an agent via agentId.

        RETURN ONLY A VALID JSON OBJECT, NO MARKDOWN TAGS.
      `;

      const responseText = await generateAIResponse(prompt, "System: Architecting Autonomous System");
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsedManifest = JSON.parse(cleanJson);
        setManifest(parsedManifest);
        setHistory(prev => [...prev, { 
          role: 'agent', 
          content: `Autonomous system updated. I've configured the agents and UI nodes for "${parsedManifest.name}".` 
        }]);
        addLog(`System Synchronized: ${parsedManifest.name}`);
      } catch (e) {
        setHistory(prev => [...prev, { role: 'agent', content: "I encountered a formatting error in the architectural plan. Please try rephrasing." }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'agent', content: "Architectural engine error. Check connectivity." }]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const saveApp = () => {
    addCustomApp(manifest);
    addLog(`System "${manifest.name}" saved to library.`);
    alert("System saved successfully!");
  };

  const runDeployment = async () => {
    setDeployStatus('building');
    addLog("Initializing autonomous runtime...");
    await new Promise(r => setTimeout(r, 1200));
    addLog("Connecting agent neural networks...");
    await new Promise(r => setTimeout(r, 800));
    setDeployStatus('live');
    addLog("SUCCESS: Autonomous system is now live.");
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col -m-6 overflow-hidden bg-slate-950">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900 shadow-xl z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white animate-pulse">
              <Brain className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-200 tracking-tight">Agent Studio <span className="text-emerald-400 font-mono text-[10px] ml-2">v5.0.0</span></h2>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <input 
            value={manifest.name}
            onChange={(e) => setManifest(prev => ({ ...prev, name: e.target.value }))}
            className="text-sm font-medium text-slate-400 bg-transparent border-none focus:ring-0 w-48"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 p-1 rounded-lg mr-4">
            <button onClick={() => setViewDevice('desktop')} className={`p-1.5 rounded transition-all ${viewDevice === 'desktop' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}><Monitor className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewDevice('mobile')} className={`p-1.5 rounded transition-all ${viewDevice === 'mobile' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}><Smartphone className="w-3.5 h-3.5" /></button>
          </div>
          
          <button onClick={saveApp} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button 
            onClick={runDeployment}
            disabled={deployStatus !== 'idle'}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {deployStatus === 'idle' ? <Zap className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deployStatus === 'live' ? 'System Live' : 'Initialize'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-80 border-r border-slate-800 flex flex-col shrink-0 bg-slate-900 z-20">
          <div className="flex border-b border-slate-800">
            {['ai', 'agents', 'workflows', 'build'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5' : 'text-slate-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'ai' ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                  {history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                        : 'bg-emerald-600/10 text-emerald-100 border border-emerald-500/20'
                      }`}>
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[9px] font-bold uppercase">
                          {msg.role === 'user' ? <MousePointer2 className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          {msg.role === 'user' ? 'Commander' : 'Architect'}
                        </div>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAgentThinking && (
                    <div className="flex justify-start">
                      <div className="bg-emerald-600/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                        <span className="text-[9px] text-emerald-400 font-bold uppercase">Neural Processing...</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-950">
                  <div className="relative">
                    <textarea 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleBuildRequest())}
                      placeholder="Command the AI (e.g. 'Create an autonomous agent for billing')..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 pr-12 text-xs text-slate-300 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none resize-none min-h-[80px]"
                    />
                    <button onClick={handleBuildRequest} className="absolute right-3 bottom-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'agents' ? (
              <div className="p-4 space-y-4">
                <button 
                  onClick={() => {
                    const id = 'agent_' + Date.now();
                    setManifest(prev => ({
                      ...prev,
                      agents: [...prev.agents, { id, name: 'New Agent', role: 'Assistant', systemInstruction: '', tools: [], status: 'idle', memory: [] }]
                    }));
                    setSelectedId(id);
                  }}
                  className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 text-[10px] font-bold uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Create New Agent
                </button>
                {manifest.agents.map(agent => (
                  <div 
                    key={agent.id}
                    onClick={() => setSelectedId(agent.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedId === agent.id ? 'bg-emerald-600/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bot className={`w-4 h-4 ${selectedId === agent.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase ${agent.status === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {agent.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{agent.role}</p>
                  </div>
                ))}
              </div>
            ) : activeTab === 'workflows' ? (
              <div className="p-4 space-y-4">
                <button 
                  onClick={() => {
                    const id = 'wf_' + Date.now();
                    setManifest(prev => ({
                      ...prev,
                      workflows: [...prev.workflows, { id, name: 'New Workflow', steps: [] }]
                    }));
                    setSelectedId(id);
                  }}
                  className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 text-[10px] font-bold uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Create New Workflow
                </button>
                {manifest.workflows.map(wf => (
                  <div 
                    key={wf.id}
                    onClick={() => setSelectedId(wf.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedId === wf.id ? 'bg-emerald-600/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Workflow className={`w-4 h-4 ${selectedId === wf.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold text-slate-200">{wf.name}</span>
                      </div>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-slate-700 text-slate-400">
                        {wf.steps.length} Steps
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">UI Nodes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['header', 'stat', 'card', 'table', 'chart', 'form', 'button', 'agent-node', 'chat-widget'].map(type => (
                      <button 
                        key={type}
                        onClick={() => {
                          const id = 'c_' + Math.random().toString(36).substr(2, 9);
                          setManifest(prev => ({ ...prev, components: [...prev.components, { id, type: type as any, props: {} }] }));
                          setSelectedId(id);
                        }}
                        className="flex flex-col items-center justify-center p-3 border border-slate-800 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                      >
                        <Layers className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 mb-2" />
                        <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-300 uppercase">{type.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: CANVAS */}
        <div className="flex-1 bg-slate-950 overflow-auto p-12 flex justify-center custom-scrollbar relative">
          <div className={`transition-all duration-500 ${
            viewDevice === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-5xl min-h-[800px]'
          }`}>
            <div className={`bg-slate-900 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 flex flex-col h-full relative ${viewDevice === 'mobile' ? 'rounded-[3rem] border-[10px] border-slate-800' : ''}`}>
              <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {activeTab === 'workflows' && selectedWorkflow ? (
                  <div className="space-y-8 py-12 flex flex-col items-center">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-black text-white tracking-tighter">{selectedWorkflow.name}</h2>
                      <p className="text-slate-500 mt-2">Workflow Execution Logic</p>
                    </div>
                    
                    {selectedWorkflow.steps.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-6 rounded-2xl relative group hover:border-emerald-500/50 transition-all shadow-xl">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                              step.type === 'trigger' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                              step.type === 'action' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                              'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-white">{step.label}</h4>
                              <p className="text-xs text-slate-500 uppercase font-mono tracking-widest">{step.type}</p>
                            </div>
                          </div>
                          
                          {idx < selectedWorkflow.steps.length - 1 && (
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-slate-700 to-transparent">
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 border-b border-r border-slate-700 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    ))}
                    
                    {selectedWorkflow.steps.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                        <ZapOff className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">No steps defined for this workflow</p>
                      </div>
                    )}
                  </div>
                ) : manifest.components.map((comp) => (
                  <div 
                    key={comp.id} 
                    onClick={(e) => { e.stopPropagation(); setSelectedId(comp.id); }}
                    className={`relative group cursor-pointer transition-all rounded-2xl ${
                      selectedId === comp.id ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-slate-900' : 'hover:ring-1 hover:ring-slate-700 hover:ring-offset-2 hover:ring-offset-slate-900'
                    }`}
                  >
                    {comp.type === 'header' && (
                      <div className="py-4">
                        <h2 className="text-4xl font-black text-white tracking-tighter">{comp.props.title || 'Header Title'}</h2>
                        <p className="text-slate-500 mt-2 text-sm">{comp.props.subtitle || 'Subtitle goes here'}</p>
                      </div>
                    )}

                    {comp.type === 'agent-node' && (
                      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 p-6 rounded-2xl flex flex-col gap-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                              <Bot className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{comp.props.title || 'Agent Node'}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">ID: {comp.props.agentId || 'none'}</p>
                            </div>
                          </div>
                          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-2/3 animate-pulse"></div>
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                            <span>Neural Load</span>
                            <span>67%</span>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-700/50 font-mono text-[9px] text-emerald-300">
                          {">"} Initializing autonomous reasoning loop...
                          <br />
                          {">"} Analyzing database for scheduling conflicts...
                        </div>
                      </div>
                    )}

                    {comp.type === 'stat' && (
                      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{comp.props.label || 'Metric'}</span>
                        <div className="flex items-end gap-2 mt-1">
                          <span className="text-4xl font-black text-white">{comp.props.value || '0'}</span>
                          <span className="text-emerald-500 text-xs font-bold mb-1">{comp.props.trend || '+0%'}</span>
                        </div>
                      </div>
                    )}

                    {comp.type === 'chat-widget' && (
                      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-64">
                        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Agent Chat</span>
                        </div>
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                          <div className="bg-slate-900 p-2 rounded-xl rounded-bl-none text-[10px] text-slate-300 max-w-[80%]">
                            Hello! I am your autonomous agent. How can I assist you?
                          </div>
                        </div>
                        <div className="p-3 bg-slate-900 border-t border-slate-700">
                          <div className="h-8 bg-slate-800 rounded-lg border border-slate-700"></div>
                        </div>
                      </div>
                    )}

                    {/* Delete overlay */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setManifest(prev => ({ ...prev, components: prev.components.filter(c => c.id !== comp.id) }));
                        setSelectedId(null);
                      }}
                      className="absolute -top-2 -right-2 bg-slate-800 text-slate-500 hover:text-rose-500 p-1.5 rounded-full shadow-md border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: PROPERTIES */}
        <div className="w-80 border-l border-slate-800 flex flex-col shrink-0 bg-slate-900 z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration</h3>
            {selectedId && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase">Selected</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {selectedAgent ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agent Name</label>
                    <input 
                      value={selectedAgent.name}
                      onChange={(e) => setManifest(prev => ({ ...prev, agents: prev.agents.map(a => a.id === selectedId ? { ...a, name: e.target.value } : a) }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</label>
                    <input 
                      value={selectedAgent.role}
                      onChange={(e) => setManifest(prev => ({ ...prev, agents: prev.agents.map(a => a.id === selectedId ? { ...a, role: e.target.value } : a) }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Instruction</label>
                    <textarea 
                      value={selectedAgent.systemInstruction}
                      onChange={(e) => setManifest(prev => ({ ...prev, agents: prev.agents.map(a => a.id === selectedId ? { ...a, systemInstruction: e.target.value } : a) }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] resize-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tools</label>
                    <div className="flex flex-wrap gap-2">
                      {['database', 'web_search', 'email', 'crm_access'].map(tool => (
                        <button 
                          key={tool}
                          onClick={() => {
                            const tools = selectedAgent.tools.includes(tool) ? selectedAgent.tools.filter(t => t !== tool) : [...selectedAgent.tools, tool];
                            setManifest(prev => ({ ...prev, agents: prev.agents.map(a => a.id === selectedId ? { ...a, tools } : a) }));
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${selectedAgent.tools.includes(tool) ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedWorkflow ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workflow Name</label>
                    <input 
                      value={selectedWorkflow.name}
                      onChange={(e) => setManifest(prev => ({ ...prev, workflows: prev.workflows.map(w => w.id === selectedId ? { ...w, name: e.target.value } : w) }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Steps</label>
                    <div className="space-y-2">
                      {selectedWorkflow.steps.map((step, idx) => (
                        <div key={step.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              step.type === 'trigger' ? 'bg-amber-500/20 text-amber-400' :
                              step.type === 'action' ? 'bg-emerald-500/20 text-emerald-400' :
                              step.type === 'condition' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 flex gap-2">
                              <select
                                value={step.type}
                                onChange={(e) => {
                                  const steps = selectedWorkflow.steps.map(s => s.id === step.id ? { ...s, type: e.target.value as any } : s);
                                  setManifest(prev => ({ ...prev, workflows: prev.workflows.map(w => w.id === selectedId ? { ...w, steps } : w) }));
                                }}
                                className="bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 p-1 outline-none focus:border-emerald-500"
                              >
                                <option value="trigger">Trigger</option>
                                <option value="action">Action</option>
                                <option value="condition">Condition</option>
                                <option value="delay">Delay</option>
                              </select>
                              <input
                                value={step.label}
                                onChange={(e) => {
                                  const steps = selectedWorkflow.steps.map(s => s.id === step.id ? { ...s, label: e.target.value } : s);
                                  setManifest(prev => ({ ...prev, workflows: prev.workflows.map(w => w.id === selectedId ? { ...w, steps } : w) }));
                                }}
                                placeholder="Step Label"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 p-1 px-2 outline-none focus:border-emerald-500"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const steps = selectedWorkflow.steps.filter(s => s.id !== step.id);
                                setManifest(prev => ({ ...prev, workflows: prev.workflows.map(w => w.id === selectedId ? { ...w, steps } : w) }));
                              }}
                              className="text-slate-600 hover:text-rose-500 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="pl-9">
                            <input
                              value={JSON.stringify(step.config || {})}
                              onChange={(e) => {
                                try {
                                  const config = JSON.parse(e.target.value);
                                  const steps = selectedWorkflow.steps.map(s => s.id === step.id ? { ...s, config } : s);
                                  setManifest(prev => ({ ...prev, workflows: prev.workflows.map(w => w.id === selectedId ? { ...w, steps } : w) }));
                                } catch (err) {
                                  // Ignore invalid JSON while typing
                                }
                              }}
                              placeholder="Config (JSON)"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-400 p-1.5 font-mono outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newStep: WorkflowStep = { id: 's_' + Date.now(), type: 'action', label: 'New Step', config: {} };
                          const steps = [...selectedWorkflow.steps, newStep];
                          setManifest(prev => ({ ...prev, workflows: prev.workflows.map(w => w.id === selectedId ? { ...w, steps } : w) }));
                        }}
                        className="w-full py-2 border border-dashed border-slate-800 rounded-xl text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-800 transition-all"
                      >
                        + Add Step
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedComponent ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {Object.entries(selectedComponent.props).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key}</label>
                      <input 
                        type="text" 
                        value={typeof value === 'object' ? JSON.stringify(value) : value} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setManifest(prev => ({
                            ...prev,
                            components: prev.components.map(c => c.id === selectedId ? { ...c, props: { ...c.props, [key]: val } } : c)
                          }));
                        }}
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center px-6">
                <Workflow className="w-8 h-8 mb-4 opacity-20" />
                <p className="text-[11px] font-medium">Select an agent or component to configure autonomous behavior</p>
              </div>
            )}
          </div>

          {/* System Logs */}
          <div className="h-48 border-t border-slate-800 bg-slate-950 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Logs</span>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-bold text-emerald-600 uppercase">System Active</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="text-[9px] text-slate-500 font-mono leading-tight">
                  <span className="text-slate-700 mr-2">›</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
