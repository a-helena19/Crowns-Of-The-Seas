import Phaser from "phaser";

export class ObstacleCollisionHandler {
    private lastHitAt = 0;
    private readonly damagePerHit: number;
    private readonly hitCooldownMs: number;

    constructor(damagePerHit = 20, hitCooldownMs = 700) {
        this.damagePerHit = damagePerHit;
        this.hitCooldownMs = hitCooldownMs;
    }

    handleCollision(scene: Phaser.Scene, ship: Phaser.Physics.Arcade.Image, obstacle: Phaser.Physics.Arcade.Image,
                    health: number): number {
        const now = scene.time.now;
        obstacle.destroy();
        if (now - this.lastHitAt < this.hitCooldownMs) return health;

        this.lastHitAt = now;
        ship.setTint(0xff6b6b);
        scene.cameras.main.shake(180, 0.008);
        scene.time.delayedCall(180, () => ship.clearTint());
        return Math.max(0, health - this.damagePerHit);
    }
}
