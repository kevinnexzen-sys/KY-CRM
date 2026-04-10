
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Calendar as CalendarIcon, LayoutGrid, ChevronLeft, ChevronRight, 
  Plus, Clock, User, MapPin, Filter, Search, MoreHorizontal, 
  CheckCircle2, AlertCircle, Sparkles, Mail, Send, X, Trash2
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, Priority, ScheduledEmail } from '../types';

export const Scheduler: React.FC = () => {
  const { 
    workOrders, technicians, updateWorkOrder, 
    scheduledEmails, scheduleEmail, cancelScheduledEmail,
    emailTemplates 
  } = useData();
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban' | 'emails'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newEmail, setNewEmail] = useState({
    workOrderId: '',
    recipient: '',
    subject: '',
    body: '',
    scheduledAt: ''
  });

  const handleScheduleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleEmail(newEmail);
    setShowScheduleModal(false);
    setNewEmail({ workOrderId: '', recipient: '', subject: '', body: '', scheduledAt: '' });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setNewEmail(prev => ({ ...prev, subject: template.subject, body: template.body }));
    }
  };

  const handleWorkOrderSelect = (woId: string) => {
    const wo = workOrders.find(w => w.id === woId);
    if (wo) {
      setNewEmail(prev => ({ 
        ...prev, 
        workOrderId: wo.id, 
        recipient: wo.email || '',
        body: prev.body.replace('[Client Name]', wo.customerName).replace('[Work Order ID]', wo.id)
      }));
    }
  };

  const handleAutoDispatch = async () => {
    setIsAutoDispatching(true);
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const unscheduled = workOrders.filter(wo => !wo.assignedTechId);
    for (const wo of unscheduled) {
      // Simple logic: assign to first active tech with matching trade or general
      const tech = technicians.find(t => t.status === 'Active' && (t.trade === wo.serviceType || t.trade === 'General'));
      if (tech) {
        updateWorkOrder(wo.id, { 
          assignedTechId: tech.id, 
          assignedTechName: tech.name,
          status: WorkOrderStatus.SCHEDULED
        });
      }
    }
    setIsAutoDispatching(false);
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.NEW: return 'bg-blue-100 text-blue-700 border-blue-200';
      case WorkOrderStatus.SCHEDULED: return 'bg-purple-100 text-purple-700 border-purple-200';
      case WorkOrderStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700 border-amber-200';
      case WorkOrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'text-red-600';
      case Priority.HIGH: return 'text-orange-600';
      case Priority.MEDIUM: return 'text-blue-600';
      default: return 'text-slate-500';
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const blanks = Array(firstDay).fill(null);
    const dayArray = Array.from({ length: days }, (_, i) => i + 1);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900">{monthNames[month]} {year}</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {blanks.map((_, i) => <div key={`blank-${i}`} className="border-r border-b border-slate-100 bg-slate-50/30 min-h-[120px]"></div>)}
          {dayArray.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOrders = workOrders.filter(wo => wo.date.startsWith(dateStr));
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            return (
              <div key={day} className={`border-r border-b border-slate-100 p-2 min-h-[120px] transition-colors hover:bg-slate-50/50 group ${isToday ? 'bg-emerald-50/20' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-bold ${isToday ? 'w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center' : 'text-slate-500'}`}>{day}</span>
                  {dayOrders.length > 0 && <span className="text-[10px] font-bold text-slate-400">{dayOrders.length} Jobs</span>}
                </div>
                <div className="space-y-1">
                  {dayOrders.slice(0, 3).map(order => (
                    <div 
                      key={order.id} 
                      className={`px-2 py-1 rounded-md border text-[10px] font-medium truncate cursor-pointer transition-all hover:scale-[1.02] ${getStatusColor(order.status)}`}
                      title={`${order.customerName} - ${order.serviceType}`}
                    >
                      {order.customerName}
                    </div>
                  ))}
                  {dayOrders.length > 3 && (
                    <div className="text-[10px] font-bold text-emerald-600 pl-1">+{dayOrders.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderKanban = () => {
    const columns = [
      { id: WorkOrderStatus.NEW, title: 'New Requests', icon: <AlertCircle className="w-4 h-4 text-blue-500" /> },
      { id: WorkOrderStatus.SCHEDULED, title: 'Scheduled', icon: <Clock className="w-4 h-4 text-purple-500" /> },
      { id: WorkOrderStatus.IN_PROGRESS, title: 'In Progress', icon: <Activity className="w-4 h-4 text-amber-500" /> },
      { id: WorkOrderStatus.COMPLETED, title: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
    ];

    return (
      <div className="flex gap-6 h-full overflow-x-auto pb-4 no-scrollbar">
        {columns.map(col => (
          <div key={col.id} className="w-80 shrink-0 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                {col.icon}
                <h3 className="text-sm font-bold text-slate-900">{col.title}</h3>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {workOrders.filter(wo => wo.status === col.id).length}
                </span>
              </div>
              <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {workOrders.filter(wo => wo.status === col.id).map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-move">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{order.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{order.customerName}</h4>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{order.serviceType}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{order.assignedTechName || 'Unassigned'}</span>
                      </div>
                      {!order.assignedTechId && (
                        <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                          <Sparkles className="w-2.5 h-2.5" />
                          Suggested: {technicians.find(t => t.trade === order.serviceType)?.name || 'General Tech'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(order.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Add Job
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmails = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scheduled Communications</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Automated Email Queue</p>
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Mail className="w-4 h-4" /> Schedule New Email
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {scheduledEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <Mail className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No emails scheduled</p>
              <p className="text-xs">Schedule automated follow-ups or notifications here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled For</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduledEmails.map(email => (
                  <tr key={email.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{email.recipient}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{email.workOrderId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-xs">{email.subject}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(email.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        email.status === 'SENT' ? 'bg-emerald-50 text-emerald-600' :
                        email.status === 'FAILED' ? 'bg-rose-50 text-rose-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => cancelScheduledEmail(email.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'calendar': return renderCalendar();
      case 'kanban': return renderKanban();
      case 'emails': return renderEmails();
      default: return renderCalendar();
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Scheduler</h1>
          <p className="text-sm text-slate-500">Manage service appointments and technician workloads</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={handleAutoDispatch}
            disabled={isAutoDispatching}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isAutoDispatching 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isAutoDispatching ? 'animate-spin' : ''}`} />
            {isAutoDispatching ? 'Optimizing...' : 'Auto-Dispatch'}
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button 
            onClick={() => setViewMode('emails')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'emails' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Mail className="w-4 h-4" /> Emails
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Schedule Email</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleScheduleEmail} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link Work Order</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newEmail.workOrderId}
                    onChange={(e) => handleWorkOrderSelect(e.target.value)}
                    required
                  >
                    <option value="">Select Work Order</option>
                    {workOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>{wo.id} - {wo.customerName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Template</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    <option value="">Select Template</option>
                    {emailTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient Email</label>
                <input 
                  type="email" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newEmail.recipient}
                  onChange={(e) => setNewEmail(prev => ({ ...prev, recipient: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Body</label>
                <textarea 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] resize-none"
                  value={newEmail.body}
                  onChange={(e) => setNewEmail(prev => ({ ...prev, body: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={newEmail.scheduledAt}
                  onChange={(e) => setNewEmail(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Activity: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);
