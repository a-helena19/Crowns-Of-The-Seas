import Phaser from "phaser";

export interface FallingHazard {
    view: Phaser.GameObjects.Image;
    speed: number;
}

export class StormHazardSpawner {
    private readonly scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    spawnLightning(): FallingHazard {
        const x = Phaser.Math.Between(20, this.scene.scale.width - 20);
        const y = -30;
        const bolt = this.scene.add.image(x, y, "storm-lightning")
            .setDisplaySize(36, 64);
        return {
            view: bolt,
            speed: Phaser.Math.Between(360, 520),
        };
    }
}
