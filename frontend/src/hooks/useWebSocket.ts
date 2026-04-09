import { useEffect, useRef, useState } from 'react';

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

const WS_URL = 'ws://localhost:8080/game';

export default function useGameWebSocket(): UseGameWebSocketResult {
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unmounted = useRef(false);

    const connect = () => {
        if (unmounted.current) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            if (unmounted.current) return;
            setConnected(true);
        };

        ws.onmessage = (event) => {
            if (unmounted.current) return;
            try {
                const data = JSON.parse(event.data) as GameState;
                setGameState(data);
            } catch {
                // ignore malformed messages
            }
        };

        ws.onclose = () => {
            if (unmounted.current) return;
            setConnected(false);
            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            ws.close();
        };
    };

    useEffect(() => {
        unmounted.current = false;
        connect();

        return () => {
            unmounted.current = true;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
        };
    }, []);

    const send = (message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    };

    return { connected, gameState, send };
}
