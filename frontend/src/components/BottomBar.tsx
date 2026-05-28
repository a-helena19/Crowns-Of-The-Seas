import { BOTTOM_BAR_HEIGHT } from '../scenes/GameScreen';
import "../style/BottomBar.css";
import marketplaceButtonImage from "../assets/marketplace/MarketPlaceButton.png";
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
}

interface BottomBarProps {
    send: (message: object) => void;
    connected: boolean;
    onOpenMarketplace?: () => void;
    ships?: OwnedShipSummary[];
    pendingEventsByShipId?: Record<string, PendingShipEvent>;
    onShipCardClick?: (ship: OwnedShipSummary) => void;
}

export default function BottomBar({
    send: _send,
    connected: _connected,
    onOpenMarketplace,
    ships = [],
    pendingEventsByShipId = {},
    onShipCardClick,
}: BottomBarProps) {
    const portsById = new Map((window.__latestPorts ?? []).map(p => [p.id, p.name]));

    return (
        <div className="bottom-bar" style={{ height: BOTTOM_BAR_HEIGHT, flexShrink: 0 }}>
            <div className="bottom-left">
                {onOpenMarketplace && (
                    <button type="button" className="bottom-marketplace-btn" onClick={onOpenMarketplace} aria-label="Marketplace oeffnen">
                        <img src={marketplaceButtonImage} alt="Marketplace" className="bottom-marketplace-btn-image" />
                    </button>
                )}
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
                        onClick={onShipCardClick ? () => onShipCardClick(ship) : undefined}
                    />
                ))}
            </div>
            <div className="bottom-right" />
        </div>
    );
}
