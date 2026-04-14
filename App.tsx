
import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WorkOrders } from './components/WorkOrders';
import { Technicians } from './components/Technicians';
import { Chat } from './components/Chat';
import { AIChatWidget } from './components/AIChatWidget';
import { Browser } from './components/Browser';
import { LiveMonitoring } from './components/LiveMonitoring';
import { EmailClient } from './components/EmailClient';
import { CalendarIntegration } from './components/CalendarIntegration';
import { OpenPhone } from './components/OpenPhone';
import { Training } from './components/Training';
import { AppBuilder } from './components/AppBuilder';
import { Invoices, Corporations, Clients, Tasks, OfficeExpense } from './components/CRMModules';
import { ApprovedWorkOrders } from './components/ApprovedWorkOrders';
import { Employees } from './components/Employees';
import { PDFEditor, Reports, Settings, Reminders, QuickPhone } from './components/ToolsModules';
import { AutomationHub } from './components/AutomationHub';
import { Inventory } from './components/Inventory';
import { Scheduler } from './components/Scheduler';
import { Dispatch } from './components/Dispatch';
import { NotificationPanel } from './components/NotificationPanel';
import { Login } from './components/Login';
import { View, User } from './types';
import { useData } from './contexts/DataContext';
import { useLiveStatus } from './src/hooks/useLiveStatus';
import { Search, X, Bell, User as UserIcon, ChevronRight, FileText, Building2 } from 'lucide-react';

function App() {
  const { currentView, navigateTo, isMasterAdmin, currentUser, globalSearch, logout, notifications } = useData();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Report live status
  useLiveStatus(currentView, currentUser?.id || 'anonymous', currentUser?.name || 'Anonymous');

  if (!currentUser) {
    return <Login />;
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSearchResults(globalSearch(query));
  };

  const renderContent = () => {
    // Role-based access control
    const rolePermissions: Record<string, View[]> = {
      'Master Admin': Object.values(View),
      'Admin': Object.values(View).filter(v => ![View.LIVE_MONITORING].includes(v)),
      'Manager': [
        View.DASHBOARD, View.WORK_ORDERS, View.APPROVED_WORK_ORDERS, View.TECHNICIANS, View.MAP, 
        View.CLIENTS, View.CORPORATIONS, View.INVOICES, View.TASKS, 
        View.CHAT, View.EMAIL, View.SCHEDULER, View.DISPATCH, View.REPORTS,
        View.INVENTORY
      ],
      'Technician': [
        View.DASHBOARD, View.WORK_ORDERS, View.TASKS, View.CHAT, View.TRAINING, View.MAP
      ],
      'Dispatcher': [
        View.DASHBOARD, View.WORK_ORDERS, View.APPROVED_WORK_ORDERS, View.TECHNICIANS, View.MAP, 
        View.CHAT, View.SCHEDULER, View.DISPATCH
      ]
    };

    const allowedViews = rolePermissions[currentUser.role] || [View.DASHBOARD];
    
    if (!allowedViews.includes(currentView)) {
      return <Dashboard />;
    }

    switch (currentView) {
      case View.DASHBOARD: return <Dashboard />;
      case View.WORK_ORDERS: return <WorkOrders />;
      case View.APPROVED_WORK_ORDERS: return <ApprovedWorkOrders />;
      case View.TECHNICIANS: return <Technicians initialViewMode='list' />;
      case View.MAP: return <Technicians initialViewMode='map' />;
      case View.CHAT: return <Chat />;
      case View.EMAIL: return <EmailClient />;
      case View.OPEN_PHONE: return <OpenPhone />;
      
      // CRM Modules
      case View.INVOICES: return <Invoices />;
      case View.CORPORATIONS: return <Corporations />;
      case View.CLIENTS: return <Clients />;
      case View.EMPLOYEES: return <Employees />;
      case View.TASKS: return <Tasks />;
      case View.OFFICE_EXPENSE: return <OfficeExpense />;
      case View.INVENTORY: return <Inventory />;

      // Complex Tool Modules
      case View.BROWSER: return <Browser />;
      case View.LIVE_MONITORING: return <LiveMonitoring />;
      case View.AUTOMATION: return <AutomationHub />;
      case View.CALENDAR_INTEGRATION: return <CalendarIntegration onBack={() => navigateTo(View.AUTOMATION)} />;
      case View.TRAINING: return <Training />;

      // Simple/Placeholder Tools
      case View.PDF_EDITOR: return <PDFEditor />;
      case View.REPORTS: return <Reports />;
      case View.SETTINGS: return <Settings />;
      case View.REMINDERS: return <Reminders />;
      case View.QUICK_PHONE: return <QuickPhone />;

      // Admin Tools
      case View.APP_BUILDER: return <AppBuilder />;
      case View.SCHEDULER: return <Scheduler />;
      case View.DISPATCH: return <Dispatch />;
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Global Header / Search Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40">
          <div className="flex-1 max-w-2xl relative">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchFocused ? 'text-emerald-500' : 'text-slate-400'}`} />
              <input 
                type="text" 
                placeholder="Global Search (Work Orders, Techs, Clients...)" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full pl-10 pr-10 py-2 bg-slate-100 border-transparent border focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl text-sm transition-all outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="p-2">
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => {
                        navigateTo(result.view);
                        setSearchQuery('');
                        // We might need a way to pass the ID to the view, 
                        // but for now we just navigate.
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        result.type === 'Work Order' ? 'bg-blue-50 text-blue-600' : 
                        result.type === 'Technician' ? 'bg-emerald-50 text-emerald-600' : 
                        'bg-purple-50 text-purple-600'
                      }`}>
                        {result.type === 'Work Order' ? <FileText className="w-5 h-5" /> : 
                         result.type === 'Technician' ? <UserIcon className="w-5 h-5" /> : 
                         <Building2 className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900 truncate">{result.title}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{result.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              Sign Out
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{currentUser.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 relative custom-scrollbar">
          {renderContent()}
        </div>
        
        <AIChatWidget />
      </main>
    </div>
  );
}

export default App;
