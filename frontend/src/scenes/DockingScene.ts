import Phaser from 'phaser';
import audioEngine from '../audio/AudioEngine';

import {
    HARBOR_DOCK_CONFIG,
    DEFAULT_HARBOR_CONFIG,
    DEPARTURE_EXIT_ZONE,
    type HarborDockConfig,
} from '../config/harborDockingConfig';
import { HarborTerrainMask } from '../game/HarborTerrainMask';
import { ShipArcadeController } from '../game/ShipArcadeController';

export interface DockingSceneData {
    mode: 'departure' | 'arrival';
    shipIconUrl: string;
    portName?: string;
    onSuccess: () => void;
    onFailure: (strikes: number) => void;
}

export default class DockingScene extends Phaser.Scene {
    private sceneData!: DockingSceneData;
    private cfg!: HarborDockConfig;
    private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
    private shipBody!: Phaser.Physics.Arcade.Image;
    private shipController?: ShipArcadeController;

    private terrainMask: HarborTerrainMask | null = null;
    private useTerrainMask = false;
    private shipRadiusNorm = 0;

    private gameEnded = false;
    private countdownValue = 60;
    private timerText!: Phaser.GameObjects.Text;

    private dwellTime = 0;
    private readonly DWELL_REQUIRED = 3000;
    private dwellOverlay!: Phaser.GameObjects.Graphics;
    private zoneRect = { cx: 0, cy: 0, w: 0, h: 0 };

    private strikes = 0;
    private readonly MAX_STRIKES = 3;
    private readonly STRIKE_COOLDOWN = 1000;
    private lastStrikeTime = 0;
    private lifeTexts: Phaser.GameObjects.Text[] = [];

    // Last position where isNavigable returned true — used to push ship back on land collision
    private lastValidPos = { x: 0, y: 0 };

    private readonly MAX_SPEED = 120;
    private readonly ACCEL = 150;
    private readonly DECEL = 25;
    private readonly SHIP_COLLISION_RADIUS = 14;

    constructor() {
        super({ key: 'DockingScene' });
    }

    init(data: DockingSceneData) {
        this.sceneData = data;
        this.cfg = (data.portName && HARBOR_DOCK_CONFIG[data.portName])
            ? HARBOR_DOCK_CONFIG[data.portName]
            : DEFAULT_HARBOR_CONFIG;
        this.gameEnded = false;
        this.shipController = undefined;
        this.countdownValue = 60;
        this.terrainMask = null;
        this.useTerrainMask = false;
        this.dwellTime = 0;
        this.strikes = 0;
        this.lastStrikeTime = 0;
        this.lifeTexts = [];
        this.lastValidPos = { x: 0, y: 0 };
    }

    create() {
        audioEngine.crossfadeTo('docking', 300);
        const W = this.scale.width;
        const H = this.scale.height;

        if (this.cfg.backgroundImage) {
            const bgKey = `harbor-bg-${this.sceneData.portName ?? 'default'}`;
            if (this.textures.exists(bgKey)) {
                this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H).setDepth(0);
                this.initTerrainMask(bgKey);
                this.finishCreate(W, H);
            } else {
                this.load.image(bgKey, this.cfg.backgroundImage);
                this.load.once('complete', () => {
                    this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H).setDepth(0);
                    this.initTerrainMask(bgKey);
                    this.finishCreate(W, H);
                });
                this.load.start();
            }
        } else {
            this.add.rectangle(W / 2, H / 2, W, H, 0x1a5276).setDepth(0);
            this.finishCreate(W, H);
        }
    }

    private initTerrainMask(textureKey: string) {
        const texture = this.textures.get(textureKey);
        const source = texture.getSourceImage() as HTMLImageElement;
        this.terrainMask = HarborTerrainMask.fromImageSource(source);
        this.useTerrainMask = this.terrainMask?.isReady ?? false;

        if (this.useTerrainMask && new URLSearchParams(window.location.search).has('dockingDebug')) {
            this.buildDebugOverlay(textureKey);
        }
    }

    private buildDebugOverlay(textureKey: string) {
        if (!this.terrainMask) return;
        const debugCanvas = this.terrainMask.buildDebugCanvas(6);
        const debugKey = `${textureKey}-debug`;
        if (!this.textures.exists(debugKey)) {
            this.textures.addCanvas(debugKey, debugCanvas);
        }
        const W = this.scale.width;
        const H = this.scale.height;
        this.add.image(W / 2, H / 2, debugKey).setDisplaySize(W, H).setDepth(1).setAlpha(0.45);
    }

    private finishCreate(W: number, H: number) {
        this.shipRadiusNorm = this.SHIP_COLLISION_RADIUS / H;
        this.buildWalls(W, H);
        this.buildSuccessZone(W, H);
        this.buildShipSprite(W, H);
        this.buildHUD(W, H);
        this.startCountdown();
    }

    private buildWalls(W: number, H: number) {
        this.wallsGroup = this.physics.add.staticGroup();

        const addInvisibleWall = (x: number, y: number, w: number, h: number) => {
            const body = this.wallsGroup.create(x + w / 2, y + h / 2, undefined) as Phaser.Physics.Arcade.Image;
            body.setVisible(false);
            body.setImmovable(true);
            (body.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
            body.refreshBody();
        };

        if (!this.useTerrainMask) {
            const landH = this.cfg.landBoundaryY * H;
            addInvisibleWall(0, 0, W, landH);
        }

        addInvisibleWall(0, 0, 8, H);
        addInvisibleWall(W - 8, 0, 8, H);
        addInvisibleWall(0, H - 8, W, 8);
    }

    private resolveSpawnNorm(): { x: number; y: number } {
        const raw = this.sceneData.mode === 'departure'
            ? (this.cfg.departureSpawn ?? { x: this.cfg.arrivalZone.x, y: this.cfg.arrivalZone.y })
            : { ...this.cfg.arrivalSpawn };

        if (this.terrainMask) {
            const snapped = this.terrainMask.findNearestNavigable(raw.x, raw.y, this.shipRadiusNorm);
            if (snapped) return snapped;
        }
        return { ...this.cfg.arrivalSpawn };
    }

    private buildSuccessZone(W: number, H: number) {
        const zone = this.sceneData.mode === 'departure'
            ? DEPARTURE_EXIT_ZONE
            : this.cfg.arrivalZone;

        let cx = zone.x * W;
        let cy = zone.y * H;

        if (this.terrainMask && this.sceneData.mode === 'arrival') {
            // findNearestNavigable statt findNearestWater: Zone snappt auf Position
            // mit genug Abstand für den vollen Schiffsradius — kein Pier-Randkontakt beim Dwell
            const snapped = this.terrainMask.findNearestNavigable(zone.x, zone.y, this.shipRadiusNorm);
            if (snapped) {
                cx = snapped.x * W;
                cy = snapped.y * H;
            }
        }

        const zw = zone.w * W;
        const zh = zone.h * H;

        this.zoneRect = { cx, cy, w: zw, h: zh };

        const gfx = this.add.graphics().setDepth(3);
        gfx.fillStyle(0x27ae60, 0.35);
        gfx.fillRect(cx - zw / 2, cy - zh / 2, zw, zh);
        gfx.lineStyle(2, 0x2ecc71, 0.9);
        gfx.strokeRect(cx - zw / 2, cy - zh / 2, zw, zh);

        this.tweens.add({ targets: gfx, alpha: { from: 0.55, to: 1.0 }, duration: 700, yoyo: true, repeat: -1 });

        const label = this.sceneData.mode === 'departure' ? 'AUSFAHRT' : 'ANLEGEN';
        this.add.text(cx, cy, label, {
            fontSize: '12px',
            color: '#2ecc71',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(4);

        this.dwellOverlay = this.add.graphics().setDepth(6);
    }

    private buildShipSprite(W: number, H: number) {
        const spawn = this.resolveSpawnNorm();
        const startX = spawn.x * W;
        const startY = spawn.y * H;
        const shipKey = 'docking-ship';

        const spawnShip = () => {
            this.shipBody = this.physics.add.image(startX, startY, shipKey);
            this.shipBody.setDisplaySize(32, 48);
            const r = this.SHIP_COLLISION_RADIUS;
            this.shipBody.setCircle(
                r,
                this.shipBody.width / 2 - r,
                this.shipBody.height / 2 - r,
            );
            this.shipBody.setDepth(5);
            (this.shipBody.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(false);
            this.shipController = new ShipArcadeController(this, this.shipBody, {
                maxSpeed: this.MAX_SPEED,
                acceleration: this.ACCEL,
                deceleration: this.DECEL,
            });
            // Initialize last valid position at spawn (guaranteed to be in water)
            this.lastValidPos = { x: startX, y: startY };

            this.physics.add.collider(this.shipBody, this.wallsGroup, () => {
                this.registerStrike();
            });
        };

        if (this.textures.exists(shipKey)) {
            spawnShip();
        } else {
            this.load.image(shipKey, this.sceneData.shipIconUrl);
            this.load.once('complete', spawnShip);
            this.load.start();
        }
    }

    private buildHUD(W: number, H: number) {
        const modeLabel = this.sceneData.mode === 'departure'
            ? `ABLEGEN — ${this.sceneData.portName ?? 'Hafen'} — Steuere dein Schiff ins offene Meer!`
            : `ANLEGEN — ${this.sceneData.portName ?? 'Hafen'} — Steuere dein Schiff zum Steg!`;

        this.add.text(W / 2, 14, modeLabel, {
            fontSize: '13px',
            color: '#ecf0f1',
            backgroundColor: '#00000099',
            padding: { x: 10, y: 5 },
        }).setOrigin(0.5, 0).setDepth(10);

        this.add.text(W / 2, H - 8, 'W/S — Fahrt vor/zurück   |   A/D oder ◄ ► — Drehen', {
            fontSize: '11px',
            color: '#bdc3c7',
            backgroundColor: '#00000088',
            padding: { x: 6, y: 3 },
        }).setOrigin(0.5, 1).setDepth(10);

        this.timerText = this.add.text(W - 12, 12, '60', {
            fontSize: '22px',
            color: '#e74c3c',
            fontStyle: 'bold',
            backgroundColor: '#00000099',
            padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setDepth(10);

        this.lifeTexts = [];
        for (let i = 0; i < this.MAX_STRIKES; i++) {
            const t = this.add.text(12 + i * 22, 12, '♥', {
                fontSize: '16px',
                color: '#27ae60',
                backgroundColor: '#00000099',
                padding: { x: 3, y: 2 },
            }).setDepth(10);
            this.lifeTexts.push(t);
        }
    }

    private startCountdown() {
        this.time.addEvent({
            delay: 1000,
            repeat: 59,
            callback: () => {
                if (this.gameEnded) return;
                this.countdownValue -= 1;
                if (this.timerText?.active) this.timerText.setText(String(this.countdownValue));
                if (this.countdownValue <= 0) {
                    this.strikes = Math.max(this.strikes, 2);
                    this.triggerFailure('Zeit abgelaufen!');
                }
            },
        });
    }

    private registerStrike() {
        if (this.gameEnded) return;
        const now = this.time.now;
        if (now - this.lastStrikeTime < this.STRIKE_COOLDOWN) return;
        this.lastStrikeTime = now;
        this.strikes++;
        const lifeText = this.lifeTexts[this.strikes - 1];
        if (lifeText) lifeText.setColor('#e74c3c');
        this.cameras.main.shake(200, 0.008);
        this.cameras.main.flash(120, 255, 0, 0, false);
        audioEngine.playSfx('dockingCrash');
        if (this.strikes >= this.MAX_STRIKES) {
            this.triggerFailure('Zu viele Kollisionen!');
        }
    }

    update(_time: number, delta: number) {
        if (this.gameEnded || !this.shipBody?.active) return;

        this.shipController?.update(delta);

        if (this.useTerrainMask && this.terrainMask) {
            const W = this.scale.width;
            const H = this.scale.height;
            const xNorm = this.shipBody.x / W;
            const yNorm = this.shipBody.y / H;
            if (!this.terrainMask.isNavigable(xNorm, yNorm, this.shipRadiusNorm)) {
                // Nur Strike zählen wenn nicht gerade aktiv am Andocken (Dwell läuft)
                if (this.dwellTime === 0) {
                    this.registerStrike();
                }
                // Sofort zurückbeamen — verhindert "auf dem Steg fahren"
                this.shipBody.setPosition(this.lastValidPos.x, this.lastValidPos.y);
                this.shipController?.stop();
            } else {
                this.lastValidPos = { x: this.shipBody.x, y: this.shipBody.y };
            }
        } else {
            const H = this.scale.height;
            if (this.shipBody.y / H < this.cfg.landBoundaryY) {
                this.registerStrike();
            }
        }

        if (this.gameEnded) return;

        const { cx, cy, w, h } = this.zoneRect;
        const inZone =
            this.shipBody.x > cx - w / 2 &&
            this.shipBody.x < cx + w / 2 &&
            this.shipBody.y > cy - h / 2 &&
            this.shipBody.y < cy + h / 2;

        if (inZone) {
            if (this.sceneData.mode === 'departure') {
                this.triggerSuccess();
            } else {
                this.dwellTime += delta;
                const progress = Math.min(this.dwellTime / this.DWELL_REQUIRED, 1);
                this.dwellOverlay.clear();
                const barY = cy + h / 2 + 4;
                this.dwellOverlay.fillStyle(0x000000, 0.5);
                this.dwellOverlay.fillRect(cx - w / 2, barY, w, 5);
                this.dwellOverlay.fillStyle(0x2ecc71, 1.0);
                this.dwellOverlay.fillRect(cx - w / 2, barY, w * progress, 5);
                if (this.dwellTime >= this.DWELL_REQUIRED) {
                    this.triggerSuccess();
                }
            }
        } else if (this.dwellTime > 0) {
            this.dwellTime = 0;
            this.dwellOverlay.clear();
        }
    }

    private triggerSuccess() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.shipController?.stop();
        audioEngine.stopMusic();
        audioEngine.playSfx('success');
        this.showEndMessage(
            this.sceneData.mode === 'departure' ? 'Leinen los! ⛵' : 'Perfekt angelegt! ⚓',
            0x27ae60,
        );
        this.time.delayedCall(1200, () => {
            audioEngine.playMusic('game');
            this.sceneData.onSuccess()
        });
    }

    private triggerFailure(msg: string) {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.shipController?.stop();
        audioEngine.stopMusic();
        this.cameras.main.shake(300, 0.012);
        this.showEndMessage(msg, 0xe74c3c);
        this.time.delayedCall(1800, () => {
            audioEngine.playMusic('game');
            this.sceneData.onFailure(this.strikes);
        });
    }

    private showEndMessage(text: string, color: number) {
        const W = this.scale.width;
        const H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W * 0.72, 68, 0x000000, 0.82).setDepth(20);
        this.add.text(W / 2, H / 2, text, {
            fontSize: '24px',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(21);
    }
}
