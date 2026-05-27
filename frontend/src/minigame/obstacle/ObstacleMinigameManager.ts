import Phaser from "phaser";
import { ObstacleMinigameScene } from "./ObstacleMinigameScene";
import type { ObstacleMinigameConfig, ObstacleMinigameResult } from "./ObstacleMinigameTypes";

export class ObstacleMinigameManager {
    private game: Phaser.Game | null = null;

    mount(parent: HTMLDivElement, config: ObstacleMinigameConfig, onResult: (result: ObstacleMinigameResult) => void) {
        const scene = new ObstacleMinigameScene();
        const sceneConfig: ObstacleMinigameConfig = {
            ...config,
            onFinished: (result) => {
                onResult(result);
                this.destroy();
            },
        };

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            parent,
            width: parent.clientWidth || 960,
            height: parent.clientHeight || 620,
            backgroundColor: "#06364d",
            physics: {
                default: "arcade",
                arcade: { gravity: { x: 0, y: 0 }, debug: false },
            },
            scene,
        });
        this.game.scene.start(ObstacleMinigameScene.KEY, sceneConfig);
    }

    destroy() {
        this.game?.destroy(true);
        this.game = null;
    }
}
