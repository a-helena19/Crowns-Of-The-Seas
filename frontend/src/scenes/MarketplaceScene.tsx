import marketplaceImage from "../assets/marketplace/MarketPlace.png";
import "../style/marketplace.css";
import BackButton from "../components/BackButton.tsx";

interface MarketplaceSceneProps {
    onClose: () => void;
    onOpenOffice: () => void;
    onOpenBroker: () => void;
    onOpenCargoManagement: () => void;
    onOpenHarbor: () => void;
}

interface Hotspot {
    key: string;
    centerX: string;
    top: string;
    width: string;
    height: string;
    onClick: () => void;
    ariaLabel: string;
}

export default function MarketplaceScene({
    onClose,
    onOpenOffice,
    onOpenBroker,
    onOpenCargoManagement,
    onOpenHarbor,
}: MarketplaceSceneProps) {
    const hotspots: Hotspot[] = [
        { key: "office", centerX: "16.6%", top: "45.5%", width: "11.2%", height: "18.2%", onClick: onOpenOffice, ariaLabel: "Office" },
        { key: "broker", centerX: "38.9%", top: "45.5%", width: "11.2%", height: "17.8%", onClick: onOpenBroker, ariaLabel: "Schiffsmarkt" },
        { key: "cargo", centerX: "61%", top: "45.5%", width: "11.0%", height: "17.4%", onClick: onOpenCargoManagement, ariaLabel: "Auftraege" },
        { key: "travel", centerX: "81.6%", top: "45.5%", width: "11.2%", height: "17.8%", onClick: onOpenHarbor, ariaLabel: "Reise starten" },
    ];

    return (
        <div className="marketplace-scene">
            <img src={marketplaceImage} className="marketplace-image" alt="Hafen Marketplace" />

            <BackButton onClick={onClose} />

            <div className="marketplace-hotspots">
                {hotspots.map((hotspot) => (
                    <button
                        key={hotspot.key}
                        type="button"
                        className="marketplace-hotspot"
                        style={{
                            left: hotspot.centerX,
                            top: hotspot.top,
                            width: hotspot.width,
                            height: hotspot.height,
                            transform: "translateX(-50%)",
                        }}
                        onClick={hotspot.onClick}
                        aria-label={hotspot.ariaLabel}
                    />
                ))}
            </div>
        </div>
    );
}
