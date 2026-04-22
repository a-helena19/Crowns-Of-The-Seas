export default class Ship {
    private static readonly MIN_MOVE_DURATION_MS = 80;
    private static readonly ARRIVAL_EPSILON_PX = 0.5;
    private sprite: Phaser.GameObjects.Sprite;
    private routeActive: boolean = false;
    private routeOriginX: number = 0;
    private routeOriginY: number = 0;
    private routeDestX: number = 0;
    private routeDestY: number = 0;
    private routeTotalMs: number = 0;
    private routeStartAtMs: number = 0;
    private velX: number = 0;
    private velY: number = 0;
    private moving: boolean = false;
    private targetX: number = 0;
    private targetY: number = 0;
    private timeLeft: number = 0;

    constructor(_scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
    }

    /** Start a route from the current known server position towards the destination. */
    setRoute(
        originX: number, originY: number,
        destX: number, destY: number,
        elapsedMs: number,
        totalMs: number,
        alignStart: boolean = false,
    ) {
        const safeTotalMs = Math.max(1, totalMs);
        const safeElapsedMs = Math.max(0, Math.min(safeTotalMs, elapsedMs));

        this.routeActive = true;
        this.routeOriginX = originX;
        this.routeOriginY = originY;
        this.routeDestX = destX;
        this.routeDestY = destY;
        this.routeTotalMs = safeTotalMs;
        this.routeStartAtMs = performance.now() - safeElapsedMs;

        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;

        if (alignStart) {
            const progress = safeElapsedMs / safeTotalMs;
            this.sprite.setPosition(
                originX + (destX - originX) * progress,
                originY + (destY - originY) * progress,
            );
        }
        this.sprite.setFlipX(destX < this.sprite.x);
    }

    moveTo(x: number, y: number, duration: number) {
        this.routeActive = false;
        this.sprite.setFlipX(x < this.sprite.x);

        const dx = x - this.sprite.x;
        const dy = y - this.sprite.y;
        const distance = Math.hypot(dx, dy);

        this.targetX = x;
        this.targetY = y;

        // Prevent hard jumps when duration is near zero but we still have visible distance left.
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
            this.sprite.setPosition(
                this.routeOriginX + (this.routeDestX - this.routeOriginX) * progress,
                this.routeOriginY + (this.routeDestY - this.routeOriginY) * progress,
            );
            if (progress >= 1) {
                this.teleport(this.routeDestX, this.routeDestY);
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
        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;
        this.sprite.setPosition(x, y);
    }

    getSpeedPxPerMs() {
        if (this.routeActive && this.routeTotalMs > 0) {
            const distance = Math.hypot(this.routeDestX - this.routeOriginX, this.routeDestY - this.routeOriginY);
            return distance / this.routeTotalMs;
        }
        return Math.hypot(this.velX, this.velY);
    }

    rescale(scaleX: number, scaleY: number) {
        this.sprite.x *= scaleX;
        this.sprite.y *= scaleY;
        this.routeOriginX *= scaleX;
        this.routeOriginY *= scaleY;
        this.routeDestX *= scaleX;
        this.routeDestY *= scaleY;
        this.targetX *= scaleX;
        this.targetY *= scaleY;
        this.velX *= scaleX;
        this.velY *= scaleY;
    }
}
