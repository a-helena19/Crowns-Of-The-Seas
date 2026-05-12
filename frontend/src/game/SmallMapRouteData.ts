interface Point { x: number; y: number }

const PORTS: Record<string, Point> = {};
const HUBS: Record<string, Point> = {};
const GRAPH: Record<string, Array<{ to: string; waypoints: Point[]; weight: number }>> = {};

function port(name: string, x: number, y: number) { PORTS[name] = { x, y }; }
function hub(name: string, x: number, y: number) { HUBS[name] = { x, y }; }
function wp(x: number, y: number): Point { return { x, y }; }

function nodePos(name: string): Point {
    return PORTS[name] ?? HUBS[name];
}

function pathLength(from: Point, waypoints: Point[], to: Point): number {
    let total = 0;
    let prev = from;
    for (const w of waypoints) {
        total += Math.hypot(w.x - prev.x, w.y - prev.y);
        prev = w;
    }
    total += Math.hypot(to.x - prev.x, to.y - prev.y);
    return total;
}

function edge(a: string, b: string, ...waypoints: Point[]) {
    const weight = pathLength(nodePos(a), waypoints, nodePos(b));
    if (!GRAPH[a]) GRAPH[a] = [];
    GRAPH[a].push({ to: b, waypoints, weight });
    if (!GRAPH[b]) GRAPH[b] = [];
    GRAPH[b].push({ to: a, waypoints: [...waypoints].reverse(), weight });
}

port("Hamburg",      46.1, 24.3);
port("Rotterdam",    43.8, 27.1);
port("New York",     21.6, 33.8);
port("Santos",       33.9, 71.4);
port("Kapstadt",     51.6, 79.4);
port("Mumbai",       68.1, 47.7);
port("Singapur",     75.9, 53.6);
port("Shanghai",     81.7, 41.4);
port("Sydney",       90.1, 80.5);
port("Los Angeles",  8.4, 32.0);

hub("Atlantic Crossroads",         37.5, 61.5);
hub("Second Atlantic Crossroad",   32.3, 42.3);
hub("Indian Ocean Hub",            68.7, 59.7);
hub("Phillipinen Hub",             90.7, 49.9);
hub("Biskaya Hub",                 38.0, 27.0);
hub("Santos Hub",                  32.9, 76.4);

edge("Santos", "Santos Hub",                          wp(33.9, 71.4), wp(32.9, 76.4));
edge("Santos Hub", "Second Atlantic Crossroad",       wp(32.9, 76.4), wp(37.5, 61.5));

edge("Second Atlantic Crossroad", "Atlantic Crossroads", wp(37.5, 61.5), wp(32.3, 42.3));
edge("Second Atlantic Crossroad", "Kapstadt",         wp(37.5, 61.5), wp(51.6, 79.4));
edge("Rotterdam", "Biskaya Hub",                      wp(43.8, 27.1), wp(38.0, 27.0));
edge("Biskaya Hub", "Atlantic Crossroads",            wp(38.0, 27.0), wp(32.3, 42.3));
edge("Atlantic Crossroads", "Los Angeles",            wp(32.3, 42.3), wp(23.3, 48.7), wp(19.7, 47.6), wp(18.9, 54.2), wp(8.8, 48.7), wp(8.4, 32.0));
edge("Santos Hub", "Kapstadt",                        wp(32.9, 76.4), wp(51.6, 79.4));
edge("Atlantic Crossroads", "New York",               wp(32.3, 42.3), wp(21.6, 33.8));
edge("Hamburg", "Rotterdam",                          wp(46.1, 24.3), wp(43.8, 27.1));
edge("Mumbai", "Biskaya Hub",                         wp(68.1, 47.7), wp(58.9, 49.2), wp(54.9, 36.1), wp(47.8, 32.1), wp(41.3, 34.7), wp(38.0, 27.0));
edge("Mumbai", "Indian Ocean Hub",                    wp(68.1, 47.7), wp(67.3, 54.5), wp(68.7, 59.7));
edge("Singapur", "Indian Ocean Hub",                  wp(75.9, 53.6), wp(79.0, 59.0), wp(83.4, 62.0), wp(83.4, 64.9), wp(76.5, 64.9), wp(68.7, 59.7));
edge("Singapur", "Phillipinen Hub",                   wp(75.9, 53.6), wp(81.7, 50.5), wp(90.7, 49.9));
edge("Sydney", "Indian Ocean Hub",                    wp(90.1, 80.5), wp(76.9, 81.3), wp(68.7, 59.7));
edge("Sydney", "Phillipinen Hub",                     wp(90.1, 80.5), wp(92.8, 81.7), wp(96.0, 70.8), wp(95.3, 60.3), wp(90.7, 49.9));
edge("Shanghai", "Phillipinen Hub",                   wp(81.7, 41.4), wp(90.7, 49.9));
edge("Kapstadt", "Indian Ocean Hub",                  wp(51.6, 79.4), wp(51.6, 81.7), wp(59.9, 77.0), wp(68.7, 59.7));


function aStar(start: string, goal: string): string[] | null {
    const goalPos = nodePos(goal);
    const gScore: Record<string, number> = { [start]: 0 };
    const cameFrom: Record<string, string> = {};
    const open = new Set([start]);
    const closed = new Set<string>();

    while (open.size > 0) {
        let current = "";
        let best = Infinity;
        for (const n of open) {
            const f = (gScore[n] ?? Infinity) + Math.hypot(nodePos(n).x - goalPos.x, nodePos(n).y - goalPos.y);
            if (f < best) { best = f; current = n; }
        }
        if (current === goal) {
            const path: string[] = [current];
            let c = current;
            while (cameFrom[c]) { c = cameFrom[c]; path.unshift(c); }
            return path;
        }
        open.delete(current);
        closed.add(current);

        for (const edge of (GRAPH[current] ?? [])) {
            if (closed.has(edge.to)) continue;
            const tentative = (gScore[current] ?? Infinity) + edge.weight;
            if (tentative < (gScore[edge.to] ?? Infinity)) {
                cameFrom[edge.to] = current;
                gScore[edge.to] = tentative;
                open.add(edge.to);
            }
        }
    }
    return null;
}

export function getSmallMapPort(name: string): Point | null {
    return PORTS[name] ?? null;
}

export function getSmallMapRoute(fromName: string, toName: string): Point[] {
    const nodePath = aStar(fromName, toName);
    if (!nodePath || nodePath.length < 2) return [];

    const result: Point[] = [];
    for (let i = 0; i < nodePath.length - 1; i++) {
        const a = nodePath[i];
        const b = nodePath[i + 1];
        const edgeData = (GRAPH[a] ?? []).find(e => e.to === b);
        if (!edgeData) return [];

        const wps = edgeData.waypoints;
        const start = 1;
        const end = i < nodePath.length - 2 ? wps.length : wps.length - 1;

        for (let w = start; w < end; w++) {
            result.push(wps[w]);
        }
    }
    return result;
}