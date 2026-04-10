import { useEffect, useRef } from 'react';
import { View } from '../../types';

export const useLiveStatus = (currentView: View, userId: string, userName: string) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    const sendUpdate = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'status:update',
          userId,
          payload: {
            user: userName,
            app: currentView,
            status: 'Active',
            activeTime: 'Live',
            idle: false
          }
        }));
      }
    };

    ws.onopen = sendUpdate;
    
    const interval = setInterval(sendUpdate, 5000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [currentView, userId, userName]);
};
