/**
 * Pixel-based water/land detection from harbor background images.
 * Water pixels are blue-dominant; brown/grey pier and quay pixels block navigation.
 */
export class HarborTerrainMask {
    private data: Uint8ClampedArray | null = null;
    private width = 0;
    private height = 0;

    static fromImageSource(source: CanvasImageSource): HarborTerrainMask | null {
        const mask = new HarborTerrainMask();
        if (!mask.load(source)) return null;
        return mask;
    }

    private load(source: CanvasImageSource): boolean {
        const canvas = document.createElement('canvas');
        const w = 'naturalWidth' in source ? source.naturalWidth : (source as HTMLCanvasElement).width;
        const h = 'naturalHeight' in source ? source.naturalHeight : (source as HTMLCanvasElement).height;
        if (!w || !h) return false;

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        ctx.drawImage(source, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        this.data = imageData.data;
        this.width = w;
        this.height = h;
        return true;
    }

    get isReady(): boolean {
        return this.data !== null && this.width > 0 && this.height > 0;
    }

    /** Normalised coords (0–1). Returns true if pixel is navigable water. */
    isWater(xNorm: number, yNorm: number): boolean {
        if (!this.data) return false;

        const px = Math.min(this.width - 1, Math.max(0, Math.floor(xNorm * this.width)));
        const py = Math.min(this.height - 1, Math.max(0, Math.floor(yNorm * this.height)));
        const i = (py * this.width + px) * 4;
        const r = this.data[i];
        const g = this.data[i + 1];
        const b = this.data[i + 2];

        return b > r + 15 && b > g + 8 && b > 80;
    }

    /**
     * Check ship circle at world-normalised position.
     * radiusNorm is relative to canvas height.
     */
    isNavigable(xNorm: number, yNorm: number, radiusNorm: number): boolean {
        const points = [
            { x: xNorm, y: yNorm },
            { x: xNorm + radiusNorm, y: yNorm },
            { x: xNorm - radiusNorm, y: yNorm },
            { x: xNorm, y: yNorm + radiusNorm },
            { x: xNorm, y: yNorm - radiusNorm },
            { x: xNorm + radiusNorm * 0.7, y: yNorm + radiusNorm * 0.7 },
            { x: xNorm - radiusNorm * 0.7, y: yNorm + radiusNorm * 0.7 },
            { x: xNorm + radiusNorm * 0.7, y: yNorm - radiusNorm * 0.7 },
            { x: xNorm - radiusNorm * 0.7, y: yNorm - radiusNorm * 0.7 },
        ];

        return points.every(p => this.isWater(p.x, p.y));
    }

    /** Spiral search for nearest water pixel from a normalised start point. */
    findNearestWater(xNorm: number, yNorm: number, maxRadiusNorm = 0.15): { x: number; y: number } | null {
        if (this.isWater(xNorm, yNorm)) return { x: xNorm, y: yNorm };

        const steps = 24;
        for (let ring = 1; ring <= 12; ring++) {
            const r = (ring / 12) * maxRadiusNorm;
            for (let s = 0; s < steps; s++) {
                const angle = (s / steps) * Math.PI * 2;
                const x = xNorm + Math.cos(angle) * r;
                const y = yNorm + Math.sin(angle) * r;
                if (x < 0.02 || x > 0.98 || y < 0.02 || y > 0.98) continue;
                if (this.isWater(x, y)) return { x, y };
            }
        }
        return null;
    }

    /**
     * Spiral search for the nearest position where the full ship circle fits in water.
     * Unlike findNearestWater (single pixel), this checks isNavigable (9 points at radiusNorm).
     * Needed for departure spawn so the ship doesn't immediately collide at the dock edge.
     */
    findNearestNavigable(
        xNorm: number,
        yNorm: number,
        radiusNorm: number,
        maxRadiusNorm = 0.20,
    ): { x: number; y: number } | null {
        if (this.isNavigable(xNorm, yNorm, radiusNorm)) return { x: xNorm, y: yNorm };

        const steps = 24;
        for (let ring = 1; ring <= 16; ring++) {
            const r = (ring / 16) * maxRadiusNorm;
            for (let s = 0; s < steps; s++) {
                const angle = (s / steps) * Math.PI * 2;
                const x = xNorm + Math.cos(angle) * r;
                const y = yNorm + Math.sin(angle) * r;
                if (x < 0.02 || x > 0.98 || y < 0.02 || y > 0.98) continue;
                if (this.isNavigable(x, y, radiusNorm)) return { x, y };
            }
        }
        return null;
    }

    /** Debug overlay: downsampled green/red grid drawn onto a canvas. */
    buildDebugCanvas(downsample = 8): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(this.width / downsample);
        canvas.height = Math.ceil(this.height / downsample);
        const ctx = canvas.getContext('2d')!;
        const imgData = ctx.createImageData(canvas.width, canvas.height);

        for (let py = 0; py < canvas.height; py++) {
            for (let px = 0; px < canvas.width; px++) {
                const xNorm = (px * downsample + downsample / 2) / this.width;
                const yNorm = (py * downsample + downsample / 2) / this.height;
                const water = this.isWater(xNorm, yNorm);
                const i = (py * canvas.width + px) * 4;
                imgData.data[i] = water ? 46 : 231;
                imgData.data[i + 1] = water ? 204 : 76;
                imgData.data[i + 2] = water ? 113 : 60;
                imgData.data[i + 3] = 140;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return canvas;
    }
}
