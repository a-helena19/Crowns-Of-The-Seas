import Phaser from "phaser";
import type { ObstacleRouteViewType } from "./ObstacleMinigameTypes";

export interface MovingObstacle {
    view: Phaser.Physics.Arcade.Image;
    driftBaseY: number;
    wobbleAmplitudePx: number;
    wobbleSpeed: number;
    wobblePhase: number;
}

export class ObstacleSpawner {
    private readonly scene: Phaser.Scene;
    private readonly textureKeys: string[] = [
        "obstacle-rettungsring",
        "obstacle-wrack",
        "obstacle-bretter",
        "obstacle-fass",
    ];

    constructor(scene: Phaser.Scene, routeViewType: ObstacleRouteViewType) {
        this.scene = scene;
        void routeViewType;
    }

    ensureTexture() {
        // Textures are loaded in scene.preload(). Keep method as hook for API symmetry.
        void this.scene;
    }

    spawn(): MovingObstacle {
        const textureKey = Phaser.Utils.Array.GetRandom(this.textureKeys);
        const x = this.scene.scale.width + 50;
        const baseY = Phaser.Math.Between(90, this.scene.scale.height - 90);
        const obstacle = this.scene.physics.add.image(x, baseY, textureKey);

        const size = this.pickSizeForTexture(textureKey);
        obstacle.setDisplaySize(size.width, size.height);
        obstacle.setImmovable(true);
        obstacle.setDepth(4);
        (obstacle.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
        obstacle.setVelocityX(-Phaser.Math.Between(95, 150));

        return {
            view: obstacle,
            driftBaseY: baseY,
            wobbleAmplitudePx: Phaser.Math.FloatBetween(4, 10),
            wobbleSpeed: Phaser.Math.FloatBetween(0.0025, 0.0048),
            wobblePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        };
    }

    private pickSizeForTexture(textureKey: string): { width: number; height: number } {
        if (textureKey === "obstacle-wrack") {
            return {
                width: Phaser.Math.Between(98, 132),
                height: Phaser.Math.Between(58, 82),
            };
        }
        if (textureKey === "obstacle-rettungsring") {
            return {
                width: Phaser.Math.Between(34, 48),
                height: Phaser.Math.Between(34, 48),
            };
        }
        if (textureKey === "obstacle-fass") {
            return {
                width: Phaser.Math.Between(42, 58),
                height: Phaser.Math.Between(42, 62),
            };
        }
        return {
            width: Phaser.Math.Between(54, 82),
            height: Phaser.Math.Between(36, 58),
        };
    }
}
