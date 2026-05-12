import { useEffect, useState, useCallback } from 'react';
import { sessionApi } from '../api/sessionApi';
import type { SessionDTO } from '../types/session';
import { useSessionStore } from '../store/sessionStore';

interface UseGameEventsReturn {
    session: SessionDTO | null;
    isPolling: boolean;
    error: string | null;
    startPolling: (sessionId: string) => void;
    stopPolling: () => void;
}


export const useGameEvents = (): UseGameEventsReturn => {
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [intervalId, setIntervalId] = useState<number | null>(null);

    const { currentSession, setSession } = useSessionStore();

    const poll = useCallback(async (sessionId: string) => {
        try {
            const session = await sessionApi.getSession(sessionId);
            setSession(session);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch session updates';
            setError(message);
        }
    }, [setSession]);

    const stopPolling = useCallback(() => {
        if (intervalId !== null) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setIsPolling(false);
    }, [intervalId]);

    const startPolling = useCallback((sessionId: string) => {
        setIsPolling(true);
        setError(null);

        poll(sessionId);
        const id = window.setInterval(() => {
            poll(sessionId);
        }, 2000);

        setIntervalId(id);
    }, [poll]);

    useEffect(() => {
        if (currentSession?.status === 'RUNNING' && isPolling) {
            stopPolling();
        }
    }, [currentSession?.status, isPolling, stopPolling]);

    useEffect(() => {
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [intervalId]);

    return {
        session: currentSession,
        isPolling,
        error,
        startPolling,
        stopPolling
    };
};

