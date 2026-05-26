import Phaser from 'phaser';
import audioEngine from '../audio/AudioEngine';

import {
    HARBOR_DOCK_CONFIG,
    DEFAULT_HARBOR_CONFIG,
    DEPARTURE_EXIT_ZONE,
    type HarborDockConfig,
} from '../config/harborDockingConfig';
import { HarborTerrainMask } from '../game/HarborTerrainMask';

export interface DockingSceneData {
    mode: 'departure' | 'arrival';
    shipIconUrl: string;
    portName?: string;
    onSuccess: () => void;
    onFailure: () => void;
}

export default class DockingScene extends Phaser.Scene {
    private sceneData!: DockingSceneData;
    private cfg!: HarborDockConfig;
    private wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
    private shipBody!: Phaser.Physics.Arcade.Image;
    private successZone!: Phaser.GameObjects.Zone;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    private terrainMask: HarborTerrainMask | null = null;
    private useTerrainMask = false;
    private shipRadiusNorm = 0;

    private vx = 0;
    private vy = 0;
    private gameEnded = false;
    private countdownValue = 90;
    private timerText!: Phaser.GameObjects.Text;

    private readonly MAX_SPEED = 120;
    private readonly ACCEL = 150;
    private readonly DECEL = 180;
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
        this.vx = 0;
        this.vy = 0;
        this.countdownValue = 90;
        this.terrainMask = null;
        this.useTerrainMask = false;
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
        this.buildControls();
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
            ? { x: this.cfg.arrivalZone.x, y: this.cfg.arrivalZone.y }
            : { ...this.cfg.arrivalSpawn };

        if (this.terrainMask) {
            const snapped = this.terrainMask.findNearestWater(raw.x, raw.y);
            if (snapped) return snapped;
        }
        return raw;
    }

    private buildSuccessZone(W: number, H: number) {
        const zone = this.sceneData.mode === 'departure'
            ? DEPARTURE_EXIT_ZONE
            : this.cfg.arrivalZone;

        let cx = zone.x * W;
        let cy = zone.y * H;

        if (this.terrainMask && this.sceneData.mode === 'arrival') {
            const snapped = this.terrainMask.findNearestWater(zone.x, zone.y);
            if (snapped) {
                cx = snapped.x * W;
                cy = snapped.y * H;
            }
        }

        const zw = zone.w * W;
        const zh = zone.h * H;

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

        this.successZone = this.add.zone(cx, cy, zw, zh);
        this.physics.world.enable(this.successZone);
        (this.successZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }

    private buildControls() {
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasd = {
            up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
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

            this.physics.add.collider(this.shipBody, this.wallsGroup, () => {
                this.triggerFailure('Kollision mit dem Land!');
            });
            this.physics.add.overlap(this.shipBody, this.successZone, () => {
                this.triggerSuccess();
            });

            if (this.useTerrainMask && this.terrainMask) {
                const xNorm = this.shipBody.x / W;
                const yNorm = this.shipBody.y / H;
                if (!this.terrainMask.isNavigable(xNorm, yNorm, this.shipRadiusNorm)) {
                    this.triggerFailure('Kollision mit dem Land!');
                }
            }
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

        this.timerText = this.add.text(W - 12, 12, '90', {
            fontSize: '22px',
            color: '#e74c3c',
            fontStyle: 'bold',
            backgroundColor: '#00000099',
            padding: { x: 6, y: 3 },
        }).setOrigin(1, 0).setDepth(10);
    }

    private startCountdown() {
        this.time.addEvent({
            delay: 1000,
            repeat: 89,
            callback: () => {
                if (this.gameEnded) return;
                this.countdownValue -= 1;
                if (this.timerText?.active) this.timerText.setText(String(this.countdownValue));
                if (this.countdownValue <= 0) this.triggerFailure('Zeit abgelaufen!');
            },
        });
    }

    update(_time: number, delta: number) {
        if (this.gameEnded || !this.shipBody?.active) return;

        const dt = delta / 1000;
        const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
        const down  = this.cursors.down.isDown  || this.wasd.down.isDown;
        const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;

        if (left)            this.vx = Math.max(this.vx - this.ACCEL * dt, -this.MAX_SPEED);
        else if (right)      this.vx = Math.min(this.vx + this.ACCEL * dt,  this.MAX_SPEED);
        else if (this.vx > 0) this.vx = Math.max(0, this.vx - this.DECEL * dt);
        else                  this.vx = Math.min(0, this.vx + this.DECEL * dt);

        if (up)              this.vy = Math.max(this.vy - this.ACCEL * dt, -this.MAX_SPEED);
        else if (down)       this.vy = Math.min(this.vy + this.ACCEL * dt,  this.MAX_SPEED);
        else if (this.vy > 0) this.vy = Math.max(0, this.vy - this.DECEL * dt);
        else                  this.vy = Math.min(0, this.vy + this.DECEL * dt);

        this.shipBody.setVelocity(this.vx, this.vy);

        if (this.useTerrainMask && this.terrainMask) {
            const W = this.scale.width;
            const H = this.scale.height;
            const xNorm = this.shipBody.x / W;
            const yNorm = this.shipBody.y / H;
            if (!this.terrainMask.isNavigable(xNorm, yNorm, this.shipRadiusNorm)) {
                this.triggerFailure('Kollision mit dem Land!');
            }
        } else {
            const H = this.scale.height;
            if (this.shipBody.y / H < this.cfg.landBoundaryY) {
                this.triggerFailure('Kollision mit dem Land!');
            }
        }
    }

    private triggerSuccess() {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.shipBody?.setVelocity(0, 0);
        audioEngine.stopMusic();
        audioEngine.playSfx('dockingSuccess');
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
        this.shipBody?.setVelocity(0, 0);
        audioEngine.stopMusic();
        audioEngine.playSfx('dockingCrash');
        this.cameras.main.shake(300, 0.012);
        this.showEndMessage(msg, 0xe74c3c);
        this.time.delayedCall(1800, () => {
            audioEngine.playMusic('game');
            this.sceneData.onFailure();
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
