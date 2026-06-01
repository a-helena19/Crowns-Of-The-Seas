import { BOTTOM_BAR_HEIGHT } from '../scenes/GameScreen';
import "../style/BottomBar.css";
import housesImage from "../assets/marketplace/Houses.png";
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
    onOpenOffice?: () => void;
    onOpenOrders?: () => void;
    onOpenShipMarket?: () => void;
    onOpenFreightMarket?: () => void;
    ships?: OwnedShipSummary[];
    pendingEventsByShipId?: Record<string, PendingShipEvent>;
    urgentShipIds?: Record<string, boolean>;
    onShipCardClick?: (ship: OwnedShipSummary) => void;
}

export default function BottomBar({
                                      send: _send,
                                      connected: _connected,
                                      onOpenOffice,
                                      onOpenOrders,
                                      onOpenShipMarket,
                                      onOpenFreightMarket,
                                      ships = [],
                                      pendingEventsByShipId = {},
                                      urgentShipIds = {},
                                      onShipCardClick,
                                  }: BottomBarProps) {
    const portsById = new Map((window.__latestPorts ?? []).map(p => [p.id, p.name]));
    const quickNavItems = [
        { key: "office", label: "Büro", spriteClass: "sprite-office", onClick: onOpenOffice, ariaLabel: "Büro öffnen" },
        { key: "orders", label: "Aufträge", spriteClass: "sprite-orders", onClick: onOpenOrders, ariaLabel: "Aufträge öffnen" },
        { key: "shipmarket", label: "Schiffmarkt", spriteClass: "sprite-shipmarket", onClick: onOpenShipMarket, ariaLabel: "Schiffmarkt öffnen" },
        { key: "freight", label: "Fracht Börse", spriteClass: "sprite-freight", onClick: onOpenFreightMarket, ariaLabel: "Fracht Börse öffnen" },
    ].filter(item => !!item.onClick);

    return (
        <div className="bottom-bar" style={{ height: BOTTOM_BAR_HEIGHT, flexShrink: 0 }}>
            <div className="bottom-left">
                <div className="bottom-nav-grid">
                    {quickNavItems.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            className="bottom-nav-btn"
                            onClick={item.onClick}
                            aria-label={item.ariaLabel}
                        >
                            <span
                                className={`bottom-nav-btn-sprite ${item.spriteClass}`}
                                style={{ backgroundImage: `url(${housesImage})` }}
                                aria-hidden="true"
                            />
                            <span className="bottom-nav-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
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
                        urgent={urgentShipIds[ship.id]}
                        onClick={onShipCardClick ? () => onShipCardClick(ship) : undefined}
                    />
                ))}
            </div>
            <div className="bottom-right" />
        </div>
    );
}
