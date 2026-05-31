import { useEffect, useRef, useState } from "react";
import { getSmallMapPort, getSmallMapRoute } from "../game/SmallMapRouteData";

interface CargoRouteMapViewProps {
    fromPortName: string;
    toPortName: string;
    fromPortId?: string;
    toPortId?: string;
}


interface RouteWaypoint {
    x: number;
    y: number;
}

export default function CargoRouteMapView({
                                              fromPortName,
                                              toPortName,
                                          }: CargoRouteMapViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);

    useEffect(() => {
        setWaypoints(getSmallMapRoute(fromPortName, toPortName));
    }, [fromPortName, toPortName]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const from = getSmallMapPort(fromPortName);
        const to = getSmallMapPort(toPortName);

        const W = canvas.width;
        const H = canvas.height;

        const px = (xPct: number) => (xPct / 100) * W;
        const py = (yPct: number) => (yPct / 100) * H;
        ctx.clearRect(0, 0, W, H);

        const img = new Image();
        img.src = "/worldmap.jpg";
        img.onload = () => {
            ctx.drawImage(img, 0, 0, W, H);

            ctx.fillStyle = "rgba(232, 215, 160, 0.18)";
            ctx.fillRect(0, 0, W, H);

            if (!from || !to) return;

            const fullPath: RouteWaypoint[] = [
                from,
                ...waypoints,
                to,
            ];

            if (fullPath.length < 2) return;

            // Gerade Linien (kein Bezier). Bei Wrap-Spruengen (grosser x-Abstand)
            // wird die Linie unterbrochen, statt quer ueber die Karte gezogen zu werden.
            const WRAP_X_THRESHOLD = 60;
            ctx.save();
            ctx.shadowColor = "rgba(180, 30, 30, 0.55)";
            ctx.shadowBlur = 6;
            ctx.strokeStyle = "#c02828";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(px(fullPath[0].x), py(fullPath[0].y));
            for (let i = 1; i < fullPath.length; i++) {
                const prev = fullPath[i - 1];
                const cur = fullPath[i];
                if (Math.abs(cur.x - prev.x) > WRAP_X_THRESHOLD) {
                    ctx.moveTo(px(cur.x), py(cur.y));
                } else {
                    ctx.lineTo(px(cur.x), py(cur.y));
                }
            }
            ctx.stroke();
            ctx.restore();

            drawPin(ctx, px, py, from.x, from.y, fromPortName, true, W);
            drawPin(ctx, px, py, to.x, to.y, toPortName, false, W);
        };

        if (img.complete) img.onload?.(new Event("load"));
    }, [waypoints, fromPortName, toPortName]);

    return (
        <div className="cargo-route-map-wrapper">
            <canvas
                ref={canvasRef}
                className="cargo-route-map-canvas"
                width={520}
                height={300}
            />
        </div>
    );
}

function drawPin(
    ctx: CanvasRenderingContext2D,
    px: (v: number) => number,
    py: (v: number) => number,
    xPct: number,
    yPct: number,
    label: string,
    isOrigin: boolean,
    canvasW: number,
) {
    const cx = px(xPct);
    const cy = py(yPct);
    const r = 5;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isOrigin ? "#2a6e2a" : "#c02828";
    ctx.fill();

    const fontSize = Math.max(9, Math.round(canvasW / 38));
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    const textW = ctx.measureText(label).width;
    const padX = 5;
    const padY = 3;
    const boxW = textW + padX * 2;
    const boxH = fontSize + padY * 2;

    let lx = cx - boxW / 2;
    let ly = cy - r - 4 - boxH;
    if (lx < 2) lx = 2;
    if (lx + boxW > canvasW - 2) lx = canvasW - boxW - 2;
    if (ly < 2) ly = cy + r + 4;

    ctx.save();
    ctx.fillStyle = "rgba(245, 235, 200, 0.92)";
    ctx.strokeStyle = isOrigin ? "#2a6e2a" : "#c02828";
    ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, boxW, boxH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1a1208";
    ctx.fillText(label, lx + padX, ly + padY + fontSize - 1);
    ctx.restore();
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number,
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}