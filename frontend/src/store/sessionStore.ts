import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionDTO, SessionPlayerDTO, SessionStatus } from '../types/session';

interface SessionStore {
    currentSession: SessionDTO | null;
    currentUserId: string | null;
    currentPlayerName: string | null;
    isHost: boolean;
    gameCode: string | null;

    // Actions
    setSession: (session: SessionDTO) => void;
    setUserId: (userId: string) => void;
    setPlayerName: (name: string) => void;
    updatePlayers: (players: SessionPlayerDTO[]) => void;
    updateStatus: (status: SessionStatus) => void;
    reset: () => void;
}

const initialState = {
    currentSession: null as SessionDTO | null,
    currentUserId: null as string | null,
    currentPlayerName: null as string | null,
    isHost: false,
    gameCode: null as string | null,
};

export const useSessionStore = create<SessionStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setSession: (session: SessionDTO): void => {
                set({
                    currentSession: session,
                    gameCode: session.gameCode,
                    isHost: session.players.some(p => p.isHost && p.userId === get().currentUserId)
                });
            },

            setUserId: (userId: string): void => {
                set({ currentUserId: userId });
            },

            setPlayerName: (name: string): void => {
                set({ currentPlayerName: name });
            },

            updatePlayers: (players: SessionPlayerDTO[]): void => {
                set((state) => {
                    if (state.currentSession) {
                        return {
                            currentSession: {
                                ...state.currentSession,
                                players
                            }
                        };
                    }
                    return {};
                });
            },

            updateStatus: (status: SessionStatus): void => {
                set((state) => {
                    if (state.currentSession) {
                        return {
                            currentSession: {
                                ...state.currentSession,
                                status
                            }
                        };
                    }
                    return {};
                });
            },

            reset: (): void => {
                set(initialState);
            }
        }),
        {
            name: 'session-store'
        }
    )
);

