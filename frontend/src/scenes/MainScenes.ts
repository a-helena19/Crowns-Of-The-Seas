import Phaser from 'phaser';
import Ship from '../game/Ship';

interface PortData {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface ShipPositionData {
    playerShipId: string;
    playerName: string;
    iconUrl: string;
    x: number;
    y: number;
    status: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING';
    arrivalTick: number | null;
    originX: number | null;
    originY: number | null;
    destX: number | null;
    destY: number | null;
    startTick: number | null;
    currentPortId: string | null;
}

interface ShipPositionsPayload {
    currentTick: number;
    ships: ShipPositionData[];
}

interface ShipEntry {
    sprite: Phaser.GameObjects.Sprite;
    controller: Ship;
    tooltip: Phaser.GameObjects.Text;
    lastStatus: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING' | null;
    lastStartTick: number | null;
    lastShipData: ShipPositionData;
}

export default class MainScene extends Phaser.Scene {
    private ship!: Phaser.GameObjects.Sprite;
    private shipController!: Ship;

    private shipSprites: Map<string, ShipEntry> = new Map();

    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private harborSprites: Phaser.GameObjects.Image[] = [];

    private onShipPosition!: (e: Event) => void;
    private onPorts!: (e: Event) => void;
    private onShipPositions!: (e: Event) => void;
    private lastSceneWidth: number = 0;
    private lastSceneHeight: number = 0;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('map', '/World_Map3.PNG');
        this.load.image('ship', '/ship.png');
        this.load.image('harbor', '/harborpingred.png');
    }

    create() {
        this.add.image(0, 0, 'map').setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
        this.lastSceneWidth = this.scale.width;
        this.lastSceneHeight = this.scale.height;

        const latestShip = window.__latestShip;
        const shipStartX = latestShip ? (latestShip.x / 100) * this.scale.width : this.scale.width * 0.5;
        const shipStartY = latestShip ? (latestShip.y / 100) * this.scale.height : this.scale.height * 0.5;
        this.ship = this.add.sprite(shipStartX, shipStartY, 'ship')
            .setScale(0.065).setDepth(5).setVisible(false);
        this.shipController = new Ship(this, this.ship);

        this.onShipPosition = (e: Event) => {
            const { x, y, status, tickRateMs } = (e as CustomEvent).detail;
            const px = (x / 100) * this.scale.width;
            const py = (y / 100) * this.scale.height;
            if (status === 'AT_PORT') {
                this.shipController.teleport(px, py);
            } else {
                this.shipController.moveTo(px, py, tickRateMs || 1000);
            }
        };

        this.onPorts = (e: Event) => {
            if (this.harborSprites.length > 0) return;
            const ports = (e as CustomEvent<PortData[]>).detail;
            this.renderHarbors(ports);
        };

        this.onShipPositions = (e: Event) => {
            const payload = (e as CustomEvent<ShipPositionsPayload>).detail;
            this.updateShipSprites(payload.ships, payload.currentTick);
        };

        window.addEventListener('backend-ship-position', this.onShipPosition);
        window.addEventListener('backend-ports', this.onPorts);
        window.addEventListener('backend-ship-positions', this.onShipPositions);
        this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

        const latestPorts = window.__latestPorts;
        if (latestPorts && this.harborSprites.length === 0) {
            this.renderHarbors(latestPorts);
        }

        if (window.__latestShips) {
            this.updateShipSprites(
                window.__latestShips,
                window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0,
            );
        }

        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);

        this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _go: unknown, _dx: number, deltaY: number) => {
            const cam = this.cameras.main;
            cam.setZoom(Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 1, 4));
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        });

        this.input.on('pointerup', () => { this.isDragging = false; });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;
            const cam = this.cameras.main;
            cam.scrollX -= (pointer.x - this.dragStartX) / cam.zoom;
            cam.scrollY -= (pointer.y - this.dragStartY) / cam.zoom;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        });
    }

    private updateShipSprites(ships: ShipPositionData[], currentTick: number) {
        const activeIds = new Set(ships.map(s => s.playerShipId));

        for (const [id, entry] of this.shipSprites.entries()) {
            if (!activeIds.has(id)) {
                entry.sprite.destroy();
                entry.tooltip.destroy();
                this.shipSprites.delete(id);
            }
        }

        const tickRateMs = this.resolveTickRateMs();

        for (const shipData of ships) {
            const px = (shipData.x / 100) * this.scale.width;
            const py = (shipData.y / 100) * this.scale.height;
            const textureKey = this.resolveTextureKey(shipData.iconUrl);
            const hasRouteData = this.hasRouteData(shipData);

            if (this.shipSprites.has(shipData.playerShipId)) {
                const entry = this.shipSprites.get(shipData.playerShipId)!;
                if (this.isSameSnapshot(entry.lastShipData, shipData)) {
                    continue;
                }

                if (shipData.status === 'EN_ROUTE') {
                    const isSameTravel = entry.lastStatus === 'EN_ROUTE'
                        && shipData.startTick != null
                        && entry.lastStartTick === shipData.startTick;

                    if (hasRouteData && !isSameTravel) {
                        const routeTiming = this.getRouteTiming(shipData, currentTick, tickRateMs);
                        const originPx = (shipData.originX / 100) * this.scale.width;
                        const originPy = (shipData.originY / 100) * this.scale.height;
                        const destPx = (shipData.destX / 100) * this.scale.width;
                        const destPy = (shipData.destY / 100) * this.scale.height;
                        entry.controller.setRoute(
                            originPx,
                            originPy,
                            destPx,
                            destPy,
                            routeTiming.elapsedMs,
                            routeTiming.totalMs,
                            true,
                            routeTiming.startDelayMs,
                        );
                        entry.lastStartTick = shipData.startTick;
                    } else if (!hasRouteData) {
                        entry.controller.moveTo(px, py, tickRateMs);
                        entry.lastStartTick = null;
                    }
                    entry.lastStatus = 'EN_ROUTE';
                } else {
                    if (entry.lastStatus === 'EN_ROUTE') {
                        const distance = Math.hypot(px - entry.sprite.x, py - entry.sprite.y);
                        const currentSpeed = entry.controller.getSpeedPxPerMs();
                        if (currentSpeed > 1e-6 && distance > 0.5) {
                            entry.controller.moveTo(px, py, distance / currentSpeed);
                        } else {
                            entry.controller.teleport(px, py);
                        }
                    } else {
                        entry.controller.teleport(px, py);
                    }
                    entry.lastStatus = 'AT_PORT';
                    entry.lastStartTick = null;
                }
                entry.lastShipData = shipData;
            } else {
                this.createShipSprite(
                    shipData.playerShipId, shipData.playerName, textureKey,
                    shipData.status, shipData, tickRateMs, currentTick,
                );
            }
        }

        if (ships.length > 0) {
            this.ship.setVisible(false);
        }
    }

    private createShipSprite(
        id: string, playerName: string, textureKey: string,
        status: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING',
        shipData: ShipPositionData,
        tickRateMs: number,
        currentTick: number,
    ) {
        if (this.shipSprites.has(id)) return;

        const spawnX = (shipData.x / 100) * this.scale.width;
        const spawnY = (shipData.y / 100) * this.scale.height;

        // Sprite sofort mit gecachter oder Fallback-Textur erstellen — kein Delay
        const initialTexture = this.textures.exists(textureKey) ? textureKey : 'ship';
        const sprite = this.add.sprite(spawnX, spawnY, initialTexture)
            .setScale(0.065).setInteractive().setDepth(5);

        const shipTooltip = this.add.text(spawnX + 12, spawnY - 20, playerName, {
            fontSize: '12px',
            color: '#ffffff',
            backgroundColor: '#000000cc',
            padding: { x: 4, y: 2 },
        }).setDepth(11).setVisible(false);

        sprite.on('pointerover', () => {
            shipTooltip.setPosition(sprite.x + 12, sprite.y - 20).setVisible(true);
        });
        sprite.on('pointermove', () => {
            shipTooltip.setPosition(sprite.x + 12, sprite.y - 20);
        });
        sprite.on('pointerout', () => shipTooltip.setVisible(false));

        const controller = new Ship(this, sprite);
        let lastStartTick: number | null = null;

        if (status === 'EN_ROUTE' && this.hasRouteData(shipData)) {
            const routeTiming = this.getRouteTiming(shipData, currentTick, tickRateMs);
            const originPx = (shipData.originX / 100) * this.scale.width;
            const originPy = (shipData.originY / 100) * this.scale.height;
            const destPx = (shipData.destX / 100) * this.scale.width;
            const destPy = (shipData.destY / 100) * this.scale.height;
            controller.setRoute(
                originPx,
                originPy,
                destPx,
                destPy,
                routeTiming.elapsedMs,
                routeTiming.totalMs,
                true,
                routeTiming.startDelayMs,
            );
            lastStartTick = shipData.startTick;
        }

        this.shipSprites.set(id, {
            sprite, controller, tooltip: shipTooltip,
            lastStatus: status, lastStartTick, lastShipData: shipData,
        });

        // Echte Textur im Hintergrund nachladen und auf den bereits sichtbaren Sprite anwenden
        if (initialTexture === 'ship' && textureKey !== 'ship') {
            this.load.image(textureKey, textureKey);
            this.load.once('complete', () => {
                if (sprite.active) sprite.setTexture(textureKey);
            });
            this.load.start();
        }
    }

    private handleResize() {
        const prevWidth = this.lastSceneWidth || this.scale.width;
        const prevHeight = this.lastSceneHeight || this.scale.height;
        const scaleX = this.scale.width / prevWidth;
        const scaleY = this.scale.height / prevHeight;

        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
            this.lastSceneWidth = this.scale.width;
            this.lastSceneHeight = this.scale.height;
            return;
        }

        const currentTick = window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0;
        for (const entry of this.shipSprites.values()) {
            const shipData = entry.lastShipData;
            if (entry.lastStatus === 'EN_ROUTE' && currentTick >= 0) {
                entry.controller.rescale(scaleX, scaleY);
            } else {
                entry.controller.teleport(
                    (shipData.x / 100) * this.scale.width,
                    (shipData.y / 100) * this.scale.height,
                );
            }
            entry.tooltip.setPosition(entry.sprite.x + 12, entry.sprite.y - 20);
        }
        this.shipController.rescale(scaleX, scaleY);
        this.lastSceneWidth = this.scale.width;
        this.lastSceneHeight = this.scale.height;
    }

    /**
     * Smoothed WS measurement when sane; otherwise session tick interval.
     * Avoids 30_000 default which inflates elapsedMs along EN_ROUTE and jumps the ship ahead.
     */
    private resolveTickRateMs(): number {
        const smoothed = window.__tickRateMs;
        if (typeof smoothed === 'number' && Number.isFinite(smoothed) && smoothed >= 250 && smoothed <= 120_000) {
            return smoothed;
        }
        try {
            const raw = sessionStorage.getItem('currentSession');
            if (raw) {
                const sec = JSON.parse(raw).tickRateSeconds as unknown;
                if (typeof sec === 'number' && sec >= 1 && sec <= 120) {
                    return sec * 1000;
                }
            }
        } catch {
            /* ignore */
        }
        return 5000;
    }

    private resolveTextureKey(iconUrl: string): string {
        if (!iconUrl || iconUrl.trim() === '') return 'ship';
        return iconUrl;
    }

    private hasRouteData(shipData: ShipPositionData): shipData is ShipPositionData & {
        originX: number;
        originY: number;
        destX: number;
        destY: number;
        startTick: number;
        arrivalTick: number;
    } {
        return shipData.originX != null
            && shipData.originY != null
            && shipData.destX != null
            && shipData.destY != null
            && shipData.startTick != null
            && shipData.arrivalTick != null;
    }

    private getRouteTiming(
        shipData: ShipPositionData & { startTick: number; arrivalTick: number },
        currentTick: number,
        tickRateMs: number,
    ) {
        const totalTicks = Math.max(1, shipData.arrivalTick - shipData.startTick);
        const elapsedTicks = Math.min(
            Math.max(0, currentTick - shipData.startTick),
            totalTicks,
        );
        const delayTicks = Math.max(0, shipData.startTick - currentTick);

        return {
            elapsedMs: elapsedTicks * tickRateMs,
            totalMs: totalTicks * tickRateMs,
            startDelayMs: delayTicks * tickRateMs,
        };
    }

    private isSameSnapshot(a: ShipPositionData, b: ShipPositionData) {
        return a.status === b.status
            && a.arrivalTick === b.arrivalTick
            && a.startTick === b.startTick
            && a.originX === b.originX
            && a.originY === b.originY
            && a.destX === b.destX
            && a.destY === b.destY
            && Math.abs(a.x - b.x) < 1e-9
            && Math.abs(a.y - b.y) < 1e-9;
    }

    private renderHarbors(ports: PortData[]) {
        const LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
            'Rotterdam': { dx: -80, dy: 10 },
        };

        ports.forEach(port => {
            const px = (port.x / 100) * this.scale.width;
            const py = (port.y / 100) * this.scale.height;
            const img = this.add.image(px, py, 'harbor')
                .setScale(0.01)
                .setInteractive(new Phaser.Geom.Circle(0, 0, 2000), Phaser.Geom.Circle.Contains)
                .setDepth(6);

            img.on('pointerdown', () => {
                window.dispatchEvent(new CustomEvent('port-clicked', { detail: port }));
            });

            const offset = LABEL_OFFSETS[port.name] ?? { dx: 10, dy: -10 };
            this.add.text(px + offset.dx, py + offset.dy, port.name, {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000cc',
                padding: { x: 4, y: 2 }
            }).setDepth(10);

            this.harborSprites.push(img);
        });
    }

    update(_time: number, delta: number) {
        this.shipController.update(delta);
        for (const entry of this.shipSprites.values()) {
            entry.controller.update(delta);
            entry.tooltip.setPosition(entry.sprite.x + 12, entry.sprite.y - 20);
        }
    }

    shutdown() {
        window.removeEventListener('backend-ship-position', this.onShipPosition);
        window.removeEventListener('backend-ports', this.onPorts);
        window.removeEventListener('backend-ship-positions', this.onShipPositions);
        this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    }
}
