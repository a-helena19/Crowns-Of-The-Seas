import Phaser from "phaser";

interface ShipArcadeControllerOptions {
    maxSpeed?: number;
    acceleration?: number;
    deceleration?: number;
}

export class ShipArcadeController {
    private readonly shipBody: Phaser.Physics.Arcade.Image;
    private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private readonly wasd: {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
    };

    private vx = 0;
    private vy = 0;

    private readonly maxSpeed: number;
    private readonly acceleration: number;
    private readonly deceleration: number;

    constructor(scene: Phaser.Scene, shipBody: Phaser.Physics.Arcade.Image, options: ShipArcadeControllerOptions = {}) {
        this.shipBody = shipBody;
        this.maxSpeed = options.maxSpeed ?? 120;
        this.acceleration = options.acceleration ?? 150;
        this.deceleration = options.deceleration ?? 180;

        this.cursors = scene.input.keyboard!.createCursorKeys();
        this.wasd = {
            up: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
    }

    update(deltaMs: number) {
        const dt = deltaMs / 1000;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;

        if (left) this.vx = Math.max(this.vx - this.acceleration * dt, -this.maxSpeed);
        else if (right) this.vx = Math.min(this.vx + this.acceleration * dt, this.maxSpeed);
        else this.vx = this.decelerate(this.vx, this.deceleration * dt);

        if (up) this.vy = Math.max(this.vy - this.acceleration * dt, -this.maxSpeed);
        else if (down) this.vy = Math.min(this.vy + this.acceleration * dt, this.maxSpeed);
        else this.vy = this.decelerate(this.vy, this.deceleration * dt);

        this.shipBody.setVelocity(this.vx, this.vy);
    }

    stop() {
        this.vx = 0;
        this.vy = 0;
        this.shipBody.setVelocity(0, 0);
    }

    private decelerate(value: number, amount: number) {
        if (value > 0) return Math.max(0, value - amount);
        if (value < 0) return Math.min(0, value + amount);
        return 0;
    }
}
