interface Point {
    x: number;
    y: number;
}

interface Segment {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    length: number;
    cumulativeEnd: number;
    wrap?: boolean;
}

export default class Ship {
    private static readonly MIN_MOVE_DURATION_MS = 80;
    private static readonly ARRIVAL_EPSILON_PX = 0.5;
    private sprite: Phaser.GameObjects.Sprite;

    private routeActive: boolean = false;
    private routeSegments: Segment[] = [];
    private routeTotalLength: number = 0;
    private routeTotalMs: number = 0;
    private routeStartAtMs: number = 0;

    private velX: number = 0;
    private velY: number = 0;
    private moving: boolean = false;
    private targetX: number = 0;
    private targetY: number = 0;
    private timeLeft: number = 0;

    private lastFacingX: number = 0;
    private mapWidth: number = 0;

    constructor(_scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
    }

    setMapWidth(width: number) {
        this.mapWidth = width;
    }

    setRoute(
        polyline: Point[],
        elapsedMs: number,
        totalMs: number,
        alignStart: boolean = false,
        startDelayMs: number = 0,
        continueFromCurrentPosition: boolean = false,
    ) {
        if (polyline.length < 2) return;

        const safeTotalMs = Math.max(1, totalMs);
        const safeElapsedMs = Math.max(0, Math.min(safeTotalMs, elapsedMs));
        const safeStartDelayMs = Math.max(0, startDelayMs);

        const { routeSegments: segments, totalLength } = this.buildSegments(polyline);
        if (totalLength <= 0) {
            this.teleport(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y);
            return;
        }

        this.routeActive = true;
        this.routeSegments = segments;
        this.routeTotalLength = totalLength;
        this.routeTotalMs = safeTotalMs;

        let effectiveElapsedMs = safeElapsedMs;
        if (continueFromCurrentPosition) {
            const projectedDistance = this.projectDistanceOnRoute(this.sprite.x, this.sprite.y);
            const projectedElapsedMs = (projectedDistance / totalLength) * safeTotalMs;
            // Prevent forward jump after a pause by continuing from the visible ship position.
            effectiveElapsedMs = Math.min(safeElapsedMs, Math.max(0, Math.min(safeTotalMs, projectedElapsedMs)));
        }

        this.routeStartAtMs = performance.now() + safeStartDelayMs - effectiveElapsedMs;

        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;

        if (alignStart && !continueFromCurrentPosition) {
            const progress = effectiveElapsedMs / safeTotalMs;
            const pos = this.positionAtProgress(progress);
            this.sprite.setPosition(pos.x, pos.y);
            this.updateFacing(pos.x);
        }
    }

    moveTo(x: number, y: number, duration: number) {
        this.routeActive = false;
        this.routeSegments = [];
        this.routeTotalLength = 0;

        this.updateFacing(x);

        const dx = x - this.sprite.x;
        const dy = y - this.sprite.y;
        const distance = Math.hypot(dx, dy);

        this.targetX = x;
        this.targetY = y;

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

    finishRouteFromCurrentPosition(polyline: Point[], remainingMs: number) {
        if (polyline.length < 2) return;

        const { routeSegments, totalLength } = this.buildSegments(polyline);
        if (totalLength <= 0) {
            this.teleport(polyline[polyline.length - 1].x, polyline[polyline.length - 1].y);
            return;
        }

        this.routeActive = true;
        this.routeSegments = routeSegments;
        this.routeTotalLength = totalLength;

        const projectedDistance = this.projectDistanceOnRoute(this.sprite.x, this.sprite.y);
        const progress = Math.max(0, Math.min(0.995, projectedDistance / totalLength));
        const safeRemainingMs = Math.max(Ship.MIN_MOVE_DURATION_MS, remainingMs);
        this.routeTotalMs = safeRemainingMs / Math.max(0.005, 1 - progress);
        this.routeStartAtMs = performance.now() - (progress * this.routeTotalMs);

        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;
    }

    isMoving() {
        return this.routeActive || this.moving;
    }

    update(delta: number) {
        if (this.routeActive) {
            const elapsed = performance.now() - this.routeStartAtMs;
            const progress = Math.max(0, Math.min(1, elapsed / this.routeTotalMs));
            const pos = this.positionAtProgress(progress);
            this.updateFacing(pos.x);
            this.sprite.setPosition(pos.x, pos.y);
            if (progress >= 1) {
                const last = this.routeSegments[this.routeSegments.length - 1];
                this.teleport(last.endX, last.endY);
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
        this.routeSegments = [];
        this.routeTotalLength = 0;
        this.velX = 0;
        this.velY = 0;
        this.moving = false;
        this.timeLeft = 0;
        this.sprite.setPosition(x, y);
    }

    getSpeedPxPerMs() {
        if (this.routeActive && this.routeTotalMs > 0) {
            return this.routeTotalLength / this.routeTotalMs;
        }
        return Math.hypot(this.velX, this.velY);
    }

    rescale(scaleX: number, scaleY: number) {
        this.sprite.x *= scaleX;
        this.sprite.y *= scaleY;
        this.targetX *= scaleX;
        this.targetY *= scaleY;
        this.velX *= scaleX;
        this.velY *= scaleY;
        this.mapWidth *= scaleX;
        let cumulative = 0;
        for (const seg of this.routeSegments) {
            seg.startX *= scaleX;
            seg.startY *= scaleY;
            seg.endX *= scaleX;
            seg.endY *= scaleY;
            if (seg.wrap && this.mapWidth > 0) {
                const dx = Math.abs(seg.endX - seg.startX);
                seg.length = Math.hypot(this.mapWidth - dx, seg.endY - seg.startY);
            } else {
                seg.length = Math.hypot(seg.endX - seg.startX, seg.endY - seg.startY);
            }
            cumulative += seg.length;
            seg.cumulativeEnd = cumulative;
        }
        this.routeTotalLength = cumulative;
    }


    private positionAtProgress(progress: number): Point {
        if (this.routeSegments.length === 0 || this.routeTotalLength <= 0) {
            return { x: this.sprite.x, y: this.sprite.y };
        }
        const targetDistance = progress * this.routeTotalLength;
        let prevCumulative = 0;
        for (const seg of this.routeSegments) {
            if (targetDistance <= seg.cumulativeEnd || seg === this.routeSegments[this.routeSegments.length - 1]) {
                const within = seg.length > 0
                    ? (targetDistance - prevCumulative) / seg.length
                    : 0;
                const t = Math.max(0, Math.min(1, within));

                if (seg.wrap && this.mapWidth > 0) {
                    // Ship leaves the nearer edge and re-enters from the opposite edge.
                    const exitLeft = seg.startX <= (this.mapWidth - seg.startX);
                    const startEdgeX = exitLeft ? 0 : this.mapWidth;
                    const enterEdgeX = exitLeft ? this.mapWidth : 0;

                    const firstLen = Math.abs(seg.startX - startEdgeX);
                    const secondLen = Math.abs(enterEdgeX - seg.endX);
                    const distIntoSeg = t * (firstLen + secondLen);
                    const y = seg.startY + (seg.endY - seg.startY) * t;

                    if (firstLen + secondLen <= 0) {
                        return { x: seg.endX, y: seg.endY };
                    }
                    if (distIntoSeg <= firstLen) {
                        const tt = firstLen > 0 ? distIntoSeg / firstLen : 1;
                        return { x: seg.startX + (startEdgeX - seg.startX) * tt, y };
                    }
                    const tt = secondLen > 0 ? (distIntoSeg - firstLen) / secondLen : 1;
                    return { x: enterEdgeX + (seg.endX - enterEdgeX) * tt, y };
                }

                return {
                    x: seg.startX + (seg.endX - seg.startX) * t,
                    y: seg.startY + (seg.endY - seg.startY) * t,
                };
            }
            prevCumulative = seg.cumulativeEnd;
        }
        const last = this.routeSegments[this.routeSegments.length - 1];
        return { x: last.endX, y: last.endY };
    }

    private buildSegments(polyline: Point[]) {
        const routeSegments: Segment[] = [];
        let cumulative = 0;
        const wrapThreshold = this.mapWidth > 0 ? this.mapWidth * 0.6 : Number.POSITIVE_INFINITY;
        for (let i = 0; i < polyline.length - 1; i++) {
            const a = polyline[i];
            const b = polyline[i + 1];
            const dx = Math.abs(b.x - a.x);
            const isWrap = dx > wrapThreshold;
            const dy = b.y - a.y;
            const length = isWrap
                ? Math.hypot(this.mapWidth - dx, dy)
                : Math.hypot(b.x - a.x, dy);
            cumulative += length;
            routeSegments.push({
                startX: a.x,
                startY: a.y,
                endX: b.x,
                endY: b.y,
                length,
                cumulativeEnd: cumulative,
                wrap: isWrap,
            });
        }
        return { routeSegments, totalLength: cumulative };
    }

    private projectDistanceOnRoute(px: number, py: number): number {
        if (this.routeSegments.length === 0 || this.routeTotalLength <= 0) return 0;
        let bestDistanceSq = Number.POSITIVE_INFINITY;
        let bestProjected = 0;
        let cumulativeBefore = 0;

        for (const seg of this.routeSegments) {
            const vx = seg.endX - seg.startX;
            const vy = seg.endY - seg.startY;
            const lenSq = vx * vx + vy * vy;
            let t = 0;
            if (lenSq > 1e-9) {
                t = ((px - seg.startX) * vx + (py - seg.startY) * vy) / lenSq;
                t = Math.max(0, Math.min(1, t));
            }

            const projX = seg.startX + vx * t;
            const projY = seg.startY + vy * t;
            const dx = px - projX;
            const dy = py - projY;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < bestDistanceSq) {
                bestDistanceSq = distanceSq;
                bestProjected = cumulativeBefore + seg.length * t;
            }

            cumulativeBefore = seg.cumulativeEnd;
        }

        return Math.max(0, Math.min(this.routeTotalLength, bestProjected));
    }

    private updateFacing(targetX: number) {
        const dx = targetX - this.sprite.x;
        if (this.mapWidth > 0 && Math.abs(dx) > this.mapWidth * 0.5) {
            // Wrap jump across the map edge — keep current facing.
            return;
        }
        if (Math.abs(dx) > 0.5) {
            const facing = dx < 0 ? -1 : 1;
            if (facing !== this.lastFacingX) {
                this.sprite.setFlipX(facing < 0);
                this.lastFacingX = facing;
            }
        }
    }
}