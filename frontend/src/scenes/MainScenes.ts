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
    status: 'EN_ROUTE' | 'AT_PORT';
    arrivalTick: number | null;
    originX: number | null;
    originY: number | null;
    destX: number | null;
    destY: number | null;
    startTick: number | null;
}

interface ShipEntry {
    sprite: Phaser.GameObjects.Sprite;
    controller: Ship;
    tooltip: Phaser.GameObjects.Text;
    lastStatus: 'EN_ROUTE' | 'AT_PORT' | null;
    lastStartTick: number | null;
}

export default class MainScene extends Phaser.Scene {
    private ship!: Phaser.GameObjects.Sprite;
    private shipController!: Ship;

    private shipSprites: Map<string, ShipEntry> = new Map();

    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private harborSprites: Phaser.GameObjects.Image[] = [];
    private tooltip!: Phaser.GameObjects.Text;

    private onShipPosition!: (e: Event) => void;
    private onPorts!: (e: Event) => void;
    private onShipPositions!: (e: Event) => void;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('map', '/World_Map2.png');
        this.load.image('ship', '/ship.png');
        this.load.image('harbor', '/harborpingred.png');
    }

    create() {
        this.add.image(0, 0, 'map').setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.tooltip = this.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000cc',
            padding: { x: 6, y: 4 },
        }).setDepth(10).setVisible(false);

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
            const ships = (e as CustomEvent<ShipPositionData[]>).detail;
            this.updateShipSprites(ships);
        };

        window.addEventListener('backend-ship-position', this.onShipPosition);
        window.addEventListener('backend-ports', this.onPorts);
        window.addEventListener('backend-ship-positions', this.onShipPositions);

        const latestPorts = window.__latestPorts;
        if (latestPorts && this.harborSprites.length === 0) {
            this.renderHarbors(latestPorts);
        }

        if (window.__latestShips) {
            this.updateShipSprites(window.__latestShips);
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

    private updateShipSprites(ships: ShipPositionData[]) {
        const activeIds = new Set(ships.map(s => s.playerShipId));

        for (const [id, entry] of this.shipSprites.entries()) {
            if (!activeIds.has(id)) {
                entry.sprite.destroy();
                entry.tooltip.destroy();
                this.shipSprites.delete(id);
            }
        }

        const tickRateMs = window.__tickRateMs ?? 30_000;

        for (const shipData of ships) {
            const px = (shipData.x / 100) * this.scale.width;
            const py = (shipData.y / 100) * this.scale.height;
            const textureKey = this.resolveTextureKey(shipData.iconUrl);

            if (this.shipSprites.has(shipData.playerShipId)) {
                const entry = this.shipSprites.get(shipData.playerShipId)!;

                if (shipData.status === 'EN_ROUTE') {
                    const isSameTravel = entry.lastStatus === 'EN_ROUTE'
                        && shipData.startTick != null
                        && entry.lastStartTick === shipData.startTick;

                    if (!isSameTravel
                        && shipData.originX != null && shipData.originY != null
                        && shipData.destX != null && shipData.destY != null
                        && shipData.startTick != null && shipData.arrivalTick != null) {

                        const currentTick = window.__latestTick?.currentTick ?? 0;
                        const elapsedTicks = Math.max(0, currentTick - shipData.startTick);
                        const totalTicks = Math.max(1, shipData.arrivalTick - shipData.startTick);
                        const elapsedMs = elapsedTicks * tickRateMs;
                        const totalMs = totalTicks * tickRateMs;

                        entry.controller.setRoute(
                            (shipData.originX / 100) * this.scale.width,
                            (shipData.originY / 100) * this.scale.height,
                            (shipData.destX / 100) * this.scale.width,
                            (shipData.destY / 100) * this.scale.height,
                            elapsedMs, totalMs,
                        );
                        entry.lastStartTick = shipData.startTick;
                    }
                    // same travel → animation runs freely, no reset
                    entry.lastStatus = 'EN_ROUTE';
                } else {
                    entry.controller.teleport(px, py);
                    entry.lastStatus = 'AT_PORT';
                    entry.lastStartTick = null;
                }
            } else {
                this.createShipSprite(
                    shipData.playerShipId, shipData.playerName, textureKey,
                    shipData.status, shipData, tickRateMs,
                );
            }
        }

        if (ships.length > 0) {
            this.ship.setVisible(false);
        }
    }

    private createShipSprite(
        id: string, playerName: string, textureKey: string,
        status: 'EN_ROUTE' | 'AT_PORT',
        shipData: ShipPositionData,
        tickRateMs: number,
    ) {
        const loadAndCreate = () => {
            // Verhindert doppeltes Erstellen bei parallelen Lade-Events
            if (this.shipSprites.has(id)) return;

            // Startposition: Ursprungshafen (bei EN_ROUTE) oder aktueller Hafen
            const spawnX = status === 'EN_ROUTE' && shipData.originX != null
                ? (shipData.originX / 100) * this.scale.width
                : (shipData.x / 100) * this.scale.width;
            const spawnY = status === 'EN_ROUTE' && shipData.originY != null
                ? (shipData.originY / 100) * this.scale.height
                : (shipData.y / 100) * this.scale.height;

            const sprite = this.add.sprite(spawnX, spawnY, textureKey)
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

            if (status === 'EN_ROUTE'
                && shipData.originX != null && shipData.originY != null
                && shipData.destX != null && shipData.destY != null
                && shipData.startTick != null && shipData.arrivalTick != null) {

                const currentTick = window.__latestTick?.currentTick ?? 0;
                const elapsedTicks = Math.max(0, currentTick - shipData.startTick);
                const totalTicks = Math.max(1, shipData.arrivalTick - shipData.startTick);

                controller.setRoute(
                    (shipData.originX / 100) * this.scale.width,
                    (shipData.originY / 100) * this.scale.height,
                    (shipData.destX / 100) * this.scale.width,
                    (shipData.destY / 100) * this.scale.height,
                    elapsedTicks * tickRateMs,
                    totalTicks * tickRateMs,
                );
                lastStartTick = shipData.startTick;
            }

            this.shipSprites.set(id, {
                sprite, controller, tooltip: shipTooltip,
                lastStatus: status, lastStartTick,
            });
        };

        if (this.textures.exists(textureKey)) {
            loadAndCreate();
        } else {
            this.load.image(textureKey, textureKey);
            this.load.once('complete', loadAndCreate);
            this.load.start();
        }
    }

    private resolveTextureKey(iconUrl: string): string {
        if (!iconUrl || iconUrl.trim() === '') return 'ship';
        return iconUrl;
    }

    private renderHarbors(ports: PortData[]) {
        ports.forEach(port => {
            const px = (port.x / 100) * this.scale.width;
            const py = (port.y / 100) * this.scale.height;
            const img = this.add.image(px, py, 'harbor').setScale(0.01).setInteractive();

            this.add.text(px + 10, py - 10, port.name, {
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
    }
}
