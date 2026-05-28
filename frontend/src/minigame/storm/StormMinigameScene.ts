import Phaser from "phaser";
import type { StormMinigameConfig, StormMinigameResult } from "./StormMinigameTypes";
import { StormPlayerShip } from "./StormPlayerShip";
import { StormHazardSpawner, type FallingHazard } from "./StormHazardSpawner";
import { StormCollectibleSpawner, type FallingCollectible } from "./StormCollectibleSpawner";
import stormBackground from "../../assets/minigame/storm/Storm.png";
import stormLightning from "../../assets/minigame/storm/blitz.png";
import stormSun from "../../assets/minigame/storm/sonne.png";

export class StormMinigameScene extends Phaser.Scene {
    static readonly KEY = "StormMinigameScene";

    private config!: StormMinigameConfig;
    private player!: StormPlayerShip;
    private hazardSpawner!: StormHazardSpawner;
    private collectibleSpawner!: StormCollectibleSpawner;
    private hazards: FallingHazard[] = [];
    private suns: FallingCollectible[] = [];
    private timeLeft = 0;
    private health = 100;
    private collectedSuns = 0;
    private finished = false;

    private timeText?: Phaser.GameObjects.Text;
    private healthText?: Phaser.GameObjects.Text;
    private sunsText?: Phaser.GameObjects.Text;

    constructor() {
        super({ key: StormMinigameScene.KEY });
    }

    init(data: StormMinigameConfig) {
        this.config = data;
        this.timeLeft = data.timeLimitSeconds;
        this.health = data.startHealth;
        this.collectedSuns = 0;
        this.finished = false;
        this.hazards = [];
        this.suns = [];
    }

    preload() {
        this.load.image("storm-bg", stormBackground);
        this.load.image("storm-lightning", stormLightning);
        this.load.image("storm-sun", stormSun);
        this.load.image("storm-player-ship", this.config.shipIconUrl || "/ship.png");
    }

    create() {
        this.cameras.main.setBackgroundColor("#1a2433");
        this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, "storm-bg")
            .setDisplaySize(this.scale.width, this.scale.height);
        this.add.text(16, 12, "Sturm auf See", { fontSize: "30px", color: "#f4e8c1" });

        this.timeText = this.add.text(16, 54, "", { fontSize: "22px", color: "#ffffff" });
        this.healthText = this.add.text(16, 84, "", { fontSize: "22px", color: "#ffffff" });
        this.sunsText = this.add.text(16, 114, "", { fontSize: "22px", color: "#ffffff" });
        this.updateHud();

        this.player = new StormPlayerShip(this, "storm-player-ship");
        this.hazardSpawner = new StormHazardSpawner(this);
        this.collectibleSpawner = new StormCollectibleSpawner(this);

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.finished) return;
                this.timeLeft = Math.max(0, this.timeLeft - 1);
                this.updateHud();
                if (this.timeLeft <= 0) this.finish("FAILED");
            },
        });

        this.time.addEvent({
            delay: 350,
            loop: true,
            callback: () => {
                if (this.finished) return;
                if (Math.random() < 0.65) this.hazards.push(this.hazardSpawner.spawnLightning());
            },
        });

        this.time.addEvent({
            delay: 700,
            loop: true,
            callback: () => {
                if (this.finished) return;
                if (Math.random() < 0.55) this.suns.push(this.collectibleSpawner.spawnSun());
            },
        });
    }

    update(_time: number, delta: number) {
        if (this.finished) return;
        this.player.update(delta);

        const shipRect = this.player.sprite.getBounds();

        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const hazard = this.hazards[i];
            hazard.view.y += hazard.speed * (delta / 1000);
            if (Phaser.Geom.Intersects.RectangleToRectangle(shipRect, hazard.view.getBounds())) {
                this.health = Math.max(0, this.health - 20);
                this.applyHitFeedback();
                hazard.view.destroy();
                this.hazards.splice(i, 1);
                this.updateHud();
                if (this.health <= 0) {
                    this.finish("FAILED");
                    return;
                }
                continue;
            }
            if (hazard.view.y > this.scale.height + 40) {
                hazard.view.destroy();
                this.hazards.splice(i, 1);
            }
        }

        for (let i = this.suns.length - 1; i >= 0; i--) {
            const sun = this.suns[i];
            sun.view.y += sun.speed * (delta / 1000);
            if (Phaser.Geom.Intersects.RectangleToRectangle(shipRect, sun.view.getBounds())) {
                this.collectedSuns += 1;
                this.applyCollectFeedback();
                sun.view.destroy();
                this.suns.splice(i, 1);
                this.updateHud();
                if (this.collectedSuns >= this.config.requiredSuns) {
                    this.finish("SUCCESS");
                    return;
                }
                continue;
            }
            if (sun.view.y > this.scale.height + 40) {
                sun.view.destroy();
                this.suns.splice(i, 1);
            }
        }
    }

    private updateHud() {
        this.timeText?.setText(`Zeit: ${this.timeLeft}s`);
        this.healthText?.setText(`Haltbarkeit: ${this.health}`);
        this.sunsText?.setText(`Sonnen: ${this.collectedSuns} / ${this.config.requiredSuns}`);
    }

    private applyHitFeedback() {
        this.player.sprite.setTint(0xff6b6b);
        this.cameras.main.shake(180, 0.008);
        this.time.delayedCall(180, () => {
            if (this.player?.sprite?.active) {
                this.player.sprite.clearTint();
            }
        });
    }

    private applyCollectFeedback() {
        this.player.sprite.setTint(0x55ef8a);
        this.time.delayedCall(140, () => {
            if (this.player?.sprite?.active) {
                this.player.sprite.clearTint();
            }
        });
    }

    private finish(outcome: "SUCCESS" | "FAILED") {
        if (this.finished) return;
        this.finished = true;
        for (const h of this.hazards) h.view.destroy();
        for (const s of this.suns) s.view.destroy();
        this.hazards = [];
        this.suns = [];

        const result: StormMinigameResult = {
            eventType: "STORM",
            result: outcome,
            collectedSuns: this.collectedSuns,
            requiredSuns: this.config.requiredSuns,
            remainingHealth: this.health,
            timeLeftSeconds: this.timeLeft,
            timeLimitSeconds: this.config.timeLimitSeconds,
            eventId: this.config.eventId,
            travelId: this.config.travelId,
        };
        this.config.onFinished?.(result);
    }
}
