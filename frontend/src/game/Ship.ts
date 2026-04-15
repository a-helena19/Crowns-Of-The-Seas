export default class Ship {
    private sprite: Phaser.GameObjects.Sprite;
    private velX: number = 0;
    private velY: number = 0;
    private moving: boolean = false;
    private targetX: number = 0;
    private targetY: number = 0;
    private timeLeft: number = 0;

    constructor(_scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
    }

    /** Start animating from origin→dest, placing the ship at the correct mid-route position. */
    setRoute(
        originX: number, originY: number,
        destX: number, destY: number,
        elapsedMs: number, totalMs: number,
    ) {
        const progress = Math.max(0, Math.min(1, elapsedMs / totalMs));
        const startX = originX + (destX - originX) * progress;
        const startY = originY + (destY - originY) * progress;
        this.sprite.setPosition(startX, startY);
        this.sprite.setFlipX(destX < startX);

        const remaining = totalMs - elapsedMs;
        if (remaining > 0) {
            this.targetX = destX;
            this.targetY = destY;
            this.velX = (destX - startX) / remaining;
            this.velY = (destY - startY) / remaining;
            this.timeLeft = remaining;
            this.moving = true;
        } else {
            this.teleport(destX, destY);
        }
    }

    moveTo(x: number, y: number, duration: number) {
        this.sprite.setFlipX(x < this.sprite.x);

        // Berechne die Gesamtdistanz auf den X- und Y-Achsen
        const dx = x - this.sprite.x;
        const dy = y - this.sprite.y;

        this.targetX = x;
        this.targetY = y;

        if (duration > 0) {
            // Berechne die Geschwindigkeit (Pixel pro Zeiteinheit)
            // Formel: Geschwindigkeit = Distanz / Zeit (v = d / t)
            this.velX = dx / duration;
            this.velY = dy / duration;
            this.timeLeft = duration;
            this.moving = true;
        } else {
            this.teleport(x, y);
        }
    }

    update(delta: number) {
        if (!this.moving) return;

        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.teleport(this.targetX, this.targetY);
        } else {
            // Aktualisiere die Position basierend auf der vergangenen Zeit (delta)
            // Formel: Neue Position = Aktuelle Position + (Geschwindigkeit * vergangene Zeit)
            this.sprite.x += this.velX * delta;
            this.sprite.y += this.velY * delta;
        }
    }

    teleport(x: number, y: number) {
        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.sprite.setPosition(x, y);
    }
}
