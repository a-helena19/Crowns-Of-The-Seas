interface Point {
    x: number;
    y: number;
}

interface Segment {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    length: number;
    /** Cumulative distance from the polyline start to the END of this segment. */
    cumulativeEnd: number;
}

export default class Ship {
    private static readonly MIN_MOVE_DURATION_MS = 80;
    private static readonly ARRIVAL_EPSILON_PX = 0.5;
    private sprite: Phaser.GameObjects.Sprite;

    private routeActive: boolean = false;
    private routeSegments: Segment[] = [];
    private routeTotalLength: number = 0;
    private routeTotalMs: number = 0;
    private routeStartAtMs: number = 0;

    private velX: number = 0;
    private velY: number = 0;
    private moving: boolean = false;
    private targetX: number = 0;
    private targetY: number = 0;
    private timeLeft: number = 0;

    private lastFacingX: number = 0;

    constructor(_scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
    }

    /**
     * Start the ship along a polyline. The polyline is origin + waypoints + destination
     * in pixel space. The ship moves at constant speed along the total polyline length,
     * arriving at the destination after totalMs.
     */
    setRoute(
        polyline: Point[],
        elapsedMs: number,
        totalMs: number,
        alignStart: boolean = false,
        startDelayMs: number = 0,
    ) {
        if (polyline.length < 2) return;

        const safeTotalMs = Math.max(1, totalMs);
        const safeElapsedMs = Math.max(0, Math.min(safeTotalMs, elapsedMs));
        const safeStartDelayMs = Math.max(0, startDelayMs);

        const segments: Segment[] = [];
        let cumulative = 0;
        for (let i = 0; i < polyline.length - 1; i++) {
            const a = polyline[i];
            const b = polyline[i + 1];
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            cumulative += length;
            segments.push({
                startX: a.x,
                startY: a.y,
                endX: b.x,
                endY: b.y,
                length,
                cumulativeEnd: cumulative,
            });
        }
        const totalLength = cumulative;
        if (totalLength <= 0) {
            this.teleport(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y);
            return;
        }

        this.routeActive = true;
        this.routeSegments = segments;
        this.routeTotalLength = totalLength;
        this.routeTotalMs = safeTotalMs;
        this.routeStartAtMs = performance.now() + safeStartDelayMs - safeElapsedMs;

        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;

        if (alignStart) {
            const progress = safeElapsedMs / safeTotalMs;
            const pos = this.positionAtProgress(progress);
            this.sprite.setPosition(pos.x, pos.y);
            this.updateFacing(pos.x);
        }
    }

    moveTo(x: number, y: number, duration: number) {
        this.routeActive = false;
        this.routeSegments = [];
        this.routeTotalLength = 0;

        this.updateFacing(x);

        const dx = x - this.sprite.x;
        const dy = y - this.sprite.y;
        const distance = Math.hypot(dx, dy);

        this.targetX = x;
        this.targetY = y;

        if (distance <= Ship.ARRIVAL_EPSILON_PX) {
            this.teleport(x, y);
            return;
        }

        const safeDuration = Math.max(duration, Ship.MIN_MOVE_DURATION_MS);
        if (safeDuration > 0) {
            this.velX = dx / safeDuration;
            this.velY = dy / safeDuration;
            this.timeLeft = safeDuration;
            this.moving = true;
        } else {
            this.teleport(x, y);
        }
    }

    update(delta: number) {
        if (this.routeActive) {
            const elapsed = performance.now() - this.routeStartAtMs;
            const progress = Math.max(0, Math.min(1, elapsed / this.routeTotalMs));
            const pos = this.positionAtProgress(progress);
            this.updateFacing(pos.x);
            this.sprite.setPosition(pos.x, pos.y);
            if (progress >= 1) {
                const last = this.routeSegments[this.routeSegments.length - 1];
                this.teleport(last.endX, last.endY);
            }
            return;
        }

        if (!this.moving) return;

        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.teleport(this.targetX, this.targetY);
        } else {
            this.sprite.x += this.velX * delta;
            this.sprite.y += this.velY * delta;
        }
    }

    teleport(x: number, y: number) {
        this.routeActive = false;
        this.routeSegments = [];
        this.routeTotalLength = 0;
        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;
        this.sprite.setPosition(x, y);
    }

    getSpeedPxPerMs() {
        if (this.routeActive && this.routeTotalMs > 0) {
            return this.routeTotalLength / this.routeTotalMs;
        }
        return Math.hypot(this.velX, this.velY);
    }

    rescale(scaleX: number, scaleY: number) {
        this.sprite.x *= scaleX;
        this.sprite.y *= scaleY;
        this.targetX *= scaleX;
        this.targetY *= scaleY;
        this.velX *= scaleX;
        this.velY *= scaleY;
        let cumulative = 0;
        for (const seg of this.routeSegments) {
            seg.startX *= scaleX;
            seg.startY *= scaleY;
            seg.endX *= scaleX;
            seg.endY *= scaleY;
            seg.length = Math.hypot(seg.endX - seg.startX, seg.endY - seg.startY);
            cumulative += seg.length;
            seg.cumulativeEnd = cumulative;
        }
        this.routeTotalLength = cumulative;
    }


    private positionAtProgress(progress: number): Point {
        if (this.routeSegments.length === 0 || this.routeTotalLength <= 0) {
            return { x: this.sprite.x, y: this.sprite.y };
        }
        const targetDistance = progress * this.routeTotalLength;
        let prevCumulative = 0;
        for (const seg of this.routeSegments) {
            if (targetDistance <= seg.cumulativeEnd || seg === this.routeSegments[this.routeSegments.length - 1]) {
                const within = seg.length > 0
                    ? (targetDistance - prevCumulative) / seg.length
                    : 0;
                const t = Math.max(0, Math.min(1, within));
                return {
                    x: seg.startX + (seg.endX - seg.startX) * t,
                    y: seg.startY + (seg.endY - seg.startY) * t,
                };
            }
            prevCumulative = seg.cumulativeEnd;
        }
        const last = this.routeSegments[this.routeSegments.length - 1];
        return { x: last.endX, y: last.endY };
    }

    private updateFacing(targetX: number) {
        const dx = targetX - this.sprite.x;
        if (Math.abs(dx) > 0.5) {
            const facing = dx < 0 ? -1 : 1;
            if (facing !== this.lastFacingX) {
                this.sprite.setFlipX(facing < 0);
                this.lastFacingX = facing;
            }
        }
    }
}
