import type { ObstacleMinigameEventPayload, ObstacleRouteViewType } from "./ObstacleMinigameTypes";

const VIEW_B_PORTS = new Set([
    "mumbai",
    "singapur",
    "shanghai",
    "sydney",
    "phillipinen hub",
    "indian ocean hub",
]);

export class ObstacleRouteViewResolver {
    static resolve(event: ObstacleMinigameEventPayload): ObstacleRouteViewType {
        if (event.routeViewType) return event.routeViewType;

        const origin = (event.originPortName ?? "").trim().toLowerCase();
        const destination = (event.destinationPortName ?? "").trim().toLowerCase();

        if (VIEW_B_PORTS.has(origin) || VIEW_B_PORTS.has(destination)) {
            return "VIEW_B";
        }
        return "VIEW_A";
    }
}
