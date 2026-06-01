import "../style/QuickNavSidebar.css";
import housesImage from "../assets/marketplace/Houses.png";

interface QuickNavSidebarProps {
    onOpenOffice?: () => void;
    onOpenOrders?: () => void;
    onOpenShipMarket?: () => void;
    onOpenFreightMarket?: () => void;
}

export default function QuickNavSidebar({
                                            onOpenOffice,
                                            onOpenOrders,
                                            onOpenShipMarket,
                                            onOpenFreightMarket,
                                        }: QuickNavSidebarProps) {
    const items = [
        { key: "office", label: "Büro", spriteClass: "sprite-office", onClick: onOpenOffice, ariaLabel: "Büro öffnen" },
        { key: "orders", label: "Aufträge", spriteClass: "sprite-orders", onClick: onOpenOrders, ariaLabel: "Aufträge öffnen" },
        { key: "shipmarket", label: "Schiffmarkt", spriteClass: "sprite-shipmarket", onClick: onOpenShipMarket, ariaLabel: "Schiffmarkt öffnen" },
        { key: "freight", label: "Fracht Börse", spriteClass: "sprite-freight", onClick: onOpenFreightMarket, ariaLabel: "Fracht Börse öffnen" },
    ].filter(item => !!item.onClick);

    if (items.length === 0) return null;

    return (
        <nav className="quick-nav-sidebar" aria-label="Schnellzugriff">
            {items.map(item => (
                <button
                    key={item.key}
                    type="button"
                    className="quick-nav-btn"
                    onClick={item.onClick}
                    aria-label={item.ariaLabel}
                >
                    <span
                        className={`quick-nav-btn-sprite ${item.spriteClass}`}
                        style={{ backgroundImage: `url(${housesImage})` }}
                        aria-hidden="true"
                    />
                    <span className="quick-nav-label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}