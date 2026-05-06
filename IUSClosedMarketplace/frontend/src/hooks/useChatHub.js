import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { getApiAccessToken } from '../auth/authConfig';

export function useChatHub(threadId, onMessageReceived) {
  const connectionRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Clean up previous connection if threadId changes
    if (connectionRef.current) {
      connectionRef.current.stop();
      connectionRef.current = null;
      setConnected(false);
    }

    if (!threadId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/chat', {
        // accessTokenFactory is called by SignalR every time it needs to
        // (re)connect, so we always hand out a fresh MSAL token. Returning
        // a Promise here is supported.
        accessTokenFactory: async () => {
          const token = await getApiAccessToken();
          return token || '';
        },
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('ReceiveMessage', onMessageReceived);

    connection.start()
      .then(() => {
        connection.invoke('JoinThread', threadId);
        setConnected(true);
      })
      .catch((err) => console.warn('SignalR connection failed:', err));

    connectionRef.current = connection;

    return () => {
      if (connectionRef.current) {
        connectionRef.current
          .invoke('LeaveThread', threadId)
          .catch(() => {})
          .finally(() => {
            connectionRef.current?.stop();
            connectionRef.current = null;
          });
      }
    };
  }, [threadId]);

  return { connected };
}
