import React, { useState, useEffect, useMemo } from 'react';
import { SessionLobby } from '../components/SessionLobby';
import { GameStartedModal } from '../components/GameStartedModal';
import { GameScreen } from '../components/GameScreen';
import { useSessionStore } from '../store/sessionStore';
import { useGameEvents } from '../hooks/useGameEvents';
import type { SessionPlayerDTO } from '../types/session';
import { SESSION_STATUS } from '../types/session';
import '../styles/gamePage.css';

// main game page that handles the flow of the game
export const GamePage: React.FC = () => {
    // Generate userId once on mount
    const [currentUserId] = useState(() => 'user-' + Math.random().toString(36).substr(2, 9));

    const { currentSession } = useSessionStore();
    const { startPolling, stopPolling } = useGameEvents();

    const [showGameStartModal, setShowGameStartModal] = useState(false);
    const [showGameScreen, setShowGameScreen] = useState(false);

    // Start polling when in lobby
    useEffect(() => {
        if (currentSession && currentSession.status === SESSION_STATUS.LOBBY) {
            startPolling(currentSession.id);
        } else if (currentSession && currentSession.status === SESSION_STATUS.RUNNING) {
            stopPolling();
            setShowGameStartModal(true);
        }
    }, [currentSession, startPolling, stopPolling]);

    const handleGameStarted = (sessionId: string) => {
        console.log('Game started with session:', sessionId);
        setShowGameStartModal(true);
    };

    const handleModalClose = () => {
        setShowGameStartModal(false);
        setShowGameScreen(true);
    };

    const currentPlayer: SessionPlayerDTO | undefined = useMemo(
        () => currentSession?.players.find((p: SessionPlayerDTO) => p.userId === currentUserId),
        [currentSession, currentUserId]
    );

    // Game screen
    if (showGameScreen && currentSession) {
        return (
            <div className="game-page">
                <GameScreen
                    session={currentSession}
                    playerId={currentPlayer?.id || ''}
                    currentUserId={currentUserId}
                />
            </div>
        );
    }

    // Game started modal
    if (showGameStartModal && currentSession) {
        return (
            <div className="game-page">
                <GameStartedModal session={currentSession} onClose={handleModalClose} />
            </div>
        );
    }

    // Lobby
    return (
        <div className="game-page">
            <SessionLobby currentUserId={currentUserId} onGameStarted={handleGameStarted} />
        </div>
    );
};

