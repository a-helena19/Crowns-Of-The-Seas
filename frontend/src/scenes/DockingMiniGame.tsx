import { useEffect, useRef, useCallback } from 'react';
import Phaser from 'phaser';
import DockingScene from './DockingScene';
import { TOP_BAR_HEIGHT } from './GameScreen';

interface DockingMiniGameProps {
    mode: 'departure' | 'arrival';
    shipIconUrl: string;
    portName?: string;
    onSuccess: () => void;
    onFailure: (strikes: number) => void;
}

export default function DockingMiniGame({ mode, shipIconUrl, portName, onSuccess, onFailure }: DockingMiniGameProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const resolvedRef = useRef(false);
    // Refs ensure the Phaser callback always calls the latest handlers,
    // even if parent re-renders (e.g. pilotageMap WebSocket update) recreate them mid-game.
    const onSuccessRef = useRef(onSuccess);
    const onFailureRef = useRef(onFailure);
    onSuccessRef.current = onSuccess;
    onFailureRef.current = onFailure;

    const resolve = useCallback((succeeded: boolean, strikes: number = 3) => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        gameRef.current?.destroy(true);
        gameRef.current = null;
        if (succeeded) onSuccessRef.current();
        else onFailureRef.current(strikes);
    }, []); // stable — refs always point to latest handlers

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        resolvedRef.current = false;

        const sceneData = {
            mode,
            shipIconUrl,
            portName,
            onSuccess: () => resolve(true),
            onFailure: (strikes: number) => resolve(false, strikes),
        };

        const getSize = () => {
            const rect = container.getBoundingClientRect();
            return {
                width: Math.max(1, Math.floor(rect.width)),
                height: Math.max(1, Math.floor(rect.height)),
            };
        };

        let ready = false;
        const showCanvas = () => {
            if (ready) return;
            ready = true;
            container.style.opacity = '1';
        };

        const { width, height } = getSize();
        container.style.opacity = '0';

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            banner: false, // Phaser-Start-Banner in der Konsole ausblenden
            parent: container,
            width,
            height,
            backgroundColor: '#1a5276',
            physics: {
                default: 'arcade',
                arcade: { gravity: { x: 0, y: 0 }, debug: false },
            },
            scene: DockingScene,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
        };

        const game = new Phaser.Game(config);
        game.events.once('ready', () => {
            game.scene.start('DockingScene', sceneData);
            showCanvas();
        });
        gameRef.current = game;

        const observer = new ResizeObserver(() => {
            const size = getSize();
            if (gameRef.current) {
                gameRef.current.scale.resize(size.width, size.height);
                showCanvas();
            }
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
            if (!resolvedRef.current) {
                game.destroy(true);
                gameRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const instructionText = mode === 'departure'
        ? 'Kein Lotsendienst gebucht — steuere dein Schiff aus dem Hafen!'
        : 'Steuere dein Schiff in den Hafen ein und docke an!';

    return (
        <div style={{
            position: 'fixed',
            top: TOP_BAR_HEIGHT,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            background: '#0d2a3a',
        }}>
            <div style={{
                flexShrink: 0,
                background: 'rgba(0,0,0,0.75)',
                color: '#ecf0f1',
                padding: '6px 16px',
                fontSize: '13px',
                textAlign: 'center',
                borderBottom: '1px solid #2c3e50',
            }}>
                {instructionText}
            </div>
            <div
                ref={containerRef}
                style={{ flex: 1, minHeight: 0, overflow: 'hidden', opacity: 0, transition: 'opacity 0.15s ease' }}
            />
        </div>
    );
}