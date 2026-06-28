import Phaser from "phaser";
import { StormMinigameScene } from "./StormMinigameScene";
import type { StormMinigameConfig, StormMinigameResult } from "./StormMinigameTypes";

export class StormMinigameManager {
    private game: Phaser.Game | null = null;

    mount(parent: HTMLDivElement, config: StormMinigameConfig, onResult: (result: StormMinigameResult) => void) {
        const scene = new StormMinigameScene();
        const sceneConfig: StormMinigameConfig = {
            ...config,
            onFinished: (result: StormMinigameResult) => {
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
            backgroundColor: "#1a2433",
            scene,
        });
        this.game.scene.start(StormMinigameScene.KEY, sceneConfig);
    }

    destroy() {
        this.game?.destroy(true);
        this.game = null;
    }
}