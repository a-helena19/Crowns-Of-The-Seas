import Phaser from "phaser";

export interface FallingCollectible {
    view: Phaser.GameObjects.Image;
    speed: number;
}

export class StormCollectibleSpawner {
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    spawnSun(): FallingCollectible {
        const x = Phaser.Math.Between(24, this.scene.scale.width - 24);
        const y = -24;
        const sun = this.scene.add.image(x, y, "storm-sun")
            .setDisplaySize(62, 62);
        return {
            view: sun,
            speed: Phaser.Math.Between(220, 360),
        };
    }
}
