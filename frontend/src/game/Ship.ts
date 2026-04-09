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
