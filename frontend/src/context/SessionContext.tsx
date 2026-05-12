import { createContext, useState, type ReactNode, useCallback } from 'react';
import { sessionApi } from '../api/sessionApi';
import type { PlayerFaction } from '../types/faction';

export interface Session {
    id: string;
    gameCode: string;
    status: 'LOBBY' | 'RUNNING' | 'FINISHED';
    hostName: string;
    players: number;
    maxPlayers: number;
    playersList?: Array<{
        userId: string;
        playerName: string;
        isHost: boolean;
        faction?: PlayerFaction | null;
    }>;
}

interface SessionContextType {
    sessions: Session[];
    createSession: (hostName: string, maxPlayers: number, tickRateSeconds: number, totalTicks: number, duration: string) => Promise<Session | null>;
    joinSession: (gameCode: string, playerName?: string) => Promise<Session | null>;
    startSession: (sessionId: string) => Promise<void>;
    getSessionByCode: (gameCode: string) => Session | null;
    updateSessionPlayers: (gameCode: string, playerCount: number) => void;
    assignPlayerFaction: (sessionId: string, userId: string, faction: PlayerFaction) => Promise<void>;
    markPlayerReady: (sessionId: string, userId: string) => Promise<void>;
    getReadyStatus: (sessionId: string) => Promise<any>;
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
                maxPlayers,
                playersList: response.players.map(p => ({
                    userId: p.userId,
                    playerName: p.playerName,
                    isHost: p.isHost,
                    faction: p.faction as PlayerFaction | null
                }))
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
                maxPlayers: response.maxPlayers,
                playersList: response.players.map(p => ({
                    userId: p.userId,
                    playerName: p.playerName,
                    isHost: p.isHost,
                    faction: p.faction as PlayerFaction | null
                }))
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

    const assignPlayerFaction = useCallback(
        async (sessionId: string, userId: string, faction: PlayerFaction) => {
            try {
                await sessionApi.assignPlayerFaction(sessionId, userId, faction);
                console.log(`✓ Faction ${faction} assigned to player ${userId}`);
            } catch (error: unknown) {
                console.error('Error assigning faction:', error);
                throw error;
            }
        },
        []
    );

    const markPlayerReady = useCallback(
        async (sessionId: string, userId: string) => {
            try {
                await sessionApi.markPlayerReady(sessionId, userId);
                console.log(`✓ Player ${userId} marked as ready`);
            } catch (error: unknown) {
                console.error('Error marking player ready:', error);
                throw error;
            }
        },
        []
    );

    const getReadyStatus = useCallback(
        async (sessionId: string) => {
            try {
                const status = await sessionApi.getReadyStatus(sessionId);
                return status;
            } catch (error: unknown) {
                console.error('Error getting ready status:', error);
                throw error;
            }
        },
        []
    );

    return (
        <SessionContext.Provider
            value={{
                sessions,
                createSession,
                joinSession,
                startSession,
                getSessionByCode,
                updateSessionPlayers,
                assignPlayerFaction,
                markPlayerReady,
                getReadyStatus,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}


