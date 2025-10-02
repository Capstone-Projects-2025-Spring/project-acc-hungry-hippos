import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { movementStore } from '../game/scenes/MovementStore';
import { EventBus } from '../game/EventBus';

interface IWebSocketContext {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: object) => void;
  clearLastMessage?: () => void;
  connectedUsers: { userId: string; role: string; color?: string }[];
  gameStarted: boolean;
  resetGameState: () => void;
  gameMode: 'Easy' | 'Medium' | 'Hard' | null; // currently selected game mode (from START_GAME_BROADCAST)
}

const WebSocketContext = createContext<IWebSocketContext | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [connectedUsers, setConnectedUsers] = useState<{ userId: string; role: string; color?: string }[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'Easy' | 'Medium' | 'Hard' | null>(null);

  useEffect(() => {
    const WSS_URL = import.meta.env.VITE_WSS_URL || 'ws://localhost:4000';

    const socket = new WebSocket(WSS_URL);
    ws.current = socket;

    socket.onopen = () => {
      //console.log('[WS_CONTEXT] Connection established.');
      setIsConnected(true);

      // Attempt to restore session from localStorage
      try {
        const pathParts = window.location.pathname.split('/');
        const urlSessionId = pathParts[2];
        const urlUserId = pathParts[3];

        if (urlSessionId && urlUserId) {
          const stored = localStorage.getItem('playerSessions');
          const allSessions = stored ? JSON.parse(stored) : {};
          const playersInSession = allSessions[urlSessionId];

          if (playersInSession && playersInSession.length > 0) {
            
            const playerToRejoin = playersInSession.find((p: { userId: string; role: string; color?: string }) => p.userId === urlUserId);

            if (playerToRejoin) {
              console.log(`[WS_CONTEXT] Found previous player data. Attempting to rejoin as ${playerToRejoin.userId}`);
              
              socket.send(
                JSON.stringify({
                  type: 'PLAYER_JOIN', 
                  payload: {
                    sessionId: urlSessionId,
                    userId: playerToRejoin.userId,
                    role: playerToRejoin.role,
                    color: playerToRejoin.color,
                    isReconnecting: true
                  },
                })
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore session from storage', err);
      }
    };

    socket.onclose = () => {
      //console.log('[WS_CONTEXT] Connection closed.');
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log('[WS_CONTEXT] Message from server:', data);

      if (data.type === 'ERROR_MESSAGE') {
        console.error('[WS_CONTEXT] Received error from server:', data.payload.message);
        setLastMessage(data);
        return;
      }

      if (data.type === 'COLOR_UPDATE') {
        setLastMessage(data);
        return;
      }

      if (data.type === 'TIMER_UPDATE') {
       // console.log(`[WS_CONTEXT] Timer update: ${data.secondsLeft} seconds left`);
        EventBus.emit('TIMER_UPDATE', data.secondsLeft);

        setLastMessage({
          type: 'TIMER_UPDATE',
          payload: { secondsLeft: data.secondsLeft },
        });

        return;
      }

      if (data.type === 'LAUNCH_FOOD') {
        const { foodKey, angle } = data.payload;
        //console.log(`[WS_CONTEXT] Received LAUNCH_FOOD → ${foodKey}, angle ${angle}`);
        EventBus.emit('launch-food', { foodKey, angle });  // 👈 Send to Phaser
        return;
      }
      
      //update playermovement on socket
     if (data.type === 'PLAYER_MOVE_BROADCAST') {
       movementStore.notifyMove(data.payload);
       return;
      }

      if (data.type === 'START_GAME_BROADCAST') {
      //  console.log('[WS_CONTEXT] Game started!');
        setGameStarted(true);
        if (data.payload?.mode) {
          setGameMode(data.payload.mode);
        }
        setLastMessage(data);

        EventBus.emit('start-game');
        return;
      }

      if (data.type === 'SESSION_VALIDATED') {
        setSessionId(data.payload.gameCode);
      }

      if(data.type === 'SESSION_CREATED') {
        setSessionId(data.payload.sessionId);
      }

      if (data.type === 'SCORE_UPDATE_BROADCAST') {
        //console.log('[WS_CONTEXT] Received SCORE_UPDATE_BROADCAST:', data.payload.scores);
        EventBus.emit('scoreUpdate', data.payload);
        return;
      }

      if (data.type === 'GAME_OVER') {
        //console.log('[WS_CONTEXT] GAME_OVER');
        EventBus.emit('gameOver', data.payload);
        setLastMessage(data);
        return;
      }

      if (data.type === 'RESET_GAME_BROADCAST') {
        console.log('[WS_CONTEXT] Game reset received.');
        setGameStarted(false);
        setLastMessage(data);
        EventBus.emit('RESET_GAME');
        return;
      }

      if (data.type === 'USERS_LIST_UPDATE') {
        console.log('[WS_CONTEXT] Users updated from local storage:', data.payload.users);
        setConnectedUsers(data.payload.users);
        EventBus.emit('players-updated', data.payload.users);
        setLastMessage(data);
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
    if (!sessionId) {
      console.error('No sessionId set; cannot start timer.');
      return;
    }
    sendMessage({ type: 'START_TIMER', payload: { sessionId } });
  }, [sendMessage, sessionId]);


  // Method to reset game state
  const resetGameState = useCallback(() => {
    setGameStarted(false);
  }, []);

  const value = {
    isConnected,
    lastMessage,
    sendMessage,
    startTimer,
    clearLastMessage,
    connectedUsers,
    gameStarted,
    sessionId,
    resetGameState,
    gameMode
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

