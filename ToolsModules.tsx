
import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Phone, FileEdit, GitBranch, BarChart3, Lock, Shield, User, Globe, Plus, Trash2, ArrowRight, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { WorkOrder, WorkOrderStatus, Priority } from '../types';

// Generic placeholder component to keep things DRY for simple views
const SimpleView: React.FC<{ title: string; icon: React.ReactNode; desc: string }> = ({ title, icon, desc }) => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
    <div className="p-4 bg-slate-50 rounded-full mb-4 text-emerald-400">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-slate-700">{title}</h3>
    <p className="text-slate-500 max-w-md text-center">{desc}</p>
    <button className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium text-sm hover:bg-emerald-100">
      Launch Module
    </button>
  </div>
);

export const PDFEditor: React.FC = () => <SimpleView title="PDF Editor Pro" icon={<FileEdit size={32} />} desc="Edit, sign, and manage PDF contracts and invoices directly within the platform." />;

export const Reports: React.FC = () => <SimpleView title="Advanced Reports" icon={<BarChart3 size={32} />} desc="Generate deep insights and analytics reports for your business performance." />;

export const Reminders: React.FC = () => {
  const { workOrders, notifications, updateWorkOrder } = useData();
  const [activeTab, setActiveTab] = useState<'unscheduled' | 'upcoming' | 'nexthour' | 'approvals'>('unscheduled');

  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const unscheduled = workOrders.filter(wo => wo.status === WorkOrderStatus.NEW && !wo.assignedTechId);
  const upcoming = workOrders.filter(wo => {
    const woDate = new Date(wo.date);
    return wo.status === WorkOrderStatus.SCHEDULED && woDate.toDateString() === now.toDateString();
  });
  const nearNextHour = upcoming.filter(wo => {
    const woDate = new Date(wo.date);
    return woDate > now && woDate <= nextHour;
  });
  const approvals = workOrders.filter(wo => !wo.isApproved || !wo.isConfirmed);

  const renderList = (list: WorkOrder[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map(wo => (
          <div key={wo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-all group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  wo.priority === Priority.URGENT ? 'bg-red-500' :
                  wo.priority === Priority.HIGH ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}></span>
                <h4 className="text-sm font-bold text-slate-900">{wo.customerName}</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{wo.id}</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 line-clamp-1">{wo.serviceType} • {wo.address}</p>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(wo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {wo.isConfirmed ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Confirmed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Awaiting Confirmation
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!wo.isApproved && (
                  <button 
                    onClick={() => updateWorkOrder(wo.id, { isApproved: true })}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {!wo.isConfirmed && (
                  <button 
                    onClick={() => updateWorkOrder(wo.id, { isConfirmed: true })}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors"
                  >
                    Confirm
                  </button>
                )}
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reminders & Alerts</h1>
          <p className="text-sm text-slate-500">Stay on top of urgent tasks and upcoming visits</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100">
          <Bell className="w-4 h-4 animate-bounce" />
          <span className="text-xs font-bold">{nearNextHour.length} visits in the next hour</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
            {[
              { id: 'unscheduled', label: 'Unscheduled', count: unscheduled.length },
              { id: 'upcoming', label: 'Upcoming Today', count: upcoming.length },
              { id: 'nexthour', label: 'Next Hour', count: nearNextHour.length },
              { id: 'approvals', label: 'Approvals', count: approvals.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'unscheduled' && renderList(unscheduled, "All work orders are scheduled!")}
            {activeTab === 'upcoming' && renderList(upcoming, "No more visits scheduled for today.")}
            {activeTab === 'nexthour' && renderList(nearNextHour, "No visits starting in the next hour.")}
            {activeTab === 'approvals' && renderList(approvals, "No pending approvals or confirmations.")}
          </div>
        </div>

        <div className="flex flex-col gap-6 overflow-hidden">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              Automation Hub
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-1">Auto-Confirm Clients</p>
                <p className="text-[10px] text-slate-500 mb-3">Send SMS/Email confirmations 24h before visit</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>
                  <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Configure</button>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-1">Smart Dispatch</p>
                <p className="text-[10px] text-slate-500 mb-3">Auto-assign unscheduled jobs based on tech proximity</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">Inactive</span>
                  <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700">Enable</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-emerald-200 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">AI Dispatcher</h3>
              <p className="text-xs text-emerald-50/80 mb-4 leading-relaxed">
                I've analyzed your {unscheduled.length} unscheduled jobs. I can auto-assign them to the best available technicians in one click.
              </p>
              <button className="w-full py-2.5 bg-white text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20">
                Run Auto-Dispatch
              </button>
            </div>
            <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircle2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

const AlertCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const Sparkles: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    <path d="M5 3v4"></path>
    <path d="M19 17v4"></path>
    <path d="M3 5h4"></path>
    <path d="M17 19h4"></path>
  </svg>
);

export const QuickPhone: React.FC = () => <SimpleView title="Quick Phone" icon={<Phone size={32} />} desc="Integrated VoIP dialer for quick client calls and logging." />;

// Settings is a bit more complex usually, so let's give it a basic shell
export const Settings: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-4 min-h-[500px]">
                    <div className="col-span-1 border-r border-slate-200 bg-slate-50 p-4 space-y-1">
                        <button className="w-full text-left px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-md text-sm font-medium text-emerald-600 flex items-center gap-2">
                            <User size={14} /> Profile
                        </button>
                        <button className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium flex items-center gap-2">
                            <Shield size={14} /> Security
                        </button>
                        <button className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium flex items-center gap-2">
                            <Bell size={14} /> Notifications
                        </button>
                         <button className="w-full text-left px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium flex items-center gap-2">
                            <Globe size={14} /> Regional
                        </button>
                    </div>
                    <div className="col-span-3 p-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Profile Settings</h3>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded-md text-sm" defaultValue="Kevin Ryan" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input type="email" className="w-full p-2 border border-slate-300 rounded-md text-sm" defaultValue="kevin.nexzen@gmail.com" />
                            </div>
                            <div className="pt-4">
                                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
