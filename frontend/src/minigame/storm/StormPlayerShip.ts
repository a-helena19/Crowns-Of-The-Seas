import Phaser from "phaser";

export class StormPlayerShip {
    readonly sprite: Phaser.GameObjects.Image;
    private readonly boundsWidth: number;
    private readonly moveHalfWidth: number;
    private targetX: number;
    private readonly speedPxPerSec = 520;
    private readonly keyA?: Phaser.Input.Keyboard.Key;
    private readonly keyD?: Phaser.Input.Keyboard.Key;
    private readonly keyLeft?: Phaser.Input.Keyboard.Key;
    private readonly keyRight?: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, textureKey: string) {
        const y = scene.scale.height - 80;
        this.sprite = scene.add.image(scene.scale.width * 0.5, y, textureKey)
            .setDisplaySize(120, 70);
        this.boundsWidth = scene.scale.width;
        // Use a smaller effective half-width so ships with transparent sprite padding
        // can still move visually all the way to the screen edge.
        this.moveHalfWidth = this.sprite.displayWidth * 0.28;
        this.targetX = this.sprite.x;

        this.keyA = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyLeft = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.keyRight = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    }

    update(deltaMs: number) {
        const step = this.speedPxPerSec * (deltaMs / 1000);
        const leftPressed = this.keyA?.isDown === true || this.keyLeft?.isDown === true;
        const rightPressed = this.keyD?.isDown === true || this.keyRight?.isDown === true;

        if (leftPressed && !rightPressed) {
            this.targetX = Math.max(this.moveHalfWidth, this.targetX - step);
        } else if (rightPressed && !leftPressed) {
            this.targetX = Math.min(this.boundsWidth - this.moveHalfWidth, this.targetX + step);
        }

        this.sprite.x = Phaser.Math.Linear(
            this.sprite.x,
            this.targetX,
            Math.min(1, step / Math.max(1, Math.abs(this.targetX - this.sprite.x)))
        );
    }
}
