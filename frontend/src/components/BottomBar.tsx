import "../style/BottomBar.css";
import ShipStatusCard from "./ShipStatusCard";

interface OwnedShipSummary {
    id: string;
    name: string;
    shipClass?: string;
    iconUrl: string;
    status: string;
    fuel: number;
    condition: number;
    currentPortId?: string;
}

interface PendingShipEvent {
    eventId: string;
    label: string;
    kind: "rats" | "storm" | "obstacle" | "treasure_hunt" | "arrival_docking" | "smuggle" | "customs";
}

interface BottomBarProps {
    send: (message: object) => void;
    connected: boolean;
    ships?: OwnedShipSummary[];
    pendingEventsByShipId?: Record<string, PendingShipEvent>;
    urgentShipIds?: Record<string, boolean>;
    onShipCardClick?: (ship: OwnedShipSummary) => void;
}

export default function BottomBar({
                                      send: _send,
                                      connected: _connected,
                                      ships = [],
                                      pendingEventsByShipId = {},
                                      urgentShipIds = {},
                                      onShipCardClick,
                                  }: BottomBarProps) {
    const portsById = new Map((window.__latestPorts ?? []).map(p => [p.id, p.name]));

    return (
        <div className="bottom-bar">
            <div className="bottom-center ship-status-list">
                {ships.map(ship => (
                    <ShipStatusCard
                        key={ship.id}
                        name={ship.name}
                        shipClass={ship.shipClass}
                        iconUrl={ship.iconUrl}
                        status={ship.status}
                        fuel={ship.fuel}
                        condition={ship.condition}
                        currentPortName={ship.currentPortId ? portsById.get(ship.currentPortId) ?? null : null}
                        pendingEventLabel={pendingEventsByShipId[ship.id]?.label}
                        pendingEventKind={pendingEventsByShipId[ship.id]?.kind}
                        urgent={urgentShipIds[ship.id]}
                        onClick={onShipCardClick ? () => onShipCardClick(ship) : undefined}
                    />
                ))}
            </div>
        </div>
    );
}