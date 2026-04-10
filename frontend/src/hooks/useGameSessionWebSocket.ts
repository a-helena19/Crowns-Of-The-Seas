import { useEffect, useRef, useCallback, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp, { Client } from 'stompjs';

interface SessionUpdateEvent {
    sessionId: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    playerCount: number;
    maxPlayers: number;
    players: Array<{
        userId: string;
        playerName: string;
        isHost: boolean;
    }>;
    eventType: string;
}

interface UseGameSessionWebSocketProps {
    sessionId: string | null;
    onSessionUpdate: (event: SessionUpdateEvent) => void;
}

export function useGameSessionWebSocket({
    sessionId,
    onSessionUpdate
}: UseGameSessionWebSocketProps) {
    const stompClientRef = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const connectAttemptedRef = useRef(false);

    const connect = useCallback(() => {
        if (!sessionId) {
            console.log('No sessionId provided');
            return;
        }

        if (connectAttemptedRef.current && isConnected) {
            console.log('Already connected');
            return;
        }

        connectAttemptedRef.current = true;

        try {
            // Connect directly to backend WebSocket, not through proxy
            // This avoids issues with vite proxy and ECONNRESET
            const wsUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8080/ws'
                : `/ws`;

            console.log('Connecting to WebSocket:', wsUrl);
            const socket = new SockJS(wsUrl);
            const client = Stomp.over(socket);

            client.connect(
                {},
                () => {
                    console.log('WebSocket connected');
                    setIsConnected(true);
                    stompClientRef.current = client;

                    // Subscribe to session updates
                    client.subscribe(`/topic/session/${sessionId}`, (message) => {
                        console.log('Received session update:', message.body);
                        try {
                            const event = JSON.parse(message.body) as SessionUpdateEvent;
                            onSessionUpdate(event);
                        } catch (error) {
                            console.error('Error parsing session update:', error);
                        }
                    });

                    // Send subscribe message
                    client.send(`/app/session/${sessionId}/subscribe`, {});
                },
                (error) => {
                    console.error('WebSocket connection error:', error);
                    setIsConnected(false);
                    connectAttemptedRef.current = false; // Reset so we can try again
                }
            );
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            setIsConnected(false);
            connectAttemptedRef.current = false; // Reset so we can try again
        }
    }, [sessionId, onSessionUpdate, isConnected]);

    const disconnect = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.disconnect(() => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                connectAttemptedRef.current = false;
                stompClientRef.current = null;
            });
        }
    }, []);

    useEffect(() => {
        if (sessionId && !isConnected) {
            const timer = setTimeout(() => {
                connect();
            }, 500); // Small delay to ensure session is ready

            return () => clearTimeout(timer);
        }

        return () => {
            disconnect();
        };
    }, [sessionId, isConnected, connect, disconnect]);

    return {
        isConnected,
        disconnect
    };
}

