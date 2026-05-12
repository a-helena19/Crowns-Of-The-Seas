import { useEffect, useRef } from "react";
import harborBg from "../assets/harbor_dock.png";
import pilotBoatImg from "../assets/Pilot_Boat.png";

interface Props {
    shipIconUrl: string;
    onComplete: () => void;
}

type Foam = { x: number; y: number; vx: number; vy: number; life: number; r: number };

/** Keep in sync with `DEPARTURE_ANIMATION_MS` in `StartTravelServiceImpl` (pilotage travel start delay). */
export const DEPARTURE_ANIMATION_DURATION_MS = 3000;

// Starting position in open water (south-east of the pier; normalized 0–1 on harbor_dock.png)
const START_X = 0.74;
const START_Y = 0.68;

// Movement direction toward open sea (bottom-right)
const DIR_X = 0.14;
const DIR_Y = 0.38;

// Pilot boat leads this many px ahead of the main ship (in screen space)
const LEAD = 120;

export default function DepartureAnimation({ shipIconUrl, onComplete }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        // Pre-load images
        const bgImg = new Image();
        bgImg.src = harborBg;
        const shipImg = new Image();
        shipImg.src = shipIconUrl;
        const pilotImg = new Image();
        pilotImg.src = pilotBoatImg;

        // Movement angle (radians) — used to orient boats
        const moveAngle = Math.atan2(DIR_Y, DIR_X);
        // Unit vector of movement direction
        const dirLen = Math.hypot(DIR_X, DIR_Y);
        const ux = DIR_X / dirLen;
        const uy = DIR_Y / dirLen;

        const foam: Foam[] = [];
        const spawnFoam = (x: number, y: number, side: number) => {
            foam.push({
                x: x + side * Math.cos(moveAngle + Math.PI / 2) * 8 + (Math.random() - 0.5) * 5,
                y: y + side * Math.sin(moveAngle + Math.PI / 2) * 8 + (Math.random() - 0.5) * 5,
                vx: (-ux * 18 + side * Math.cos(moveAngle + Math.PI / 2) * 10) * (Math.random() * 0.6 + 0.7),
                vy: (-uy * 18 + side * Math.sin(moveAngle + Math.PI / 2) * 10) * (Math.random() * 0.6 + 0.7),
                life: 1,
                r: Math.random() * 4 + 2,
            });
        };

        // Cover-fit: map image onto canvas
        const cover = () => {
            const iAR = bgImg.naturalWidth && bgImg.naturalHeight
                ? bgImg.naturalWidth / bgImg.naturalHeight
                : 1270 / 950;
            const cAR = W / H;
            let dw: number, dh: number, dx: number, dy: number;
            if (cAR > iAR) { dw = W; dh = W / iAR; dx = 0; dy = (H - dh) / 2; }
            else            { dh = H; dw = H * iAR; dx = (W - dw) / 2; dy = 0; }
            return { dx, dy, dw, dh };
        };

        const drawBoat = (img: HTMLImageElement, x: number, y: number, size: number, alpha: number, rock = 0) => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(x, y);
            ctx.rotate(moveAngle - Math.PI / 2 + rock);
            if (img.complete && img.naturalWidth > 0) {
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            }
            ctx.restore();
        };

        const startTime = performance.now();
        let lastTime = startTime;
        let animFrame: number;

        const draw = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            const t = Math.min((now - startTime) / DEPARTURE_ANIMATION_DURATION_MS, 1);

            ctx.clearRect(0, 0, W, H);

            // ── Background + camera ───────────────────────────────────
            const { dx, dy, dw, dh } = cover();

            // Progress 0→1 over full duration (no hold at start / no fade-out)
            const progress = t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;

            // Camera: start zoomed in on dock, pan gently with ships, zoom out
            const zoom = 1.55 - t * 0.55;
            const travelX = dw * DIR_X;
            const travelY = dh * DIR_Y;
            const baseX = dx + dw * START_X;
            const baseY = dy + dh * START_Y;
            const focusX = baseX + travelX * progress * 0.45;
            const focusY = baseY + travelY * progress * 0.45;

            ctx.save();
            ctx.translate(focusX, focusY);
            ctx.scale(zoom, zoom);
            ctx.translate(-focusX, -focusY);

            if (bgImg.complete && bgImg.naturalWidth > 0) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(bgImg, dx, dy, dw, dh);
            } else {
                ctx.fillStyle = "#2a6fa8";
                ctx.fillRect(0, 0, W, H);
            }

            // Vignette
            const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
            vig.addColorStop(0, "transparent");
            vig.addColorStop(1, "rgba(0,0,0,0.52)");
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();

            // ── Ship positions ────────────────────────────────────────
            const shipX = baseX + travelX * progress;
            const shipY = baseY + travelY * progress;

            // Pilot boat: LEAD px AHEAD in movement direction
            const leadScale = 0.5 + progress * 0.5;
            const pilotX = shipX + ux * LEAD * leadScale;
            const pilotY = shipY + uy * LEAD * leadScale;

            // Ship sizes — slightly shrink as they sail further
            const baseShipSize = Math.min(W, H) * 0.128;
            const shipSize  = baseShipSize * (1 - progress * 0.22);
            const pilotSize = baseShipSize * 0.66 * (1 - progress * 0.22);

            // ── Tow rope ──────────────────────────────────────────────
            if (progress > 0.01) {
                const ropeAlpha = Math.max(0, 1 - progress * 1.4);
                if (ropeAlpha > 0.01) {
                    const midX = (shipX + pilotX) / 2 + Math.sin(now * 0.003) * 3;
                    const midY = (shipY + pilotY) / 2 + Math.sin(now * 0.003) * 3 + 6;
                    ctx.save();
                    ctx.globalAlpha = ropeAlpha * 0.9;
                    ctx.strokeStyle = "#8b6914";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(pilotX, pilotY);
                    ctx.quadraticCurveTo(midX, midY, shipX, shipY);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // ── Foam / wake (spawns at stern, behind each ship) ───────
            if (progress > 0.02 && t < 1) {
                const shipSternX = shipX - ux * shipSize * 0.35;
                const shipSternY = shipY - uy * shipSize * 0.35;
                if (Math.random() < 0.55) {
                    spawnFoam(shipSternX, shipSternY, 1);
                    spawnFoam(shipSternX, shipSternY, -1);
                }
                const pilotSternX = pilotX - ux * pilotSize * 0.5;
                const pilotSternY = pilotY - uy * pilotSize * 0.5;
                if (Math.random() < 0.45) {
                    spawnFoam(pilotSternX, pilotSternY, 1);
                    spawnFoam(pilotSternX, pilotSternY, -1);
                }
            }

            for (let i = foam.length - 1; i >= 0; i--) {
                const f = foam[i];
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.life -= dt / 0.8;
                if (f.life <= 0) { foam.splice(i, 1); continue; }
                const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
                g.addColorStop(0, `rgba(255,255,255,${f.life * 0.85})`);
                g.addColorStop(1, "transparent");
                ctx.globalAlpha = f.life;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // ── Draw player ship (behind) ─────────────────────────────
            const rock = Math.sin(now * 0.005) * 0.04 * Math.max(0, 1 - progress * 4);
            drawBoat(shipImg, shipX, shipY, shipSize, 1, rock);

            // ── Draw pilot boat (in front) ────────────────────────────
            drawBoat(pilotImg, pilotX, pilotY, pilotSize, 1);

            // ── "LEINEN LOS!" text (full opacity while visible, no fade in/out) ──
            if (t > 0.04 && t < 0.96) {
                let spread: number;
                if      (t < 0.18) { const p = (t - 0.04) / 0.14; spread = 1 + p * 13; }
                else if (t < 0.72) {                                spread = 14; }
                else               { const p = (t - 0.72) / 0.24;  spread = 14 + p * 7; }

                ctx.save();
                ctx.globalAlpha = 1;
                const textY = H * 0.84;
                const fontSize = Math.min(Math.max(W * 0.042, 24), 44);
                ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
                ctx.textBaseline = "middle";

                const text = "LEINEN LOS!";
                const charW = fontSize * 0.62;
                const totalW = text.length * charW + (text.length - 1) * spread;
                let charX = W / 2 - totalW / 2 + charW / 2;

                ctx.fillStyle = "#2a1408";
                ctx.strokeStyle = "#2a1408";
                ctx.lineWidth = 5;
                for (const ch of text) {
                    ctx.strokeText(ch, charX, textY);
                    charX += charW + spread;
                }
                ctx.fillStyle = "#ffd060";
                ctx.shadowColor = "rgba(255,208,96,0.5)";
                ctx.shadowBlur = 14;
                charX = W / 2 - totalW / 2 + charW / 2;
                for (const ch of text) {
                    ctx.fillText(ch, charX, textY);
                    charX += charW + spread;
                }
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            ctx.globalAlpha = 1;

            if (t < 1) {
                animFrame = requestAnimationFrame(draw);
            } else {
                onCompleteRef.current();
            }
        };

        animFrame = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrame);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <canvas
            ref={canvasRef}
            style={{ position: "fixed", inset: 0, zIndex: 800, pointerEvents: "none" }}
        />
    );
}
