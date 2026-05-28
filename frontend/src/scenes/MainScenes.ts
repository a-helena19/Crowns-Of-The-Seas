import Phaser from 'phaser';
import Ship from '../game/Ship';
import {
    minigameSessionManager,
    type ActiveMinigameSession,
    type ShipMinigameBlockChangedEvent,
} from '../minigame/MinigameSessionManager';

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
    status: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING' | 'REFUELING' | 'REPAIRING' | 'READY_TO_DEPART';
    arrivalTick: number | null;
    originX: number | null;
    originY: number | null;
    destX: number | null;
    destY: number | null;
    startTick: number | null;
    currentPortId?: string | null;
    paused?: boolean;
}

interface ShipPositionsPayload {
    currentTick: number;
    ships: ShipPositionData[];
}

interface TravelResumedPayload {
    travelId: string;
    playerShipId: string;
    currentTick?: number;
    startTick?: number;
    arrivalTick?: number;
    originX?: number;
    originY?: number;
    destX?: number;
    destY?: number;
}

interface ShipEntry {
    sprite: Phaser.GameObjects.Sprite;
    controller: Ship;
    tooltip: Phaser.GameObjects.Text;
    lastStatus: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING' | 'REFUELING' | 'REPAIRING' | 'READY_TO_DEPART' | null;
    lastStartTick: number | null;
    lastShipData: ShipPositionData;
    lastPaused: boolean;
    needsResumeFromPause: boolean;
    minigameSession?: ActiveMinigameSession;
}

export default class MainScene extends Phaser.Scene {
    private static readonly ARRIVAL_CATCHUP_MIN_MS = 180;
    private static readonly ARRIVAL_CATCHUP_MAX_MS = 900;
    private ship!: Phaser.GameObjects.Sprite;
    private shipController!: Ship;

    private shipSprites: Map<string, ShipEntry> = new Map();

    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private harborSprites: Phaser.GameObjects.Image[] = [];
    private harborLabels: Phaser.GameObjects.Text[] = [];
    private harborHitZones: Phaser.GameObjects.Zone[] = [];
    private harborPortData: PortData[] = [];
    private mapImage!: Phaser.GameObjects.Image;
    private routeGraphics!: Phaser.GameObjects.Graphics;
    private routeData: Array<{ originPortId: string; destinationPortId: string; waypoints: Array<{ x: number; y: number }> }> = [];

    private onShipPosition!: (e: Event) => void;
    private onPorts!: (e: Event) => void;
    private onShipPositions!: (e: Event) => void;
    private onTravelResumed!: (e: Event) => void;
    private onBlinkPortPin!: (e: Event) => void;
    private lastSceneWidth: number = 0;
    private lastSceneHeight: number = 0;
    private blockedShipsByMinigame: Map<string, ActiveMinigameSession> = new Map();
    private unsubscribeMinigameEvents: (() => void) | null = null;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('map', '/World_Map3.PNG');
        this.load.image('ship', '/ship.png');
        this.load.image('harbor', '/harborpingred.png');
    }

    create() {
        this.mapImage = this.add.image(0, 0, 'map').setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
        this.routeGraphics = this.add.graphics().setDepth(2);
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

        this.onTravelResumed = (e: Event) => {
            const payload = (e as CustomEvent<TravelResumedPayload>).detail;
            this.handleTravelResumed(payload);
        };

        window.addEventListener('backend-ship-position', this.onShipPosition);
        window.addEventListener('backend-ports', this.onPorts);
        window.addEventListener('backend-ship-positions', this.onShipPositions);
        window.addEventListener('travel-resumed', this.onTravelResumed);
        this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);

        this.onBlinkPortPin = (e: Event) => {
            const { portId } = (e as CustomEvent<{ portId: string }>).detail;
            for (let i = 0; i < this.harborPortData.length; i++) {
                if (this.harborPortData[i].id === portId) {
                    const sprite = this.harborSprites[i];
                    if (!sprite) break;
                    let blinks = 0;
                    const blinkTimer = this.time.addEvent({
                        delay: 300,
                        repeat: 7,
                        callback: () => {
                            sprite.setAlpha(blinks % 2 === 0 ? 0.2 : 1.0);
                            blinks++;
                            if (blinks > 7) {
                                sprite.setAlpha(1.0);
                                blinkTimer.destroy();
                            }
                        },
                    });
                    break;
                }
            }
        };
        window.addEventListener('blink-port-pin', this.onBlinkPortPin);

        this.blockedShipsByMinigame = minigameSessionManager.getAllBlockedShips();
        this.unsubscribeMinigameEvents = minigameSessionManager.subscribe((event) => {
            this.onMinigameBlockChanged(event);
        });

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

        this.fetchAndRenderRoutes();
    }

    private fetchAndRenderRoutes() {
        const token = localStorage.getItem('auth_token') ?? '';
        fetch('/api/routes', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => (r.ok ? r.json() : null))
            .then((routes: Array<{ originPortId: string; destinationPortId: string; waypoints: Array<{ x: number; y: number }> }> | null) => {
                if (!routes) return;
                this.routeData = routes;
                this.renderRoutes();
            })
            .catch(() => {
            });
    }

    private renderRoutes() {
        if (!this.routeGraphics || this.routeData.length === 0) return;
        this.routeGraphics.clear();

        const ports = this.harborPortData.length > 0
            ? this.harborPortData
            : (window.__latestPorts ?? []);
        const portMap = new Map<string, { x: number; y: number }>();
        for (const p of ports) {
            portMap.set(p.id, { x: p.x, y: p.y });
        }

        const activePairs = new Set<string>();
        const ships = window.__latestShips ?? [];
        for (const ship of ships) {
            if (ship.status !== 'EN_ROUTE') continue;
            if (ship.originX == null || ship.originY == null
                || ship.destX == null || ship.destY == null) continue;
            const originPort = this.findPortAt(ports, ship.originX, ship.originY);
            const destPort = this.findPortAt(ports, ship.destX, ship.destY);
            if (originPort && destPort) {
                activePairs.add(this.pairKey(originPort.id, destPort.id));
            }
        }

        this.routeGraphics.lineStyle(0.8, 0xffffff, 0.04);
        for (const route of this.routeData) {
            if (activePairs.has(this.pairKey(route.originPortId, route.destinationPortId))) continue;
            this.drawRoutePath(route, portMap);
        }

        this.routeGraphics.lineStyle(1.9, 0xcc2020, 0.7);
        for (const route of this.routeData) {
            if (!activePairs.has(this.pairKey(route.originPortId, route.destinationPortId))) continue;
            this.drawRoutePath(route, portMap);
        }
    }

    private pairKey(a: string, b: string): string {
        return a < b ? `${a}|${b}` : `${b}|${a}`;
    }

    private findPortAt(ports: PortData[], x: number, y: number): PortData | undefined {
        const TOLERANCE = 0.5; // percent
        return ports.find(p =>
            Math.abs(p.x - x) < TOLERANCE && Math.abs(p.y - y) < TOLERANCE
        );
    }

    private drawRoutePath(
        route: { originPortId: string; destinationPortId: string; waypoints: Array<{ x: number; y: number }> },
        portMap: Map<string, { x: number; y: number }>,
    ) {
        const origin = portMap.get(route.originPortId);
        const dest = portMap.get(route.destinationPortId);
        if (!origin || !dest) return;

        const points: Array<{ x: number; y: number }> = [
            origin,
            ...(route.waypoints ?? []),
            dest,
        ];

        this.routeGraphics.beginPath();
        this.routeGraphics.moveTo(
            (points[0].x / 100) * this.scale.width,
            (points[0].y / 100) * this.scale.height,
        );
        for (let i = 1; i < points.length; i++) {
            this.routeGraphics.lineTo(
                (points[i].x / 100) * this.scale.width,
                (points[i].y / 100) * this.scale.height,
            );
        }
        this.routeGraphics.strokePath();
    }

    private buildShipPolyline(
        originX: number, originY: number,
        destX: number, destY: number,
    ): Array<{ x: number; y: number }> {
        const ports = this.harborPortData.length > 0
            ? this.harborPortData
            : (window.__latestPorts ?? []);
        const originPort = this.findPortAt(ports, originX, originY);
        const destPort = this.findPortAt(ports, destX, destY);

        let waypointsPct: Array<{ x: number; y: number }> = [];
        if (originPort && destPort) {
            const direct = this.routeData.find(r =>
                r.originPortId === originPort.id && r.destinationPortId === destPort.id);
            if (direct) {
                waypointsPct = direct.waypoints ?? [];
            } else {
                const reversed = this.routeData.find(r =>
                    r.originPortId === destPort.id && r.destinationPortId === originPort.id);
                if (reversed) {
                    waypointsPct = [...(reversed.waypoints ?? [])].reverse();
                }
            }
        }

        const polyline: Array<{ x: number; y: number }> = [];
        polyline.push({
            x: (originX / 100) * this.scale.width,
            y: (originY / 100) * this.scale.height,
        });
        for (const wp of waypointsPct) {
            polyline.push({
                x: (wp.x / 100) * this.scale.width,
                y: (wp.y / 100) * this.scale.height,
            });
        }
        polyline.push({
            x: (destX / 100) * this.scale.width,
            y: (destY / 100) * this.scale.height,
        });
        return polyline;
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
                const minigameSession = this.blockedShipsByMinigame.get(shipData.playerShipId);
                const isPaused = shipData.paused === true || !!minigameSession;

                if (this.isSameSnapshot(entry.lastShipData, shipData) && entry.lastPaused === isPaused) {
                    continue;
                }

                if (shipData.status === 'EN_ROUTE') {
                    const wasPaused = entry.lastPaused;
                    entry.minigameSession = minigameSession;
                    this.updateShipTooltipText(entry);

                    if (isPaused && !wasPaused) {
                        // Ship just became paused — freeze at current position
                        entry.controller.teleport(entry.sprite.x, entry.sprite.y);
                        entry.lastPaused = true;
                        entry.needsResumeFromPause = true;
                    } else if (!isPaused && wasPaused) {
                        // Ship just resumed — restart route with new timing
                        if (hasRouteData) {
                            const routeTiming = this.getRouteTiming(shipData, currentTick, tickRateMs);
                            const polyline = this.buildShipPolyline(
                                shipData.originX, shipData.originY,
                                shipData.destX, shipData.destY,
                            );
                            entry.controller.finishRouteFromCurrentPosition(
                                polyline,
                                this.getRouteRemainingMs(routeTiming),
                            );
                            entry.lastStartTick = shipData.startTick;
                        } else {
                            entry.controller.moveTo(px, py, tickRateMs);
                            entry.lastStartTick = null;
                        }
                        entry.lastPaused = false;
                        entry.needsResumeFromPause = false;
                    } else if (isPaused) {
                        // Still paused — do nothing, keep ship frozen
                    } else {
                        // Normal EN_ROUTE (not paused)
                        const isSameTravel = entry.lastStatus === 'EN_ROUTE'
                            && shipData.startTick != null
                            && entry.lastStartTick === shipData.startTick;

                        if (hasRouteData && (!isSameTravel || entry.needsResumeFromPause)) {
                            const routeTiming = this.getRouteTiming(shipData, currentTick, tickRateMs);
                            const polyline = this.buildShipPolyline(
                                shipData.originX, shipData.originY,
                                shipData.destX, shipData.destY,
                            );
                            if (entry.needsResumeFromPause) {
                                entry.controller.finishRouteFromCurrentPosition(
                                    polyline,
                                    this.getRouteRemainingMs(routeTiming),
                                );
                            } else {
                                entry.controller.setRoute(
                                    polyline,
                                    routeTiming.elapsedMs,
                                    routeTiming.totalMs,
                                    true,
                                    routeTiming.startDelayMs,
                                );
                            }
                            entry.lastStartTick = shipData.startTick;
                            entry.needsResumeFromPause = false;
                        } else if (!hasRouteData) {
                            entry.controller.moveTo(px, py, tickRateMs);
                            entry.lastStartTick = null;
                            entry.needsResumeFromPause = false;
                        }
                        entry.lastPaused = false;
                    }
                    entry.lastStatus = 'EN_ROUTE';
                } else {
                    if (entry.lastStatus === 'EN_ROUTE') {
                        const lastRoute = entry.lastShipData;
                        const canFinishOnRoute = this.hasRouteData(lastRoute);
                        if (canFinishOnRoute) {
                            const routePolyline = this.buildShipPolyline(
                                lastRoute.originX, lastRoute.originY,
                                lastRoute.destX, lastRoute.destY,
                            );
                            const distance = Math.hypot(px - entry.sprite.x, py - entry.sprite.y);
                            const currentSpeed = entry.controller.getSpeedPxPerMs();
                            const naturalDuration = currentSpeed > 1e-6
                                ? distance / currentSpeed
                                : tickRateMs * 0.35;
                            const catchupDuration = Math.max(
                                MainScene.ARRIVAL_CATCHUP_MIN_MS,
                                naturalDuration,
                            );
                            // Backend may already be at port; visibly catch up along the route, not as a straight pull.
                            entry.controller.finishRouteFromCurrentPosition(routePolyline, catchupDuration);
                        } else {
                            const distance = Math.hypot(px - entry.sprite.x, py - entry.sprite.y);
                            const currentSpeed = entry.controller.getSpeedPxPerMs();
                            if (distance > 0.5) {
                                const naturalDuration = currentSpeed > 1e-6
                                    ? distance / currentSpeed
                                    : this.resolveTickRateMs() * 0.35;
                                const catchupDuration = Math.max(
                                    MainScene.ARRIVAL_CATCHUP_MIN_MS,
                                    Math.min(MainScene.ARRIVAL_CATCHUP_MAX_MS, naturalDuration)
                                );
                                entry.controller.moveTo(px, py, catchupDuration);
                            } else {
                                entry.controller.teleport(px, py);
                            }
                        }
                    } else {
                        if (!entry.controller.isMoving()) {
                            entry.controller.teleport(px, py);
                        }
                    }
                    entry.lastStatus = 'AT_PORT';
                    entry.lastStartTick = null;
                    entry.lastPaused = false;
                    entry.needsResumeFromPause = false;
                    entry.minigameSession = minigameSession;
                    this.updateShipTooltipText(entry);
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

        this.renderRoutes();
    }

    private createShipSprite(
        id: string, playerName: string, textureKey: string,
        status: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING' | 'REFUELING' | 'REPAIRING' | 'READY_TO_DEPART',
        shipData: ShipPositionData,
        tickRateMs: number,
        currentTick: number,
    ) {
        if (this.shipSprites.has(id)) return;

        const spawnX = (shipData.x / 100) * this.scale.width;
        const spawnY = (shipData.y / 100) * this.scale.height;

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
        const minigameSession = this.blockedShipsByMinigame.get(shipData.playerShipId);
        const isPaused = shipData.paused === true || !!minigameSession;

        if (status === 'EN_ROUTE' && !isPaused && this.hasRouteData(shipData)) {
            const routeTiming = this.getRouteTiming(shipData, currentTick, tickRateMs);
            const polyline = this.buildShipPolyline(
                shipData.originX, shipData.originY,
                shipData.destX, shipData.destY,
            );
            controller.setRoute(
                polyline,
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
            lastPaused: isPaused,
            needsResumeFromPause: isPaused,
            minigameSession,
        });
        this.updateShipTooltipText(this.shipSprites.get(id)!);

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

        if (this.mapImage) {
            this.mapImage.setDisplaySize(this.scale.width, this.scale.height);
        }

        this.renderRoutes();

        for (let i = 0; i < this.harborSprites.length; i++) {
            const port = this.harborPortData[i];
            if (!port) continue;
            const px = (port.x / 100) * this.scale.width;
            const py = (port.y / 100) * this.scale.height;
            this.harborSprites[i].setPosition(px, py);
            if (this.harborHitZones[i]) {
                this.harborHitZones[i].setPosition(px, py);
            }
            if (this.harborLabels[i]) {
                const LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {};
                const offset = LABEL_OFFSETS[port.name] ?? { dx: 10, dy: -10 };
                this.harborLabels[i].setPosition(px + offset.dx, py + offset.dy);
            }
        }

        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);

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
            // ignore
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

    private getRouteRemainingMs(routeTiming: { elapsedMs: number; totalMs: number; startDelayMs: number }) {
        return Math.max(
            80,
            routeTiming.totalMs - routeTiming.elapsedMs + routeTiming.startDelayMs,
        );
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
            && Math.abs(a.y - b.y) < 1e-9
            && (a.paused ?? false) === (b.paused ?? false);
    }

    private onMinigameBlockChanged(event: ShipMinigameBlockChangedEvent) {
        if (event.blocked && event.session) {
            this.blockedShipsByMinigame.set(event.shipId, event.session);
        } else {
            this.blockedShipsByMinigame.delete(event.shipId);
        }

        const entry = this.shipSprites.get(event.shipId);
        if (!entry) return;

        entry.minigameSession = event.blocked ? event.session : undefined;
        this.updateShipTooltipText(entry);

        if (event.blocked) {
            entry.controller.teleport(entry.sprite.x, entry.sprite.y);
            entry.lastPaused = true;
            entry.needsResumeFromPause = true;
            return;
        }

        entry.lastPaused = true;
        entry.needsResumeFromPause = true;

        const latest = (window.__latestShips ?? []).find(s => s.playerShipId === event.shipId);
        if (latest?.paused === false) {
            this.resumeShipFromLatestData(entry, event.shipId);
        }
    }

    private resumeShipFromLatestData(entry: ShipEntry, shipId: string) {
        const latest = (window.__latestShips ?? []).find(s => s.playerShipId === shipId) ?? entry.lastShipData;
        const currentTick = window.__latestShipPositionsTick ?? window.__latestTick?.currentTick ?? 0;
        const tickRateMs = this.resolveTickRateMs();
        const px = (latest.x / 100) * this.scale.width;
        const py = (latest.y / 100) * this.scale.height;

        if (latest.status === 'EN_ROUTE' && this.hasRouteData(latest)) {
            const routeTiming = this.getRouteTiming(latest, currentTick, tickRateMs);
            const polyline = this.buildShipPolyline(
                latest.originX, latest.originY,
                latest.destX, latest.destY,
            );
            entry.controller.finishRouteFromCurrentPosition(
                polyline,
                this.getRouteRemainingMs(routeTiming),
            );
            entry.lastStatus = 'EN_ROUTE';
            entry.lastStartTick = latest.startTick;
        } else if (latest.status === 'EN_ROUTE') {
            entry.controller.moveTo(px, py, tickRateMs);
            entry.lastStatus = 'EN_ROUTE';
            entry.lastStartTick = null;
        } else {
            if (entry.lastStatus === 'EN_ROUTE' && this.hasRouteData(entry.lastShipData)) {
                const routePolyline = this.buildShipPolyline(
                    entry.lastShipData.originX, entry.lastShipData.originY,
                    entry.lastShipData.destX, entry.lastShipData.destY,
                );
                const distance = Math.hypot(px - entry.sprite.x, py - entry.sprite.y);
                const currentSpeed = entry.controller.getSpeedPxPerMs();
                const naturalDuration = currentSpeed > 1e-6
                    ? distance / currentSpeed
                    : tickRateMs * 0.35;
                const catchupDuration = Math.max(
                    MainScene.ARRIVAL_CATCHUP_MIN_MS,
                    naturalDuration,
                );
                entry.controller.finishRouteFromCurrentPosition(routePolyline, catchupDuration);
            } else if (!entry.controller.isMoving()) {
                entry.controller.teleport(px, py);
            }
            entry.lastStatus = 'AT_PORT';
            entry.lastStartTick = null;
        }

        entry.lastPaused = false;
        entry.needsResumeFromPause = false;
        entry.lastShipData = latest;
        this.updateShipTooltipText(entry);
    }

    private handleTravelResumed(payload: TravelResumedPayload) {
        const entry = this.shipSprites.get(payload.playerShipId);
        if (!entry) return;
        if (payload.currentTick == null
            || payload.startTick == null
            || payload.arrivalTick == null
            || payload.originX == null
            || payload.originY == null
            || payload.destX == null
            || payload.destY == null) {
            return;
        }

        const resumedData: ShipPositionData = {
            ...entry.lastShipData,
            status: 'EN_ROUTE',
            x: (entry.sprite.x / this.scale.width) * 100,
            y: (entry.sprite.y / this.scale.height) * 100,
            startTick: payload.startTick,
            arrivalTick: payload.arrivalTick,
            originX: payload.originX,
            originY: payload.originY,
            destX: payload.destX,
            destY: payload.destY,
            paused: false,
        };
        const routeTiming = this.getRouteTiming(resumedData as ShipPositionData & {
            startTick: number;
            arrivalTick: number;
        }, payload.currentTick, this.resolveTickRateMs());
        const polyline = this.buildShipPolyline(payload.originX, payload.originY, payload.destX, payload.destY);

        entry.controller.finishRouteFromCurrentPosition(
            polyline,
            this.getRouteRemainingMs(routeTiming),
        );
        entry.lastShipData = resumedData;
        entry.lastStatus = 'EN_ROUTE';
        entry.lastStartTick = payload.startTick;
        entry.lastPaused = false;
        entry.needsResumeFromPause = false;
        entry.minigameSession = undefined;
        this.updateShipTooltipText(entry);
    }

    private updateShipTooltipText(entry: ShipEntry) {
        const playerName = entry.lastShipData.playerName;
        const hasMinigame = !!entry.minigameSession;
        const suffix = hasMinigame ? " (Minigame aktiv)" : "";
        entry.tooltip.setText(`${playerName}${suffix}`);
    }

    private renderHarbors(ports: PortData[]) {
        const LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {};

        this.harborPortData = ports;

        ports.forEach(port => {
            const px = (port.x / 100) * this.scale.width;
            const py = (port.y / 100) * this.scale.height;
            const img = this.add.image(px, py, 'harbor')
                .setScale(0.01)
                .setDepth(6);

            const hitZone = this.add.zone(px, py, 30, 30)
                .setInteractive()
                .setDepth(7);

            hitZone.on('pointerdown', () => {
                window.dispatchEvent(new CustomEvent('port-clicked', { detail: port }));
            });

            const offset = LABEL_OFFSETS[port.name] ?? { dx: 10, dy: -10 };
            const label = this.add.text(px + offset.dx, py + offset.dy, port.name, {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000cc',
                padding: { x: 4, y: 2 }
            }).setDepth(10);

            this.harborSprites.push(img);
            this.harborLabels.push(label);
            this.harborHitZones.push(hitZone);
        });

        if (this.routeData.length > 0) {
            this.renderRoutes();
        }
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
        window.removeEventListener('travel-resumed', this.onTravelResumed);
        window.removeEventListener('blink-port-pin', this.onBlinkPortPin);
        this.unsubscribeMinigameEvents?.();
        this.unsubscribeMinigameEvents = null;
        this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    }
}
