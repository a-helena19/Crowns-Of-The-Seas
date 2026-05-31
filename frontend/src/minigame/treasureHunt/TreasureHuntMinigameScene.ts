import Phaser from "phaser";
import type { TreasureHuntMinigameConfig, TreasureHuntMinigameResult } from "./TreasureHuntMinigameTypes";
import audioEngine from "../../audio/AudioEngine.ts";
import pirateImage from "../../assets/minigame/treasurehunt/Pirat.png";
import treasureImage from "../../assets/minigame/treasurehunt/Schatz.png";

type GridPos = { x: number; y: number };
type PirateState = {
    pos: GridPos;
    dir: GridPos;
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
};

const LAYOUT = [
    "###################",
    "#S....#...#....P..#",
    "#.#.#.#.#.#.#.#.#.#",
    "#...#...#...#...#.#",
    "#.###.#####.###.#.#",
    "#...............#.#",
    "#.###.#.#.#.###.#.#",
    "#.#...#...#...#...#",
    "#.#.####.####.#.#.#",
    "#...............#.#",
    "###.#.#####.#.###.#",
    "#...#...#...#.....#",
    "#.#.###.#.###.#.#.#",
    "#.#...........#.#.#",
    "#.###.#####.###.#.#",
    "#.....#...#.......#",
    "#.#.#.#.#.#.#.#.#P#",
    "#...#...#...#...#.#",
    "###################",
];

export class TreasureHuntMinigameScene extends Phaser.Scene {
    static readonly KEY = "TreasureHuntMinigameScene";

    private config!: TreasureHuntMinigameConfig;
    private shipSprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    private shipPos: GridPos = { x: 1, y: 1 };
    private desiredDirection: GridPos = { x: 0, y: 0 };
    private currentDirection: GridPos = { x: 0, y: 0 };
    private pirates: PirateState[] = [];
    private treasures = new Map<string, Phaser.GameObjects.Image | Phaser.GameObjects.Arc>();
    private finished = false;
    private cellSize = 36;
    private originX = 0;
    private originY = 0;
    private collectedTreasures = 0;
    private timeLeft = 0;
    private pirateMoveAccumulatorMs = 0;
    private shipMoveAccumulatorMs = 0;
    private shipLoadedKey = "treasure-hunt-player-ship";
    private pirateLoadedKey = "treasure-hunt-pirate";
    private treasureLoadedKey = "treasure-hunt-treasure";
    private keyState = { left: false, right: false, up: false, down: false };
    private finishTriggered = false;

    private timeText?: Phaser.GameObjects.Text;
    private progressText?: Phaser.GameObjects.Text;

    constructor() {
        super({ key: TreasureHuntMinigameScene.KEY });
    }

    init(data: TreasureHuntMinigameConfig) {
        const nextConfig = data && typeof data === "object" ? data : ({} as TreasureHuntMinigameConfig);
        this.config = nextConfig;
        this.finished = false;
        this.finishTriggered = false;
        this.collectedTreasures = 0;
        const parsedLimit = Number(nextConfig.timeLimitSeconds);
        this.timeLeft = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
        this.pirateMoveAccumulatorMs = 0;
        this.shipMoveAccumulatorMs = 0;
        this.treasures.clear();
        this.pirates = [];
        this.currentDirection = { x: 0, y: 0 };
        this.desiredDirection = { x: 0, y: 0 };
        this.keyState = { left: false, right: false, up: false, down: false };
    }

    preload() {
        this.load.image(this.shipLoadedKey, this.config.shipIconUrl || "/ship.png");
        this.load.image(this.pirateLoadedKey, pirateImage);
        this.load.image(this.treasureLoadedKey, treasureImage);
    }

    create() {
        audioEngine.crossfadeTo("obstacle", 250);
        this.cameras.main.setBackgroundColor("#090d16");

        const gridWidth = LAYOUT[0].length;
        const gridHeight = LAYOUT.length;
        this.cellSize = Math.floor(
            Math.min((this.scale.width - 80) / gridWidth, (this.scale.height - 130) / gridHeight)
        );
        this.originX = Math.floor((this.scale.width - gridWidth * this.cellSize) / 2);
        this.originY = Math.floor((this.scale.height - gridHeight * this.cellSize) / 2 + 22);

        this.drawBoard();
        this.setupControls();
        this.buildHud();
        this.startClock();
    }

    update(_time: number, delta: number) {
        if (this.finished) return;

        this.shipMoveAccumulatorMs += delta;
        this.pirateMoveAccumulatorMs += delta;

        while (this.shipMoveAccumulatorMs >= 120) {
            this.shipMoveAccumulatorMs -= 120;
            this.stepShip();
            if (this.finished) return;
        }

        while (this.pirateMoveAccumulatorMs >= 420) {
            this.pirateMoveAccumulatorMs -= 420;
            this.stepPirates();
            if (this.finished) return;
        }
    }

    private drawBoard() {
        const boardBg = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2 + 18,
            LAYOUT[0].length * this.cellSize + 24,
            LAYOUT.length * this.cellSize + 24,
            0x0e1729,
            0.94
        );
        boardBg.setStrokeStyle(2, 0xf4e8c1, 0.4);

        const wall = this.add.graphics();
        wall.fillStyle(0x163459, 1);

        const pirateStarts: GridPos[] = [];
        for (let y = 0; y < LAYOUT.length; y++) {
            for (let x = 0; x < LAYOUT[y].length; x++) {
                const ch = LAYOUT[y][x];
                const px = this.originX + x * this.cellSize;
                const py = this.originY + y * this.cellSize;

                if (ch === "#") {
                    wall.fillRoundedRect(px, py, this.cellSize, this.cellSize, 6);
                    continue;
                }

                this.add.rectangle(
                    px + this.cellSize / 2,
                    py + this.cellSize / 2,
                    this.cellSize - 1,
                    this.cellSize - 1,
                    0x0b1324,
                    0.95
                );

                if (ch === "S") this.shipPos = { x, y };
                if (ch === "P") pirateStarts.push({ x, y });
            }
        }

        this.placeSingleTreasure();

        const shipX = this.originX + this.shipPos.x * this.cellSize + this.cellSize / 2;
        const shipY = this.originY + this.shipPos.y * this.cellSize + this.cellSize / 2;
        if (this.textures.exists(this.shipLoadedKey)) {
            const image = this.add.image(shipX, shipY, this.shipLoadedKey);
            image.setDisplaySize(this.cellSize * 1.42, this.cellSize * 1.18);
            image.setDepth(10);
            this.shipSprite = image;
        } else {
            const rect = this.add.rectangle(shipX, shipY, this.cellSize * 0.7, this.cellSize * 0.48, 0x6ec6ff);
            rect.setDepth(10);
            this.shipSprite = rect;
        }

        const starts = this.resolvePirateStarts(Math.max(1, this.config.pirateCount), pirateStarts);
        for (let i = 0; i < starts.length; i++) {
            const start = starts[i];
            const sx = this.originX + start.x * this.cellSize + this.cellSize / 2;
            const sy = this.originY + start.y * this.cellSize + this.cellSize / 2;
            let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
            if (this.textures.exists(this.pirateLoadedKey)) {
                const pirate = this.add.image(sx, sy, this.pirateLoadedKey);
                pirate.setDisplaySize(this.cellSize * 1.42, this.cellSize * 1.18);
                pirate.setDepth(11);
                sprite = pirate;
            } else {
                const fallback = this.add.rectangle(sx, sy, this.cellSize * 0.56, this.cellSize * 0.56, 0xd64e4e, 1);
                fallback.setStrokeStyle(2, 0x6d1010, 0.8);
                fallback.setDepth(9);
                sprite = fallback;
            }
            this.pirates.push({ pos: { ...start }, dir: { x: 0, y: 0 }, sprite });
        }
    }

    private setupControls() {
        const keyboard = this.input.keyboard;
        if (!keyboard) return;

        keyboard.on("keydown-LEFT", () => { this.keyState.left = true; this.desiredDirection = { x: -1, y: 0 }; });
        keyboard.on("keyup-LEFT", () => { this.keyState.left = false; });
        keyboard.on("keydown-RIGHT", () => { this.keyState.right = true; this.desiredDirection = { x: 1, y: 0 }; });
        keyboard.on("keyup-RIGHT", () => { this.keyState.right = false; });
        keyboard.on("keydown-UP", () => { this.keyState.up = true; this.desiredDirection = { x: 0, y: -1 }; });
        keyboard.on("keyup-UP", () => { this.keyState.up = false; });
        keyboard.on("keydown-DOWN", () => { this.keyState.down = true; this.desiredDirection = { x: 0, y: 1 }; });
        keyboard.on("keyup-DOWN", () => { this.keyState.down = false; });
        keyboard.on("keydown-A", () => { this.keyState.left = true; this.desiredDirection = { x: -1, y: 0 }; });
        keyboard.on("keyup-A", () => { this.keyState.left = false; });
        keyboard.on("keydown-D", () => { this.keyState.right = true; this.desiredDirection = { x: 1, y: 0 }; });
        keyboard.on("keyup-D", () => { this.keyState.right = false; });
        keyboard.on("keydown-W", () => { this.keyState.up = true; this.desiredDirection = { x: 0, y: -1 }; });
        keyboard.on("keyup-W", () => { this.keyState.up = false; });
        keyboard.on("keydown-S", () => { this.keyState.down = true; this.desiredDirection = { x: 0, y: 1 }; });
        keyboard.on("keyup-S", () => { this.keyState.down = false; });
    }

    private buildHud() {
        this.add.text(16, 14, "Schatzjagd", { fontSize: "28px", color: "#f4e8c1", fontStyle: "bold" });
        this.timeText = this.add.text(16, 48, "", { fontSize: "20px", color: "#ffffff" });
        this.progressText = this.add.text(16, 76, "", { fontSize: "20px", color: "#ffffff" });
        this.add.text(16, this.scale.height - 16, "Steuerung: WASD oder Pfeiltasten", {
            fontSize: "14px",
            color: "#d9ebff",
            backgroundColor: "#00000080",
            padding: { x: 7, y: 4 },
        }).setOrigin(0, 1);
        this.updateHud();
    }

    private startClock() {
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.finished) return;
                this.timeLeft = Math.max(0, this.timeLeft - 1);
                this.updateHud();
                if (this.timeLeft <= 0) {
                    audioEngine.playSfx("success");
                    this.finish("SUCCESS", "TIME_UP");
                }
            },
        });
    }

    private stepShip() {
        if (!this.keyState.left && !this.keyState.right && !this.keyState.up && !this.keyState.down) {
            this.currentDirection = { x: 0, y: 0 };
            return;
        }

        if (!this.isZero(this.desiredDirection) && this.canMove(this.shipPos, this.desiredDirection)) {
            this.currentDirection = { ...this.desiredDirection };
        }

        if (this.isZero(this.currentDirection) || !this.canMove(this.shipPos, this.currentDirection)) {
            return;
        }

        this.shipPos = {
            x: this.shipPos.x + this.currentDirection.x,
            y: this.shipPos.y + this.currentDirection.y,
        };
        this.updateSpritePos(this.shipSprite, this.shipPos);
        this.tryCollectTreasure();
        this.checkPirateCollision();
    }

    private stepPirates() {
        for (const pirate of this.pirates) {
            const move = this.choosePirateStep(pirate.pos, pirate.dir, this.shipPos);
            if (!move) continue;
            pirate.pos = move.next;
            pirate.dir = move.dir;
            this.updateSpritePos(pirate.sprite, pirate.pos);
        }
        this.checkPirateCollision();
    }

    private choosePirateStep(from: GridPos, currentDir: GridPos, target: GridPos): { next: GridPos; dir: GridPos } | null {
        const possibleDirs = this.getPossibleDirections(from);
        if (possibleDirs.length === 0) return null;

        const canContinue = !this.isZero(currentDir) && this.canMove(from, currentDir);
        const isCrossing = this.isIntersection(from);
        if (canContinue && !isCrossing) {
            return {
                next: { x: from.x + currentDir.x, y: from.y + currentDir.y },
                dir: { ...currentDir },
            };
        }

        let candidateDirs = possibleDirs;
        if (!this.isZero(currentDir)) {
            const noReverse = possibleDirs.filter((dir) => !this.isOpposite(dir, currentDir));
            if (noReverse.length > 0) candidateDirs = noReverse;
        }

        candidateDirs.sort((a, b) => {
            const nextA = { x: from.x + a.x, y: from.y + a.y };
            const nextB = { x: from.x + b.x, y: from.y + b.y };
            return this.distance(nextA, target) - this.distance(nextB, target);
        });

        const bestDir = candidateDirs[0];
        return {
            next: { x: from.x + bestDir.x, y: from.y + bestDir.y },
            dir: { ...bestDir },
        };
    }

    private tryCollectTreasure() {
        const key = this.keyOf(this.shipPos);
        const treasure = this.treasures.get(key);
        if (!treasure) return;
        treasure.destroy();
        this.treasures.delete(key);
        this.collectedTreasures += 1;
        audioEngine.playSfx("coinReward");
        this.placeSingleTreasure();
        this.updateHud();
    }

    private checkPirateCollision() {
        const hit = this.pirates.some(p => p.pos.x === this.shipPos.x && p.pos.y === this.shipPos.y);
        if (!hit) return;
        audioEngine.playSfx("failed");
        this.finish("FAILED", "PIRATE_CAUGHT");
    }

    private finish(outcome: "SUCCESS" | "FAILED", reason: "TIME_UP" | "PIRATE_CAUGHT" | "OBJECTIVE" = "OBJECTIVE") {
        if (this.finished || this.finishTriggered) return;
        this.finishTriggered = true;
        this.finished = true;
        audioEngine.stopMusic();
        audioEngine.playMusic("game");

        const message = outcome === "FAILED"
            ? "Piraten haben dein Schiff gestellt!"
            : reason === "TIME_UP"
                ? `Zeit abgelaufen! Gefundene Schätze: ${this.collectedTreasures}`
                : "Schatz geborgen!";
        this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width * 0.72, 84, 0x000000, 0.8).setDepth(20);
        this.add.text(this.scale.width / 2, this.scale.height / 2, message, {
            fontSize: "26px",
            color: outcome === "SUCCESS" ? "#7bed9f" : "#ff8f8f",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(21);

        const result: TreasureHuntMinigameResult = {
            eventType: "TREASURE_HUNT",
            result: outcome,
            collectedTreasures: this.collectedTreasures,
            requiredTreasures: this.getRequiredTreasures(),
            timeLeftSeconds: Math.max(0, this.timeLeft),
            timeLimitSeconds: Number.isFinite(Number(this.config.timeLimitSeconds))
                ? Number(this.config.timeLimitSeconds)
                : 20,
            eventId: this.config.eventId,
            travelId: this.config.travelId,
        };

        const delay = outcome === "SUCCESS" ? 900 : 2500;
        let callbackSent = false;
        const sendFinished = () => {
            if (callbackSent) return;
            callbackSent = true;
            this.config.onFinished?.(result);
        };

        this.time.delayedCall(delay, sendFinished);
        const fallbackTimeout = window.setTimeout(sendFinished, delay + 250);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.clearTimeout(fallbackTimeout);
        });
    }

    private canMove(pos: GridPos, dir: GridPos): boolean {
        const nx = pos.x + dir.x;
        const ny = pos.y + dir.y;
        if (ny < 0 || ny >= LAYOUT.length || nx < 0 || nx >= LAYOUT[ny].length) return false;
        return LAYOUT[ny][nx] !== "#";
    }

    private updateSpritePos(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle, pos: GridPos) {
        sprite.setPosition(
            this.originX + pos.x * this.cellSize + this.cellSize / 2,
            this.originY + pos.y * this.cellSize + this.cellSize / 2
        );
    }

    private updateHud() {
        const safeTime = Number.isFinite(this.timeLeft) ? this.timeLeft : this.config.timeLimitSeconds;
        this.timeText?.setText(`Zeit: ${safeTime}s`);
        this.progressText?.setText(`Schätze: ${this.collectedTreasures}`);
    }

    private getRequiredTreasures(): number {
        const value = Number(this.config.requiredTreasures);
        return Number.isFinite(value) && value > 0 ? value : 1;
    }

    private keyOf(pos: GridPos): string {
        return `${pos.x}:${pos.y}`;
    }

    private distance(a: GridPos, b: GridPos): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private isZero(v: GridPos): boolean {
        return v.x === 0 && v.y === 0;
    }

    private getPossibleDirections(from: GridPos): GridPos[] {
        const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ];
        return dirs.filter((dir) => this.canMove(from, dir));
    }

    private isIntersection(pos: GridPos): boolean {
        return this.getPossibleDirections(pos).length >= 3;
    }

    private isOpposite(a: GridPos, b: GridPos): boolean {
        return a.x === -b.x && a.y === -b.y;
    }

    private placeSingleTreasure() {
        for (const existing of this.treasures.values()) {
            existing.destroy();
        }
        this.treasures.clear();

        const openCells: GridPos[] = [];
        for (let y = 0; y < LAYOUT.length; y++) {
            for (let x = 0; x < LAYOUT[y].length; x++) {
                if (LAYOUT[y][x] === "#") continue;
                if (x === this.shipPos.x && y === this.shipPos.y) continue;
                if (LAYOUT[y][x] === "P") continue;
                if (this.pirates.some(p => p.pos.x === x && p.pos.y === y)) continue;
                openCells.push({ x, y });
            }
        }
        const pick = openCells[Math.floor(Math.random() * openCells.length)];
        if (!pick) {
            return;
        }

        const px = this.originX + pick.x * this.cellSize + this.cellSize / 2;
        const py = this.originY + pick.y * this.cellSize + this.cellSize / 2;
        let treasure: Phaser.GameObjects.Image | Phaser.GameObjects.Arc;
        if (this.textures.exists(this.treasureLoadedKey)) {
            const sprite = this.add.image(px, py, this.treasureLoadedKey);
            sprite.setDisplaySize(this.cellSize * 1.35, this.cellSize * 1.35);
            sprite.setDepth(8);
            treasure = sprite;
        } else {
            treasure = this.add.circle(px, py, Math.max(6, this.cellSize * 0.18), 0xf8d56b, 1);
        }
        const key = this.keyOf(pick);
        this.treasures.set(key, treasure);
    }

    private resolvePirateStarts(requestedCount: number, predefined: GridPos[]): GridPos[] {
        const starts: GridPos[] = [];
        for (const p of predefined) {
            if (starts.length >= requestedCount) break;
            starts.push({ ...p });
        }
        while (starts.length < requestedCount) {
            const fallback = this.randomOpenCellFarFromShip();
            if (!fallback) break;
            starts.push(fallback);
        }
        return starts;
    }

    private randomOpenCellFarFromShip(): GridPos | null {
        const candidates: GridPos[] = [];
        for (let y = 0; y < LAYOUT.length; y++) {
            for (let x = 0; x < LAYOUT[y].length; x++) {
                if (LAYOUT[y][x] === "#") continue;
                const d = this.distance({ x, y }, this.shipPos);
                if (d < 6) continue;
                candidates.push({ x, y });
            }
        }
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    }
}
