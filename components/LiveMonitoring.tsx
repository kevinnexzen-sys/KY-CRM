import React, { useState, useEffect } from 'react';
import { Activity, Monitor, User, AlertCircle, Clock } from 'lucide-react';

export const LiveMonitoring: React.FC = () => {
  const [screens, setScreens] = useState<any[]>([]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'status:all') {
          setScreens(message.payload);
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Live Employee Monitoring</h2>
          <p className="text-sm text-slate-500">Real-time screen view and activity tracking (Admin Only)</p>
        </div>
        <div className="flex gap-2">
            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                <Activity className="w-3 h-3" /> {screens.length} Active Sessions
            </span>
        </div>
      </div>

      {screens.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-slate-500">
          <Monitor className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">No active sessions detected</p>
          <p className="text-xs">Sessions will appear here as users interact with the platform</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screens.map((screen) => (
            <div key={screen.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
              {/* Screen Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                          {screen.user.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{screen.user}</span>
                  </div>
                  {screen.idle ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" /> Idle
                      </span>
                  ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-green-50 px-2 py-0.5 rounded">
                          <Monitor className="w-3 h-3" /> Live
                      </span>
                  )}
              </div>
              
              {/* Screen Content Simulation */}
              <div className="aspect-video bg-slate-800 relative group-hover:opacity-95 transition-opacity">
                  {/* Simulated Interface Lines */}
                  <div className="absolute top-4 left-4 right-4 h-2 bg-slate-700 rounded opacity-50"></div>
                  <div className="absolute top-8 left-4 w-1/3 h-20 bg-slate-700 rounded opacity-30"></div>
                  <div className="absolute top-8 right-4 w-1/2 h-20 bg-slate-700 rounded opacity-30"></div>
                  <div className="absolute bottom-4 left-4 right-4 h-1/3 bg-slate-700 rounded opacity-20"></div>

                  {/* Overlay on Idle */}
                  {screen.idle && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                          <div className="flex items-center gap-2 text-white/80">
                              <Clock className="w-5 h-5" />
                              <span className="text-sm font-medium">Session Idle</span>
                          </div>
                      </div>
                  )}
              </div>

              {/* Footer Stats */}
              <div className="p-3 flex justify-between items-center text-xs text-slate-500">
                  <span>App: <strong className="text-slate-700">{screen.app}</strong></span>
                  <span>Last Seen: {new Date(screen.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
            <h4 className="text-sm font-bold text-amber-800">Privacy Notice</h4>
            <p className="text-xs text-amber-700 mt-1">
                Monitoring is active. Please ensure compliance with local labor laws regarding employee surveillance. 
                All sessions are recorded and stored for 30 days.
            </p>
        </div>
      </div>
    </div>
  );
};
