import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface CargoGlobeViewProps {
    fromPortName: string;
    toPortName: string;
}

interface RouteWaypoint {
    x: number;
    y: number;
}

interface RouteResponse {
    waypoints: RouteWaypoint[];
    distance: number;
}

const GLOBE_RADIUS = 1.0;
const ROUTE_ALTITUDE = 0.012; // route hovers slightly above the surface

/**
 * Convert game-map coordinates (x: 0-100 west→east, y: 0-100 north→south)
 * to a position on a unit sphere.
 *
 * x = 0   → longitude -180°   x = 100 → +180°
 * y = 0   → latitude  +90°    y = 100 → -90°
 */
function mapToSphere(x: number, y: number, radius: number): THREE.Vector3 {
    const lon = (x / 100) * Math.PI * 2 - Math.PI;
    const lat = Math.PI / 2 - (y / 100) * Math.PI;
    const cosLat = Math.cos(lat);
    return new THREE.Vector3(
        radius * cosLat * Math.cos(lon),
        radius * Math.sin(lat),
        radius * cosLat * Math.sin(lon),
    );
}

/**
 * 3D parchment-style globe rendered with Three.js. Shows the precomputed
 * sea route between two ports as a glowing red arc above the surface.
 * Smoothly rotates the globe so the route's midpoint faces the viewer.
 */
export default function CargoGlobeView({ fromPortName, toPortName }: CargoGlobeViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneStateRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        globe: THREE.Mesh;
        routeGroup: THREE.Group;
        targetRotation: { x: number; y: number };
    } | null>(null);

    const [routeWaypoints, setRouteWaypoints] = useState<RouteWaypoint[]>([]);

    // One-time scene setup
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const w = container.clientWidth;
        const h = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
        camera.position.set(0, 0, 3.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Warm vintage lighting
        scene.add(new THREE.AmbientLight(0xfff0c8, 0.55));
        const sun = new THREE.DirectionalLight(0xffd9a0, 1.2);
        sun.position.set(3, 2, 4);
        scene.add(sun);
        const rim = new THREE.DirectionalLight(0x7a5a30, 0.4);
        rim.position.set(-3, -1, -2);
        scene.add(rim);

        // Parchment globe with hand-painted continents
        const globeTexture = createParchmentGlobeTexture();
        const globeMat = new THREE.MeshPhongMaterial({
            map: globeTexture,
            shininess: 8,
            specular: 0x553311,
        });
        const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        const globe = new THREE.Mesh(globeGeo, globeMat);
        scene.add(globe);

        // Soft warm halo
        const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xc89968,
            transparent: true,
            opacity: 0.12,
            side: THREE.BackSide,
        });
        scene.add(new THREE.Mesh(haloGeo, haloMat));

        // Route group is parented to the globe so it rotates with it
        const routeGroup = new THREE.Group();
        globe.add(routeGroup);

        // Render all known ports as small dark dots on the surface
        const portsGroup = new THREE.Group();
        globe.add(portsGroup);
        const allPorts = window.__latestPorts ?? [];
        for (const port of allPorts) {
            const pos = mapToSphere(port.x, port.y, GLOBE_RADIUS + 0.005);
            const dotGeo = new THREE.SphereGeometry(0.012, 8, 8);
            const dotMat = new THREE.MeshBasicMaterial({ color: 0x3a2410 });
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.copy(pos);
            portsGroup.add(dot);
        }

        sceneStateRef.current = {
            scene,
            camera,
            renderer,
            globe,
            routeGroup,
            targetRotation: { x: 0, y: 0 },
        };

        let raf = 0;
        const animate = () => {
            const state = sceneStateRef.current;
            if (!state) return;
            const r = state.globe.rotation;
            // Smooth interpolation toward the target rotation
            r.x += (state.targetRotation.x - r.x) * 0.04;
            r.y += (state.targetRotation.y - r.y) * 0.04;
            // Tiny continuous drift so it always feels alive
            state.targetRotation.y += 0.0008;
            state.renderer.render(state.scene, state.camera);
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);

        const handleResize = () => {
            const state = sceneStateRef.current;
            if (!state || !container) return;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            state.camera.aspect = cw / ch;
            state.camera.updateProjectionMatrix();
            state.renderer.setSize(cw, ch);
        };
        const observer = new ResizeObserver(handleResize);
        observer.observe(container);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            renderer.dispose();
            globeGeo.dispose();
            globeMat.dispose();
            globeTexture.dispose();
            haloGeo.dispose();
            haloMat.dispose();
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
            }
            sceneStateRef.current = null;
        };
    }, []);

    // Fetch the route on selection change
    useEffect(() => {
        const list = window.__latestPorts ?? [];
        const from = list.find(p => p.name === fromPortName);
        const to = list.find(p => p.name === toPortName);
        if (!from || !to) {
            setRouteWaypoints([]);
            return;
        }
        const token = localStorage.getItem("auth_token") ?? "";

        let cancelled = false;
        fetch(`/api/routes/${from.id}/${to.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => (r.ok ? r.json() : null))
            .then((data: RouteResponse | null) => {
                if (cancelled) return;
                setRouteWaypoints(data?.waypoints ?? []);
            })
            .catch(() => {
                if (!cancelled) setRouteWaypoints([]);
            });
        return () => {
            cancelled = true;
        };
    }, [fromPortName, toPortName]);

    // Rebuild the route line and rotate to face it whenever the route changes
    useEffect(() => {
        const state = sceneStateRef.current;
        if (!state) return;

        const list = window.__latestPorts ?? [];
        const from = list.find(p => p.name === fromPortName);
        const to = list.find(p => p.name === toPortName);
        if (!from || !to) return;

        // Clear previous route children
        while (state.routeGroup.children.length > 0) {
            const child = state.routeGroup.children.pop();
            if (!child) break;
            if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
                child.geometry.dispose();
                (child.material as THREE.Material).dispose();
            }
        }

        // Full path = origin + waypoints + destination
        const fullPath: RouteWaypoint[] = [
            { x: from.x, y: from.y },
            ...routeWaypoints,
            { x: to.x, y: to.y },
        ];

        // Slerp between consecutive points so the line follows the curvature
        const SEGMENTS_PER_LEG = 24;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < fullPath.length - 1; i++) {
            const a = fullPath[i];
            const b = fullPath[i + 1];
            const av = mapToSphere(a.x, a.y, GLOBE_RADIUS + ROUTE_ALTITUDE);
            const bv = mapToSphere(b.x, b.y, GLOBE_RADIUS + ROUTE_ALTITUDE);
            for (let s = 0; s < SEGMENTS_PER_LEG; s++) {
                const t = s / SEGMENTS_PER_LEG;
                const v = new THREE.Vector3()
                    .copy(av)
                    .lerp(bv, t)
                    .normalize()
                    .multiplyScalar(GLOBE_RADIUS + ROUTE_ALTITUDE);
                points.push(v);
            }
        }
        const last = fullPath[fullPath.length - 1];
        points.push(mapToSphere(last.x, last.y, GLOBE_RADIUS + ROUTE_ALTITUDE));

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xc02020,
            transparent: true,
            opacity: 0.95,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        state.routeGroup.add(line);

        // Origin (green) and destination (red) markers
        const fromVec = mapToSphere(from.x, from.y, GLOBE_RADIUS + 0.018);
        const toVec = mapToSphere(to.x, to.y, GLOBE_RADIUS + 0.018);
        const markerGeo = new THREE.SphereGeometry(0.03, 12, 12);
        const fromMarker = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: 0x2a7a2a }));
        const toMarker = new THREE.Mesh(markerGeo.clone(), new THREE.MeshBasicMaterial({ color: 0xc02020 }));
        fromMarker.position.copy(fromVec);
        toMarker.position.copy(toVec);
        state.routeGroup.add(fromMarker);
        state.routeGroup.add(toMarker);

        // Rotate the globe so the route midpoint faces +Z (the camera)
        const mid = new THREE.Vector3()
            .addVectors(fromVec, toVec)
            .multiplyScalar(0.5)
            .normalize();
        const targetY = -Math.atan2(mid.x, mid.z);
        const targetX = Math.asin(THREE.MathUtils.clamp(mid.y, -1, 1));
        state.targetRotation = { x: targetX, y: targetY };
    }, [routeWaypoints, fromPortName, toPortName]);

    return <div ref={containerRef} className="cargo-globe-view" />;
}

/**
 * Procedurally paints a parchment-style world map onto a canvas, used as
 * the globe texture. Continents are warm sand colour, oceans are warm
 * cream so the whole sphere reads as an aged paper map.
 */
function createParchmentGlobeTexture(): THREE.CanvasTexture {
    const W = 2048;
    const H = 1024;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d")!;

    // Parchment ocean base
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#e8d4a0");
    grad.addColorStop(0.5, "#f1ddae");
    grad.addColorStop(1, "#d8c08a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle paper noise
    const img = ctx.getImageData(0, 0, W, H);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
        data[i] = Math.max(0, Math.min(255, data[i] + n));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);

    // Continents drawn as polygons in equirectangular space.
    // Coordinates are the same 0–100 percentages the game uses for ports.
    const sx = (pct: number) => (pct / 100) * W;
    const sy = (pct: number) => (pct / 100) * H;

    const continents: number[][][] = [
        [[8, 18], [22, 14], [28, 22], [27, 36], [23, 46], [18, 48], [13, 44], [9, 36]],
        [[22, 44], [25, 48], [24, 54], [21.5, 52]],
        // South America
        [[24, 56], [29, 54], [31.5, 67], [30, 82], [26.5, 89], [24.5, 82], [23.2, 70]],
        // Europe
        [[47, 22], [54, 20], [56.5, 29], [55, 36], [51, 37.6], [47.2, 33.6]],
        // Africa
        [[48, 40], [56, 39], [58.5, 55], [56.8, 71], [52.5, 79], [49, 73], [47.2, 58]],
        // Asia
        [[58, 16], [80, 14], [88, 22], [87, 36], [81, 43], [72, 40], [64, 37], [59, 30]],
        // India
        [[70, 40], [74, 40], [74.5, 49], [72, 55], [70, 50]],
        // Southeast Asia
        [[80, 44], [85.5, 43], [84.5, 53], [81.5, 55], [80, 50]],
        // Australia
        [[82, 66], [92, 65], [94, 74], [90.5, 81], [85, 80], [82, 74]],
        // Antarctica strip
        [[5, 92], [95, 92], [95, 100], [5, 100]],
    ];

    ctx.fillStyle = "#c89968";
    ctx.strokeStyle = "#7a4f24";
    ctx.lineWidth = 4;
    for (const poly of continents) {
        ctx.beginPath();
        ctx.moveTo(sx(poly[0][0]), sy(poly[0][1]));
        for (let i = 1; i < poly.length; i++) {
            ctx.lineTo(sx(poly[i][0]), sy(poly[i][1]));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Decorative latitude lines (subtle)
    ctx.strokeStyle = "rgba(122, 79, 36, 0.18)";
    ctx.lineWidth = 1;
    for (let lat = 0; lat <= 100; lat += 12.5) {
        ctx.beginPath();
        ctx.moveTo(0, sy(lat));
        ctx.lineTo(W, sy(lat));
        ctx.stroke();
    }
    for (let lon = 0; lon <= 100; lon += 12.5) {
        ctx.beginPath();
        ctx.moveTo(sx(lon), 0);
        ctx.lineTo(sx(lon), H);
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
}
