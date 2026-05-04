import { useEffect, useRef, useState } from "react";

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

interface RouteResponse {
    waypoints: RouteWaypoint[];
    distance: number;
}


export default function CargoRouteMapView({
                                              fromPortName,
                                              toPortName,
                                              fromPortId,
                                              toPortId,
                                          }: CargoRouteMapViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const ports = window.__latestPorts ?? [];
        const from = fromPortId
            ? ports.find((p) => p.id === fromPortId)
            : ports.find((p) => p.name === fromPortName);
        const to = toPortId
            ? ports.find((p) => p.id === toPortId)
            : ports.find((p) => p.name === toPortName);

        if (!from || !to) {
            setWaypoints([]);
            return;
        }

        const token = localStorage.getItem("auth_token") ?? "";
        let cancelled = false;
        setLoading(true);

        fetch(`/api/routes/${from.id}/${to.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? (r.json() as Promise<RouteResponse>) : null))
            .then((data) => {
                if (cancelled) return;
                setWaypoints(data?.waypoints ?? []);
            })
            .catch(() => {
                if (!cancelled) setWaypoints([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [fromPortName, toPortName, fromPortId, toPortId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ports = window.__latestPorts ?? [];
        const from = fromPortId
            ? ports.find((p) => p.id === fromPortId)
            : ports.find((p) => p.name === fromPortName);
        const to = toPortId
            ? ports.find((p) => p.id === toPortId)
            : ports.find((p) => p.name === toPortName);

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
                { x: from.x, y: from.y },
                ...waypoints,
                { x: to.x, y: to.y },
            ];

            if (fullPath.length < 2) return;


            ctx.save();
            ctx.shadowColor = "rgba(180, 30, 30, 0.55)";
            ctx.shadowBlur = 6;
            ctx.strokeStyle = "#c02828";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.setLineDash([]);
            ctx.beginPath();

            const p0 = fullPath[0];
            ctx.moveTo(px(p0.x), py(p0.y));

            function drawSmoothPath(ctx: CanvasRenderingContext2D, points: RouteWaypoint[]) {
                if (points.length < 2) return;

                const get = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
                ctx.beginPath();
                ctx.moveTo(px(points[0].x), py(points[0].y));

                for (let i = 0; i < points.length - 1; i++) {
                    const p0 = get(i - 1);
                    const p1 = get(i);
                    const p2 = get(i + 1);
                    const p3 = get(i + 2);

                    const cp1x = px(p1.x + (p2.x - p0.x) / 6);
                    const cp1y = py(p1.y + (p2.y - p0.y) / 6);

                    const cp2x = px(p2.x - (p3.x - p1.x) / 6);
                    const cp2y = py(p2.y - (p3.y - p1.y) / 6);

                    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px(p2.x), py(p2.y));
                }

                ctx.stroke();
            }
            drawSmoothPath(ctx, fullPath);
            const last = fullPath[fullPath.length - 1];
            ctx.lineTo(px(last.x), py(last.y));

            ctx.stroke();
            ctx.restore();

            const drawPin = (
                xPct: number,
                yPct: number,
                label: string,
                isOrigin: boolean,
            ) => {
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

                const fontSize = Math.max(9, Math.round(W / 38));
                ctx.font = `bold ${fontSize}px Georgia, serif`;
                const textW = ctx.measureText(label).width;
                const padX = 5;
                const padY = 3;
                const boxW = textW + padX * 2;
                const boxH = fontSize + padY * 2;

                let lx = cx - boxW / 2;
                let ly = cy - r - 4 - boxH;
                if (lx < 2) lx = 2;
                if (lx + boxW > W - 2) lx = W - boxW - 2;
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
            };

            drawPin(from.x, from.y, fromPortName, true);
            drawPin(to.x, to.y, toPortName, false);
        };

        if (img.complete) img.onload?.(new Event("load"));
    }, [waypoints, fromPortName, toPortName, fromPortId, toPortId]);

    return (
        <div className="cargo-route-map-wrapper">
            {loading && (
                <div className="cargo-route-map-loading">
                    <span>Berechne Route…</span>
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="cargo-route-map-canvas"
                width={520}
                height={300}
            />
        </div>
    );
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
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