
import React from 'react';
import { useData } from '../contexts/DataContext';
import { Bell, X, CheckCircle2, AlertCircle, Info, Clock, Trash2 } from 'lucide-react';
import { Notification } from '../types';

export const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markNotificationAsRead, clearNotifications } = useData();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={clearNotifications}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
            title="Clear all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                onClick={() => markNotificationAsRead(notification.id)}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.isRead ? 'bg-emerald-50/30' : ''}`}
              >
                {!notification.isRead && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></span>
                )}
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold text-slate-900 mb-0.5 ${!notification.isRead ? '' : 'opacity-70'}`}>
                      {notification.title}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatTime(notification.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider">
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};
