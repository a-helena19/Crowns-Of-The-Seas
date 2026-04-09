import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScenes from './pages/MainScenes.ts';

export default function Game() {
    const gameRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const width = gameRef.current!.clientWidth;
        const height = gameRef.current!.clientHeight;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width,
            height,
            parent: gameRef.current!,
            transparent: false,
            scene: MainScenes,
        };

        const game = new Phaser.Game(config);

        return () => {
            game.destroy(true);
        };
    }, []);

    return <div ref={gameRef} style={{ flex: 1, zIndex: 0 }} />;
}
