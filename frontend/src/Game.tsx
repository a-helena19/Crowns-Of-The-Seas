import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from "./scenes/MainScenes";

export default function Game({view}: {view: "map" | "harbor" | "broker" | "portProfile" | "cargoManagement"}) {

    console.log(view); // nur um view zu verwenden und damit React nicht meckert, dass es ungenutzt ist

    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameRef.current,

            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },

            width: "100%",
            height: "100%",

            scene: MainScene,
        };

        gameInstance.current = new Phaser.Game(config);

        return () => {
            gameInstance.current?.destroy(true);
            gameInstance.current = null;
        };
    }, []);

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
