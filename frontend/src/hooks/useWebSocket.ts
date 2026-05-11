import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp, { Client } from 'stompjs';

interface GameState {
    ship: { x: number; y: number; status: string };
    tickRateMs: number;
    ports: Array<{ name: string; x: number; y: number }>;
}

interface UseGameWebSocketResult {
    connected: boolean;
    gameState: GameState | null;
    send: (message: object) => void;
}

export default function useGameWebSocket(): UseGameWebSocketResult {
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const sessionData = sessionStorage.getItem('currentSession');
        const sessionId = sessionData ? JSON.parse(sessionData).id : null;

        const wsUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8080/ws'
            : '/ws';
        const socket = new SockJS(wsUrl);
        const client = Stomp.over(socket);

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        client.connect(headers, () => {
            setConnected(true);
            clientRef.current = client;

            if (sessionId) {
                client.subscribe(`/topic/session/${sessionId}`, (msg) => {
                    try {
                        setGameState(JSON.parse(msg.body));
                    } catch { /* ignore */ }
                });
                client.send(`/app/session/${sessionId}/subscribe`, {});
            }
        }, () => {
            setConnected(false);
        });

        return () => {
            const c = clientRef.current;
            if (c && c.connected) {
                c.disconnect(() => {});
            }
            clientRef.current = null;
            setConnected(false);
        };
    }, []);

    const send = (message: object) => {
        if (clientRef.current?.connected) {
            clientRef.current.send('/app/game', {}, JSON.stringify(message));
        }
    };

    return { connected, gameState, send };
}