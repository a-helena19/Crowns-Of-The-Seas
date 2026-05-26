import { useState } from 'react';
import { sessionApi } from '../api/sessionApi';
import type { SessionDTO, CreateSessionRequest, JoinSessionRequest } from '../types/session';
import { useSessionStore } from '../store/sessionStore';

interface UseGameSessionReturn {
    session: SessionDTO | null;
    loading: boolean;
    error: string | null;
    createSession: (req: CreateSessionRequest) => Promise<SessionDTO>;
    joinSession: (req: JoinSessionRequest) => Promise<SessionDTO>;
    startGame: (hostUserId: string) => Promise<SessionDTO>;
    loadSession: (sessionId: string) => Promise<void>;
    clearSession: () => void;
}

export const useGameSession = (): UseGameSessionReturn => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { currentSession, setSession, reset } = useSessionStore();

    const createSession = async (req: CreateSessionRequest): Promise<SessionDTO> => {
        try {
            setLoading(true);
            setError(null);
            const session = await sessionApi.createSession(req);
            setSession(session);
            return session;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Session konnte nicht erstellt werden';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const joinSession = async (req: JoinSessionRequest): Promise<SessionDTO> => {
        try {
            setLoading(true);
            setError(null);
            const session = await sessionApi.joinSession(req);
            setSession(session);
            return session;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Session konnte nicht betreten werden';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const startGame = async (hostUserId: string): Promise<SessionDTO> => {
        try {
            setLoading(true);
            setError(null);
            if (!currentSession) {
                const error = new Error('Keine aktive Session');
                setError(error.message);
                throw error;
            }
            const session = await sessionApi.startGame(currentSession.id, { hostUserId });
            setSession(session);
            return session;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Spiel konnte nicht gestartet werden';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const loadSession = async (sessionId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            const session = await sessionApi.getSession(sessionId);
            setSession(session);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Session konnte nicht geladen werden';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const clearSession = (): void => {
        reset();
        setError(null);
    };

    return {
        session: currentSession,
        loading,
        error,
        createSession,
        joinSession,
        startGame,
        loadSession,
        clearSession
    };
};

