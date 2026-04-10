import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, CheckCircle2, User, Clock, ArrowLeft, Plus, Settings, Shield, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { View } from '../types';

interface CalendarIntegrationProps {
  onBack: () => void;
}

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ onBack }) => {
  const { 
    workOrders, technicians, fetchCalendarEvents, syncCalendarEvents, isGmailAuthenticated 
  } = useData();
  const [isConnected, setIsConnected] = useState(isGmailAuthenticated);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState('Not synced');
  const [events, setEvents] = useState<any[]>([]);
  const [calendarTimeZone, setCalendarTimeZone] = useState('UTC');

  const loadEvents = useCallback(async () => {
    if (!isGmailAuthenticated) return;
    
    setIsSyncing(true);
    const data = await fetchCalendarEvents();
    const googleEvents = data.events.map((ge: any) => ({
      id: ge.id,
      title: ge.summary,
      start: ge.start.dateTime || ge.start.date,
      end: ge.end.dateTime || ge.end.date,
      type: 'google',
      tech: 'External',
      color: 'bg-green-100 border-green-200 text-green-700'
    }));

    setCalendarTimeZone(data.timeZone);

    const crmEvents = workOrders.filter(wo => wo.assignedTechId).map(wo => ({
      id: wo.id,
      title: `${wo.serviceType} - ${wo.customerName}`,
      start: `${wo.date}T09:00:00Z`, // Assume UTC for CRM dates for now
      end: `${wo.date}T11:00:00Z`,
      type: 'crm',
      tech: technicians.find(t => t.id === wo.assignedTechId)?.name || 'Unassigned',
      color: 'bg-emerald-100 border-emerald-200 text-emerald-700'
    }));

    setEvents([...crmEvents, ...googleEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
    setIsSyncing(false);
    setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [isGmailAuthenticated, fetchCalendarEvents, workOrders, technicians]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSync = async () => {
    if (!isGmailAuthenticated) return;
    setIsSyncing(true);
    try {
      // Sync CRM work orders to Google Calendar
      await syncCalendarEvents(workOrders.filter(wo => wo.assignedTechId));
      await loadEvents();
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: calendarTimeZone
      }).format(date);
    } catch (e) {
      return 'Invalid Time';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: calendarTimeZone }).format(date),
        day: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: calendarTimeZone }).format(date)
      };
    } catch (e) {
      return { weekday: '?', day: '?' };
    }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Calendar? Sync will stop immediately.')) {
      setIsConnected(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <button onClick={onBack} className="absolute top-6 left-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <img src="https://logo.clearbit.com/google.com" alt="Google" className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Connect Google Calendar</h2>
            <p className="text-slate-500 mt-2">
              Sync technician schedules, avoid double-booking, and manage appointments directly from the CRM.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Permissions Required
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>View and edit events on all calendars</li>
                <li>See availability information</li>
                <li>Sync two-way updates automatically</li>
            </ul>
          </div>

          <button 
            onClick={() => setIsConnected(true)}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-sm font-medium text-slate-700"
          >
            <img src="https://logo.clearbit.com/google.com" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Google Calendar Sync
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                </h2>
                <p className="text-sm text-slate-500">Two-way synchronization enabled for 4 technicians</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleDisconnect}
                className="px-4 py-2 bg-white text-red-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-red-50"
            >
                Disconnect
            </button>
            <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-70"
            >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
                {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" /> Sync Settings
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Auto-sync interval</span>
                    <select className="text-sm border border-slate-300 rounded p-1">
                        <option>5 mins</option>
                        <option>15 mins</option>
                        <option>1 hour</option>
                    </select>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Sync direction</span>
                    <span className="text-sm font-medium">Two-way</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Last successful sync</span>
                    <span className="text-xs font-medium text-slate-700">{lastSynced}</span>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Technician Mapping
            </h3>
            <div className="space-y-3">
                {technicians.slice(0, 3).map((tech) => (
                    <div key={tech.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {tech.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{tech.name}</p>
                                <p className="text-xs text-slate-500">{tech.trade}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3 text-slate-400" />
                            <ArrowLeft className="w-3 h-3 text-slate-400 rotate-180 -ml-1" />
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                            <img src="https://logo.clearbit.com/google.com" alt="" className="w-4 h-4" />
                            <span className="text-xs font-medium text-green-800">{tech.name.toLowerCase().replace(' ', '.')}@gmail.com</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Live Calendar Preview */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Merged Schedule Preview
            </h3>
            <div className="flex gap-2">
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm"></span> CRM Work Orders
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></span> Google Calendar
                </div>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-1 gap-2">
                {events.map((event) => (
                    <div key={event.id} className={`p-3 rounded-lg border flex justify-between items-center ${event.color}`}>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center min-w-[60px] border-r border-black/10 pr-4">
                                <span className="text-xs font-bold uppercase">{formatDate(event.start).weekday}</span>
                                <span className="text-lg font-bold">{formatDate(event.start).day}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{event.title}</h4>
                                <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(event.start)} - {formatTime(event.end)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-md">
                                {event.tech}
                            </span>
                            {event.type === 'google' ? (
                                <img src="https://logo.clearbit.com/google.com" alt="G" className="w-4 h-4 opacity-70" />
                            ) : (
                                <Settings className="w-4 h-4 opacity-50" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};