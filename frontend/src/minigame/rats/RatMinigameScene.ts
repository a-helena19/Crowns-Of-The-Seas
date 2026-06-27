import Phaser from "phaser";
import { RatSpawner } from "./RatSpawner";
import type { RatMinigameConfig, RatMinigameResult } from "./RatMinigameTypes";
import shipDeskImage from "../../assets/ship-desk.png";
import swordImage from "../../assets/sword.png";
import ratImage from "../../assets/Rat.png";
import audioEngine from '../../audio/AudioEngine';

export class RatMinigameScene extends Phaser.Scene {
    static readonly KEY = "RatMinigameScene";

    private config!: RatMinigameConfig;
    private hits = 0;
    private remainingSeconds = 0;
    private finished = false;
    private rat?: Phaser.GameObjects.Image;
    private timeText?: Phaser.GameObjects.Text;
    private hitsText?: Phaser.GameObjects.Text;
    private requiredText?: Phaser.GameObjects.Text;
    private spawner!: RatSpawner;
    private swordCursor?: Phaser.GameObjects.Image;

    constructor() {
        super({ key: RatMinigameScene.KEY });
    }

    init(data: RatMinigameConfig) {
        this.config = data;
        this.hits = 0;
        this.remainingSeconds = data.timeLimitSeconds;
        this.finished = false;
    }

    preload() {
        this.load.image("rat-minigame-bg", shipDeskImage);
        this.load.image("rat-minigame-sword-cursor", swordImage);
        this.load.image("rat-minigame-rat", ratImage);
    }

    create() {
        audioEngine.crossfadeTo('rats', 300);
        const hudStyle = {
            color: "#ffffff",
            stroke: "#4a140f",
            strokeThickness: 5,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: "#000000",
                blur: 2,
                fill: true,
                stroke: false,
            },
        };

        this.add.image(0, 0, "rat-minigame-bg")
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.input.setDefaultCursor("none");
        this.swordCursor = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, "rat-minigame-sword-cursor")
            .setDisplaySize(64, 64)
            .setDepth(1000)
            .setScrollFactor(0);
        this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
            this.swordCursor?.setPosition(pointer.x + 10, pointer.y + 10);
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.input.setDefaultCursor("default");
            this.swordCursor?.destroy();
        });

        this.add.text(16, 14, "Ratten an Deck", { fontSize: "30px", ...hudStyle });

        this.timeText = this.add.text(16, 56, "Zeit: --", { fontSize: "22px", ...hudStyle });
        this.hitsText = this.add.text(16, 86, "Treffer: 0", { fontSize: "22px", ...hudStyle });
        this.requiredText = this.add.text(16, 116, `Ziel: ${this.config.requiredHits}`, { fontSize: "22px", ...hudStyle });

        this.spawner = new RatSpawner(this);
        audioEngine.playSfx('ratSqueak');
        this.spawnNextRat();
        this.updateHud();

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.finished) return;
                this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
                this.updateHud();
                if (this.remainingSeconds == 3) {
                    audioEngine.playSfx('ratTickingClock');
                }
                if (this.remainingSeconds <= 0) {
                    audioEngine.playSfx('failed');
                    this.finish("FAILED");
                }
            },
        });
    }

    private updateHud() {
        this.timeText?.setText(`Zeit: ${this.remainingSeconds}s`);
        this.hitsText?.setText(`Treffer: ${this.hits}`);
        this.requiredText?.setText(`Ziel: ${this.config.requiredHits}`);
    }

    private spawnNextRat() {
        this.rat?.destroy();
        this.rat = this.spawner.spawnRat(() => {
            if (this.finished) return;
            this.hits += 1;
            audioEngine.playSfx('ratKill');
            this.updateHud();

            if (this.hits >= this.config.requiredHits) {
                audioEngine.playSfx('success');
                this.finish("SUCCESS");
                return;
            }

            audioEngine.playSfx('ratSqueak');

            this.spawnNextRat();
        });
    }

    private finish(outcome: "SUCCESS" | "FAILED") {
        if (this.finished) return;
        this.finished = true;
        this.rat?.destroy();

        audioEngine.stopMusic();
        audioEngine.playMusic('game');

        const result: RatMinigameResult = {
            eventType: "RATS",
            result: outcome,
            hits: this.hits,
            requiredHits: this.config.requiredHits,
            remainingSeconds: this.remainingSeconds,
            timeLimitSeconds: this.config.timeLimitSeconds,
            eventId: this.config.eventId,
            travelId: this.config.travelId,
        };

        this.config.onFinished?.(result);
    }
}
