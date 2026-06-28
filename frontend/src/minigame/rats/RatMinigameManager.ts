import Phaser from "phaser";
import { RatMinigameScene } from "./RatMinigameScene";
import type { RatMinigameConfig, RatMinigameResult } from "./RatMinigameTypes";

export class RatMinigameManager {
    private game: Phaser.Game | null = null;

    mount(parent: HTMLDivElement, config: RatMinigameConfig, onResult: (result: RatMinigameResult) => void) {
        const scene = new RatMinigameScene();
        const sceneConfig: RatMinigameConfig = {
            ...config,
            onFinished: (result: RatMinigameResult) => {
                onResult(result);
                this.destroy();
            },
        };

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            banner: false, // Phaser-Start-Banner in der Konsole ausblenden
            parent,
            width: parent.clientWidth || 900,
            height: parent.clientHeight || 600,
            backgroundColor: "#0d1a1f",
            scene: scene,
        });

        this.game.scene.start(RatMinigameScene.KEY, sceneConfig);
    }

    destroy() {
        this.game?.destroy(true);
        this.game = null;
    }
}