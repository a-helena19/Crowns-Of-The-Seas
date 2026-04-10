import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { SessionDTO } from '../types/session';
import '../style/gameScreen.css';

interface GameScreenProps {
    session: SessionDTO;
    playerId: string;
    currentUserId: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({ session, playerId, currentUserId }) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        // Destroy previous game instance if it exists
        if (gameRef.current) {
            gameRef.current.destroy(true);
        }

        // Create Phaser scene
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            width: 1280,
            height: 720,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: new GameScene(session, playerId, currentUserId),
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false
                }
            }
        };

        gameRef.current = new Phaser.Game(config);

        // Cleanup
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
            }
        };
    }, [session, playerId, currentUserId]);

    return <div ref={gameContainerRef} className="game-screen-container" />;
};


class GameScene extends Phaser.Scene {
    private session: SessionDTO;
    private currentUserId: string;
    private playerGraphics: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private playerTexts: Map<string, Phaser.GameObjects.Text> = new Map();

    constructor(session: SessionDTO, _playerId: string, currentUserId: string) {
        super('GameScene');
        this.session = session;
        // _playerId is not used currently but kept for future use
        this.currentUserId = currentUserId;
    }

    create(): void {
        const { width, height } = this.scale;

        // Create background
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

        // Title with game code
        this.add.text(width / 2, 20, `Game: ${this.session.gameCode}`, {
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0);

        // Create player representations
        const playerCount = this.session.players.length;
        const colors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00];

        this.session.players.forEach((player, index) => {
            const color = colors[index % colors.length];
            const x = (width / (playerCount + 1)) * (index + 1);
            const y = height / 2;

            // Draw player rectangle
            const playerRect = this.add.rectangle(x, y, 80, 80, color, 0.7);
            playerRect.setInteractive();
            this.playerGraphics.set(player.id, playerRect);

            // Draw player name
            const playerText = this.add.text(x, y, player.playerName, {
                fontSize: '14px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0.5);
            this.playerTexts.set(player.id, playerText);

            // Highlight current player
            if (player.userId === this.currentUserId) {
                playerRect.setStrokeStyle(3, 0xffffff);
            }
        });

        // Info text at bottom
        const infoText = `Players: ${this.session.players.length}/${this.session.maxPlayers} | Tick Rate: ${this.session.tickRateSeconds}s`;
        this.add.text(width / 2, height - 20, infoText, {
            fontSize: '16px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5, 1);

        // Status text
        this.add.text(20, 60, `Status: ${this.session.status}`, {
            fontSize: '16px',
            color: '#ffff00'
        });
    }

    update(): void {
        // Update game logic here
        // For now, it's just a static display
    }
}

