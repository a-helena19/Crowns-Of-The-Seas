import React, { useEffect } from 'react';
import type { SessionDTO } from '../types/session';
import '../style/gameStartedModal.css';

interface GameStartedModalProps {
    session: SessionDTO;
    onClose: () => void;
}

export const GameStartedModal: React.FC<GameStartedModalProps> = ({ session, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="modal-overlay">
            <div className="modal-content game-started">
                <div className="modal-header">
                    <h2>🎮 Game Started!</h2>
                </div>

                <div className="modal-body">
                    <div className="game-info">
                        <div className="info-item">
                            <span className="label">Game Code:</span>
                            <span className="value">{session.gameCode}</span>
                        </div>

                        <div className="info-item">
                            <span className="label">Status:</span>
                            <span className="value status-running">{session.status}</span>
                        </div>

                        <div className="info-item">
                            <span className="label">Tick Rate:</span>
                            <span className="value">{session.tickRateSeconds}s</span>
                        </div>

                        <div className="info-item">
                            <span className="label">Players:</span>
                            <span className="value">{session.players.length} / {session.maxPlayers}</span>
                        </div>
                    </div>

                    <div className="players-info">
                        <h3>Players in Game</h3>
                        <div className="players-grid">
                            {session.players.map((player) => (
                                <div key={player.id} className="player-card">
                                    <div className="player-name">{player.playerName}</div>
                                    {player.isHost && <div className="player-badge">Host</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="countdown">
                        <p>Closing in 3 seconds...</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

