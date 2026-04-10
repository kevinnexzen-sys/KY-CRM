
import React from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  MessageSquare, 
  Settings, 
  Building2, 
  Globe, 
  FileText, 
  Wrench, 
  Map as MapIcon, 
  CheckSquare, 
  Bell, 
  Phone, 
  FileEdit, 
  DollarSign, 
  Puzzle, 
  GitBranch, 
  Activity, 
  BarChart3, 
  Sparkles, 
  Smartphone, 
  Briefcase, 
  Mail, 
  GraduationCap,
  Zap,
  Box
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const Sidebar: React.FC = () => {
  const { currentView, navigateTo, isMasterAdmin, currentUser } = useData();
  
  const rolePermissions: Record<string, View[]> = {
    'Master Admin': Object.values(View),
    'Admin': Object.values(View).filter(v => v !== View.LIVE_MONITORING),
    'Manager': [
      View.DASHBOARD, View.WORK_ORDERS, View.TECHNICIANS, View.MAP, 
      View.CLIENTS, View.CORPORATIONS, View.INVOICES, View.TASKS, 
      View.CHAT, View.EMAIL, View.SCHEDULER, View.DISPATCH, View.REPORTS,
      View.INVENTORY
    ],
    'Technician': [
      View.DASHBOARD, View.WORK_ORDERS, View.TASKS, View.CHAT, View.TRAINING, View.MAP
    ],
    'Dispatcher': [
      View.DASHBOARD, View.WORK_ORDERS, View.TECHNICIANS, View.MAP, 
      View.CHAT, View.SCHEDULER, View.DISPATCH
    ]
  };

  const allowedViews = rolePermissions[currentUser.role] || [View.DASHBOARD];

  const categories = [
    {
      title: 'CORE',
      items: [
        { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { id: View.WORK_ORDERS, label: 'Work Orders', icon: ClipboardList },
        { id: View.INVOICES, label: 'Invoices & Estimates', icon: FileText },
        { id: View.CORPORATIONS, label: 'Corporations', icon: Building2 },
        { id: View.CLIENTS, label: 'Clients', icon: Users },
      ].filter(item => allowedViews.includes(item.id))
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: View.SCHEDULER, label: 'Job Scheduler', icon: ClipboardList },
        { id: View.DISPATCH, label: 'Technician Dispatch', icon: Zap },
        { id: View.TECHNICIANS, label: 'Technicians', icon: Wrench },
        { id: View.MAP, label: 'Map', icon: MapIcon },
        { id: View.EMPLOYEES, label: 'Employees', icon: Briefcase },
        { id: View.TASKS, label: 'Tasks', icon: CheckSquare },
        { id: View.INVENTORY, label: 'Inventory', icon: Box },
      ].filter(item => allowedViews.includes(item.id))
    },
    {
      title: 'COMMUNICATIONS',
      items: [
        { id: View.EMAIL, label: 'Email (Gmail)', icon: Mail },
        { id: View.CHAT, label: 'Teams Chat', icon: MessageSquare },
        { id: View.OPEN_PHONE, label: 'OpenPhone', icon: Phone },
        { id: View.REMINDERS, label: 'Reminders', icon: Bell },
      ].filter(item => allowedViews.includes(item.id))
    },
    {
      title: 'TOOLS',
      items: [
        { id: View.PDF_EDITOR, label: 'PDF Editor Pro', icon: FileEdit },
        { id: View.OFFICE_EXPENSE, label: 'Office Expense', icon: DollarSign },
        { id: View.BROWSER, label: 'Internet Browser', icon: Globe },
        { id: View.TRAINING, label: 'Training Session', icon: GraduationCap },
        { id: View.AUTOMATION, label: 'Automation Hub', icon: GitBranch },
        { id: View.LIVE_MONITORING, label: 'Live Monitoring', icon: Activity },
        { id: View.APP_BUILDER, label: 'Agent Studio', icon: Sparkles }
      ].filter(item => allowedViews.includes(item.id))
    },
    {
      title: 'ADMIN',
      items: [
        { id: View.REPORTS, label: 'Reports', icon: BarChart3 },
        { id: View.SETTINGS, label: 'Settings', icon: Settings },
      ].filter(item => allowedViews.includes(item.id))
    }
  ].filter(cat => cat.items.length > 0);

  return (
    <div className="w-64 bg-[#0B0F19] text-white h-screen flex flex-col flex-shrink-0 overflow-hidden font-sans border-r border-slate-800">
      {/* Header / Logo */}
      <div className="p-5 border-b border-slate-800/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
            DealPipeline
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">CRM v2.4 (Active)</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {categories.map((cat, idx) => (
          <div key={idx}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">
              {cat.title}
            </div>
            <div className="space-y-0.5">
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? 'bg-emerald-600/10 text-emerald-400 border-l-2 border-emerald-500' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Area */}
      <div className="p-3 space-y-2 bg-[#0B0F19] border-t border-slate-800">
        
        {/* Mobile App Button */}
        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all group">
           <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-200 group-hover:text-white">Mobile App</div>
            <div className="text-[10px] text-slate-500">Scan to Download</div>
          </div>
        </button>

        {/* User Profile */}
        <div className="mt-2 flex items-center gap-3 px-1 pt-2 border-t border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                {currentUser.name.charAt(0)}{currentUser.name.split(' ')[1]?.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-medium text-slate-200 truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 truncate">{currentUser.email}</span>
            </div>
            <button className="ml-auto text-slate-500 hover:text-slate-300">
                <Settings className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
};
