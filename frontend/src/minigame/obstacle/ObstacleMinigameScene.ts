import Phaser from "phaser";
import { ShipArcadeController } from "../../game/ShipArcadeController";
import { ObstacleCollisionHandler } from "./ObstacleCollisionHandler";
import { ObstacleSpawner, type MovingObstacle } from "./ObstacleSpawner";
import type { ObstacleFailureReason, ObstacleMinigameConfig, ObstacleMinigameResult } from "./ObstacleMinigameTypes";
import waterBackgroundImg from "../../assets/minigame/obstaclegame/wasser.png";
import rettungsringImg from "../../assets/minigame/obstaclegame/rettungsring.png";
import wrackImg from "../../assets/minigame/obstaclegame/wrack.png";
import bretterImg from "../../assets/minigame/obstaclegame/bretter.png";
import fassImg from "../../assets/minigame/obstaclegame/Fass.png";
import audioEngine from "../../audio/AudioEngine.ts";

export class ObstacleMinigameScene extends Phaser.Scene {
    static readonly KEY = "ObstacleMinigameScene";

    private config!: ObstacleMinigameConfig;
    private ship!: Phaser.Physics.Arcade.Image;
    private controller?: ShipArcadeController;
    private spawner!: ObstacleSpawner;
    private collisionHandler = new ObstacleCollisionHandler();
    private obstacles: MovingObstacle[] = [];
    private timeLeft = 0;
    private health = 100;
    private finished = false;
    private goalTopY = 0;
    private goalBottomY = 0;

    private timeText?: Phaser.GameObjects.Text;
    private healthText?: Phaser.GameObjects.Text;

    constructor() {
        super({ key: ObstacleMinigameScene.KEY });
    }

    init(data: ObstacleMinigameConfig) {
        this.config = data;
        this.timeLeft = data.timeLimitSeconds;
        this.health = data.startHealth;
        this.finished = false;
        this.obstacles = [];
        this.controller = undefined;
        this.collisionHandler = new ObstacleCollisionHandler();
    }

    preload() {
        this.load.image("obstacle-water-bg", waterBackgroundImg);
        this.load.image("obstacle-player-ship", this.config.shipIconUrl || "/ship.png");
        this.load.image("obstacle-rettungsring", rettungsringImg);
        this.load.image("obstacle-wrack", wrackImg);
        this.load.image("obstacle-bretter", bretterImg);
        this.load.image("obstacle-fass", fassImg);
    }

    create() {
        audioEngine.crossfadeTo('obstacle', 300);
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
        this.drawRouteView();

        this.spawner = new ObstacleSpawner(this, this.config.routeViewType);
        this.spawner.ensureTexture();
        this.buildGoal();
        this.buildShip();
        this.buildHud();

        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.finished) return;
                this.timeLeft = Math.max(0, this.timeLeft - 1);
                this.updateHud();
                if (this.timeLeft <= 0) this.finish("FAILED", "TIME_OUT");
            },
        });

        this.time.addEvent({
            delay: 650,
            loop: true,
            callback: () => {
                if (!this.finished) this.obstacles.push(this.spawner.spawn());
            },
        });
    }

    update(_time: number, delta: number) {
        if (this.finished || !this.ship?.active) return;

        this.controller?.update(delta);
        this.keepShipInsideWorld();

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.view.y = obstacle.driftBaseY
                + Math.sin(_time * obstacle.wobbleSpeed + obstacle.wobblePhase) * obstacle.wobbleAmplitudePx;
            if (!obstacle.view.active || obstacle.view.x < -80) {
                obstacle.view.destroy();
                this.obstacles.splice(i, 1);
                continue;
            }

            if (Phaser.Geom.Intersects.RectangleToRectangle(this.ship.getBounds(), obstacle.view.getBounds())) {
                this.health = this.collisionHandler.handleCollision(this, this.ship, obstacle.view, this.health);
                this.obstacles.splice(i, 1);
                this.updateHud();
                if (this.health <= 0) {
                    audioEngine.playSfx('failed');
                    this.finish("FAILED", "SHIP_DESTROYED");
                    return;
                }
            }
        }

        if (this.ship.x >= this.scale.width - 58
            && this.ship.y >= this.goalTopY
            && this.ship.y <= this.goalBottomY) {
            audioEngine.playSfx('success');
            this.finish("SUCCESS");
        }
    }

    private drawRouteView() {
        const w = this.scale.width;
        const h = this.scale.height;
        const isViewA = this.config.routeViewType === "VIEW_A";
        const titleStyle = {
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
        this.cameras.main.setBackgroundColor(isViewA ? "#0b4f71" : "#06364d");
        this.add.image(w / 2, h / 2, "obstacle-water-bg")
            .setDisplaySize(w, h)
            .setDepth(0);

        const waveColor = isViewA ? 0x91d7e8 : 0xd8fbff;
        for (let y = 70; y < h; y += 70) {
            const line = this.add.graphics().setDepth(1);
            line.lineStyle(2, waveColor, isViewA ? 0.24 : 0.34);
            line.beginPath();
            line.moveTo(0, y);
            for (let x = 0; x <= w; x += 48) {
                line.lineTo(x, y + Math.sin(x / 45) * 8);
            }
            line.strokePath();
        }

        if (isViewA) {
            this.add.text(w / 2, 14, "Felsenpassage", { fontSize: "28px", ...titleStyle })
                .setOrigin(0.5, 0).setDepth(10);
        } else {
            this.add.text(w / 2, 14, "Eisfeld", { fontSize: "28px", ...titleStyle })
                .setOrigin(0.5, 0).setDepth(10);
        }
    }

    private buildGoal() {
        const w = this.scale.width;
        const h = this.scale.height;
        const color = this.config.routeViewType === "VIEW_A" ? 0xf4d35e : 0xb9f7ff;
        const goalHeight = h * 0.25;
        const minCenterY = goalHeight * 0.5;
        const maxCenterY = h - goalHeight * 0.5;
        const centerY = Phaser.Math.Between(Math.round(minCenterY), Math.round(maxCenterY));
        this.goalTopY = centerY - goalHeight * 0.5;
        this.goalBottomY = centerY + goalHeight * 0.5;

        this.add.rectangle(w - 28, centerY, 18, goalHeight, color, 0.24).setDepth(2);
        this.add.text(w - 18, centerY, "ZIEL", {
            fontSize: "14px",
            color: "#ffffff",
            backgroundColor: "#00000088",
            padding: { x: 5, y: 3 },
        }).setOrigin(0.5).setAngle(-90).setDepth(10);
    }

    private buildShip() {
        this.ship = this.physics.add.image(80, this.scale.height / 2, "obstacle-player-ship");
        this.ship.setDisplaySize(86, 54);
        this.ship.setDepth(5);
        this.ship.setCollideWorldBounds(true);
        (this.ship.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        (this.ship.body as Phaser.Physics.Arcade.Body).setSize(this.ship.width * 0.64, this.ship.height * 0.58, true);

        this.controller = new ShipArcadeController(this, this.ship, {
            maxSpeed: 145,
            acceleration: 175,
            deceleration: 190,
        });
    }

    private buildHud() {
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

        this.timeText = this.add.text(16, 18, "", { fontSize: "21px", ...hudStyle }).setDepth(10);
        this.healthText = this.add.text(16, 48, "", { fontSize: "21px", ...hudStyle }).setDepth(10);
        this.add.text(16, this.scale.height - 18, "WASD/Pfeile: Schiff steuern", {
            fontSize: "14px",
            color: "#ffffff",
            stroke: "#4a140f",
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: "#000000",
                blur: 2,
                fill: true,
                stroke: false,
            },
            backgroundColor: "#00000088",
            padding: { x: 8, y: 4 },
        }).setOrigin(0, 1).setDepth(10);
        this.updateHud();
    }

    private updateHud() {
        this.timeText?.setText(`Zeit: ${this.timeLeft}s`);
        this.healthText?.setText(`Haltbarkeit: ${this.health}`);
    }

    private keepShipInsideWorld() {
        const margin = 26;
        this.ship.x = Phaser.Math.Clamp(this.ship.x, margin, this.scale.width - margin);
        this.ship.y = Phaser.Math.Clamp(this.ship.y, margin, this.scale.height - margin);
    }

    private finish(outcome: "SUCCESS" | "FAILED", failureReason?: ObstacleFailureReason) {
        if (this.finished) return;
        this.finished = true;
        this.controller?.stop();
        for (const obstacle of this.obstacles) obstacle.view.destroy();
        this.obstacles = [];

        audioEngine.stopMusic();
        audioEngine.playMusic('game');

        const result: ObstacleMinigameResult = {
            eventType: "OBSTACLE",
            result: outcome,
            remainingHealth: this.health,
            timeLeftSeconds: this.timeLeft,
            timeLimitSeconds: this.config.timeLimitSeconds,
            routeViewType: this.config.routeViewType,
            failureReason,
            eventId: this.config.eventId,
            travelId: this.config.travelId,
        };

        const label = outcome === "SUCCESS" ? "Passage geschafft!" : "Hindernis-Event fehlgeschlagen";
        this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width * 0.7, 72, 0x000000, 0.78)
            .setDepth(20);
        this.add.text(this.scale.width / 2, this.scale.height / 2, label, {
            fontSize: "24px",
            color: outcome === "SUCCESS" ? "#7bed9f" : "#ff7675",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(21);

        this.time.delayedCall(outcome === "SUCCESS" ? 900 : 1300, () => this.config.onFinished?.(result));
    }
}
