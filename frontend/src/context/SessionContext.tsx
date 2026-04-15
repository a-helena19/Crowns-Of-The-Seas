import { createContext, useState, type ReactNode, useCallback } from 'react';
import { sessionApi } from '../api/sessionApi';

export interface Session {
    id: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    hostName: string;
    players: number;
    maxPlayers: number;
}

interface SessionContextType {
    sessions: Session[];
    createSession: (hostName: string, maxPlayers: number, tickRateSeconds: number, totalTicks: number, duration: string) => Promise<Session | null>;
    joinSession: (gameCode: string, playerName?: string) => Promise<Session | null>;
    startSession: (sessionId: string) => Promise<void>;
    getSessionByCode: (gameCode: string) => Session | null;
    updateSessionPlayers: (gameCode: string, playerCount: number) => void;
}

export type { SessionContextType };

const SessionContext = createContext<SessionContextType | null>(null);

export { SessionContext };

export function SessionProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[]>([]);

    const createSession = useCallback(async (hostName: string, maxPlayers: number, tickRateSeconds: number, totalTicks: number, duration: string): Promise<Session | null> => {
        try {
            const response = await sessionApi.createSession({
                hostName,
                maxPlayers,
                tickRateSeconds,
                totalTicks,
                duration
            });

            const newSession: Session = {
                id: response.id,
                gameCode: response.gameCode,
                status: response.status as 'LOBBY' | 'RUNNING' | 'FINISHED',
                hostName,
                players: response.players.length,
                maxPlayers
            };

            setSessions(prev => [...prev, newSession]);
            return newSession;
        } catch (error: unknown) {
            console.error('Error creating session:', error);
            return null;
        }
    }, []);

    const joinSession = useCallback(async (gameCode: string, playerName: string = 'Player'): Promise<Session | null> => {
        try {
            console.log('SessionContext.joinSession called with:', { gameCode, playerName });
            const response = await sessionApi.joinSession({
                gameCode,
                playerName
            });

            console.log('API response:', response);

            // Find the host player (isHost: true)
            interface Player {
                playerName: string;
                isHost?: boolean;
            }
            const hostPlayer = response.players.find((p: Player) => p.isHost);
            const hostName = hostPlayer?.playerName || 'Host';

            const updatedSession: Session = {
                id: response.id,
                gameCode: response.gameCode,
                status: response.status as 'LOBBY' | 'RUNNING' | 'FINISHED',
                hostName,
                players: response.players.length,
                maxPlayers: response.maxPlayers
            };

            console.log('Creating session object:', updatedSession);

            setSessions(prev => {
                const existing = prev.find(s => s.gameCode === gameCode);
                if (existing) {
                    return prev.map(s => s.gameCode === gameCode ? updatedSession : s);
                }
                return [...prev, updatedSession];
            });

            return updatedSession;
        } catch (error: unknown) {
            console.error('Error joining session:', error);
            // Re-throw the error so JoinSessionPage can handle it
            throw error;
        }
    }, []);

    const startSession = useCallback(async (sessionId: string) => {
        try {
            await sessionApi.startGame(sessionId, { });

            setSessions(prev =>
                prev.map(s =>
                    s.id === sessionId
                        ? { ...s, status: 'RUNNING' }
                        : s
                )
            );
        } catch (error: unknown) {
            console.error('Error starting session:', error);
        }
    }, []);

    const getSessionByCode = useCallback((gameCode: string): Session | null => {
        return sessions.find(s => s.gameCode === gameCode.toUpperCase()) || null;
    }, [sessions]);

    const updateSessionPlayers = useCallback((gameCode: string, playerCount: number) => {
        setSessions(prev =>
            prev.map(s =>
                s.gameCode === gameCode
                    ? { ...s, players: playerCount }
                    : s
            )
        );
    }, []);

    return (
        <SessionContext.Provider value={{
            sessions,
            createSession,
            joinSession,
            startSession,
            getSessionByCode,
            updateSessionPlayers
        }}>
            {children}
        </SessionContext.Provider>
    );
}


