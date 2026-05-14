import Phaser from "phaser";

export class RatSpawner {
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    spawnRat(onHit: () => void): Phaser.GameObjects.Image {
        const spawnPoint = this.getRandomDeckPoint();
        const x = spawnPoint.x;
        const y = spawnPoint.y;

        const rat = this.scene.add.image(x, y, "rat-minigame-rat");
        rat.setDisplaySize(110, 90);
        rat.setInteractive({ useHandCursor: false });
        this.moveRatLoop(rat);

        rat.on("pointerdown", () => {
            onHit();
            rat.destroy();
        });

        return rat;
    }

    private getRandomDeckPoint(): Phaser.Math.Vector2 {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        // Perspective-aware trapezoid on the wooden deck only.
        // Top deck line is narrower; bottom deck line is wider.
        const minY = Math.floor(height * 0.50);
        const maxY = Math.floor(height * 0.88);
        const y = Phaser.Math.Between(minY, Math.max(minY, maxY));

        const t = (y - minY) / Math.max(1, (maxY - minY));
        const minXTop = width * 0.38;
        const maxXTop = width * 0.62;
        const minXBottom = width * 0.22;
        const maxXBottom = width * 0.78;

        const minX = Math.floor(Phaser.Math.Linear(minXTop, minXBottom, t));
        const maxX = Math.floor(Phaser.Math.Linear(maxXTop, maxXBottom, t));

        return new Phaser.Math.Vector2(
            Phaser.Math.Between(minX, Math.max(minX, maxX)),
            y,
        );
    }

    private moveRatLoop(rat: Phaser.GameObjects.Image) {
        if (!rat.active) return;

        const target = this.getRandomDeckPoint();
        const distance = Phaser.Math.Distance.Between(rat.x, rat.y, target.x, target.y);
        const duration = Phaser.Math.Clamp(distance * 14, 700, 2200);

        this.scene.tweens.add({
            targets: rat,
            x: target.x,
            y: target.y,
            duration,
            ease: "Sine.easeInOut",
            onComplete: () => {
                if (!rat.active) return;
                this.moveRatLoop(rat);
            },
        });
    }
}
