import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from "./scenes/MainScenes";

export default function Game({view}: {view: "map" | "marketplace" | "harbor" | "broker" | "portProfile" | "cargoManagement" | "office"}) {

    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const initializedSize = useRef(false);

    useEffect(() => {
        if (!gameRef.current) return;

        const parent = gameRef.current;
        const w = parent.clientWidth  || window.innerWidth;
        const h = parent.clientHeight || window.innerHeight;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent,

            scale: {
                mode: Phaser.Scale.NONE,
            },

            width: w,
            height: h,

            scene: MainScene,
        };

        gameInstance.current = new Phaser.Game(config);
        initializedSize.current = true;

        const handleWindowResize = () => {
            const game = gameInstance.current;
            if (!game || !parent) return;
            const newW = parent.clientWidth  || window.innerWidth;
            const newH = parent.clientHeight || window.innerHeight;
            game.scale.resize(newW, newH);
        };
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            gameInstance.current?.destroy(true);
            gameInstance.current = null;
        };
    }, []);

    useEffect(() => {
        const game = gameInstance.current;
        if (!game) return;
        const scene = game.scene.getScene('MainScene') as Phaser.Scene | null;
        if (!scene) return;

        if (view === "map") {
            scene.input.enabled = true;
        } else {
            scene.input.enabled = false;
        }
    }, [view]);

    return (
        <div
            ref={gameRef}
            style={{
                width: '100%',
                height: '100%',
            }}
        />
    );
}
