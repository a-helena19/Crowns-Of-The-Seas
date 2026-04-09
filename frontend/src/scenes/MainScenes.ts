import Phaser from 'phaser';
import Ship from '../game/Ship';


interface PortData {
    name: string;
    x: number;
    y: number;
}

export default class MainScene extends Phaser.Scene {
    private ship!: Phaser.GameObjects.Sprite;
    private shipController!: Ship;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private harborSprites: Phaser.GameObjects.Image[] = [];
    private tooltip!: Phaser.GameObjects.Text;

    private onShipPosition!: (e: Event) => void;
    private onPorts!: (e: Event) => void;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('map', '/World_Map2.png');
        this.load.image('ship', '/ship.png');
        this.load.image('harbor', '/harborpingred.png');
    }

    create() {
        // Weltkarte
        this.add.image(0, 0, 'map').setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.tooltip = this.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000cc',
            padding: { x: 6, y: 4 },
        }).setDepth(10).setVisible(false);

        // Schiff — Startposition aus Backend-State, Fallback auf Bildmitte
        const latestShip = window.__latestShip;
        const shipStartX = latestShip ? (latestShip.x / 100) * this.scale.width  : this.scale.width  * 0.5;
        const shipStartY = latestShip ? (latestShip.y / 100) * this.scale.height : this.scale.height * 0.5;
        this.ship = this.add.sprite(shipStartX, shipStartY, 'ship')
            .setScale(0.065).setInteractive().setDepth(5);

        this.ship.on('pointerover', (pointer: Phaser.Input.Pointer) => {
            this.tooltip.setText('Schiff Nr. 1').setPosition(pointer.worldX + 10, pointer.worldY - 20).setVisible(true);
        });
        this.ship.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.tooltip.setPosition(pointer.worldX + 10, pointer.worldY - 20);
        });
        this.ship.on('pointerout', () => {
            this.tooltip.setVisible(false);
        });

        // Ship Controller
        this.shipController = new Ship(this, this.ship);

        // Backend: Schiffsposition aktualisieren
        this.onShipPosition = (e: Event) => {
            const { x, y, status, tickRateMs } = (e as CustomEvent<{ x: number; y: number; status: string; tickRateMs: number }>).detail;
            const px = (x / 100) * this.scale.width;
            const py = (y / 100) * this.scale.height;

            if (status === 'AT_PORT') {
                // Sofort teleportieren — kein Tween zurück über die Karte
                this.shipController.teleport(px, py);
            } else {
                const tickDuration = tickRateMs || 1000;
                this.shipController.moveTo(px, py, tickDuration);
            }
        };

        // Backend: Häfen rendern (nur einmal beim ersten Empfang)
        this.onPorts = (e: Event) => {
            if (this.harborSprites.length > 0) return;
            const ports = (e as CustomEvent<PortData[]>).detail;
            this.renderHarbors(ports);
        };

        window.addEventListener('backend-ship-position', this.onShipPosition);
        window.addEventListener('backend-ports', this.onPorts);

        // Falls Daten schon vor create() angekommen sind (Race Condition), jetzt anwenden
        const latestPorts = window.__latestPorts;
        if (latestPorts && this.harborSprites.length === 0) {
            this.renderHarbors(latestPorts);
        }
        const savedShip = window.__latestShip;
        if (savedShip) {
            const px = (savedShip.x / 100) * this.scale.width;
            const py = (savedShip.y / 100) * this.scale.height;
            this.shipController.teleport(px, py);
        }

        // Kamera-Grenzen auf Kartengröße
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);

        // Karte zoomen
        this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
            const cam = this.cameras.main;
            const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 1, 4);
            cam.setZoom(newZoom);
        });

        // Karte verschieben
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDragging) return;
            const cam = this.cameras.main;
            cam.scrollX -= (pointer.x - this.dragStartX) / cam.zoom;
            cam.scrollY -= (pointer.y - this.dragStartY) / cam.zoom;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
        });
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
    }

    shutdown() {
        window.removeEventListener('backend-ship-position', this.onShipPosition);
        window.removeEventListener('backend-ports', this.onPorts);
    }
}
