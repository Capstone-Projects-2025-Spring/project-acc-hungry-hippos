import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { movementStore } from '../game/scenes/MovementStore';
import { EventBus } from '../game/EventBus';

interface IWebSocketContext {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: object) => void;
  clearLastMessage?: () => void;
  connectedUsers: { userId: string; role: string }[];
  gameStarted: boolean;
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connectedUsers, setConnectedUsers] = useState<{ userId: string; role: string }[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const WSS_URL = import.meta.env.VITE_WSS_URL || 'ws://localhost:4000';

    const socket = new WebSocket(WSS_URL);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[WS_CONTEXT] Connection established.');
      setIsConnected(true);
    };

    socket.onclose = () => {
      console.log('[WS_CONTEXT] Connection closed.');
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log('[WS_CONTEXT] Message from server:', data);

      if (data.type === 'TIMER_UPDATE') {
        console.log(`[WS_CONTEXT] Timer update: ${data.secondsLeft} seconds left`);
        EventBus.emit('TIMER_UPDATE', data.secondsLeft);

        setLastMessage({
          type: 'TIMER_UPDATE',
          payload: { secondsLeft: data.secondsLeft },
        });

        return;
      }

      if (data.type === 'LAUNCH_FOOD') {
        const { foodKey, angle } = data.payload;
        console.log(`[WS_CONTEXT] Received LAUNCH_FOOD → ${foodKey}, angle ${angle}`);
        EventBus.emit('launch-food', { foodKey, angle });  // 👈 Send to Phaser
        return;
      }
      
      //update playermovement on socket
     if (data.type === 'PLAYER_MOVE_BROADCAST') {
       movementStore.notifyMove(data.payload);
       return;
      }

      //

      if (data.type === 'USERS_LIST_UPDATE') {
        setConnectedUsers(data.payload.users);
        return; 
      }  

      if (data.type === 'START_GAME_BROADCAST') {
        console.log('[WS_CONTEXT] Game started!');
        setGameStarted(true);
        setLastMessage(data);

        EventBus.emit('start-game');
        return;
      }

      if (data.type === 'SCORE_UPDATE_BROADCAST') {
        console.log('[WS_CONTEXT] Received SCORE_UPDATE_BROADCAST:', data.payload.scores);
        EventBus.emit('scoreUpdate', data.payload);
        return;
      }
      setLastMessage(data);
    };

    socket.onerror = (err) => {
      console.error('[WS_CONTEXT] WebSocket error:', err);
    };

    return () => {
      socket.close();
    };
  }, []);

  const clearLastMessage = useCallback(() => {
    setLastMessage(null);
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('[WS_CONTEXT] Cannot send message, WebSocket is not open.');
    }
  }, []);

  // Method to start timer
  const startTimer = useCallback(() => {
    sendMessage({ type: 'startTimer' });
  }, [sendMessage]);

  const value = {
    isConnected,
    lastMessage,
    sendMessage,
    startTimer,
    clearLastMessage,
    connectedUsers,
    gameStarted,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

