import Phaser from "phaser";
import { TreasureHuntMinigameScene } from "./TreasureHuntMinigameScene";
import type { TreasureHuntMinigameConfig, TreasureHuntMinigameResult } from "./TreasureHuntMinigameTypes";

export class TreasureHuntMinigameManager {
    private game: Phaser.Game | null = null;
    private completed = false;

    mount(parent: HTMLDivElement, config: TreasureHuntMinigameConfig, onResult: (result: TreasureHuntMinigameResult) => void) {
        this.completed = false;
        const scene = new TreasureHuntMinigameScene();
        const sceneConfig: TreasureHuntMinigameConfig = {
            ...config,
            onFinished: (result) => this.complete(result, onResult),
        };

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            parent,
            width: parent.clientWidth || 960,
            height: parent.clientHeight || 620,
            backgroundColor: "#0b111c",
            scene,
        });

        this.game.scene.start(TreasureHuntMinigameScene.KEY, sceneConfig);
    }

    destroy() {
        this.game?.destroy(true);
        this.game = null;
    }

    private complete(result: TreasureHuntMinigameResult, onResult: (result: TreasureHuntMinigameResult) => void) {
        if (this.completed) return;
        this.completed = true;

        try {
            onResult(result);
        } finally {
            this.destroy();
        }
    }
}
