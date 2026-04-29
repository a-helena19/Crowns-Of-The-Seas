import "../style/Sidebar.css";

type View = "map" | "harbor" | "broker" | "portProfile" | "cargoManagement";

interface Props {
    currentView: View;
    onStartAction: () => void;
    onOpenBroker: () => void;
    onOpenCargoManagement: () => void;
    assignedCargoCount: number;
}

export default function Sidebar({
                                    currentView,
                                    onStartAction,
                                    onOpenBroker,
                                    onOpenCargoManagement,
                                    assignedCargoCount,
                                }: Props) {
    return (
        <div className="sidebar">
            <SidebarButton label="Office" />

            <SidebarButton
                label="Ship Broker"
                active={currentView === "broker"}
                onClick={onOpenBroker}
            />

            <SidebarButton
                label="Start Travel"
                onClick={onStartAction}
            />

            {/* NEU: Frachtübersicht Button */}
            <SidebarButton
                label={assignedCargoCount > 0 ? `Frachten (${assignedCargoCount})` : "Frachten"}
                active={currentView === "cargoManagement"}
                onClick={onOpenCargoManagement}
                highlight={assignedCargoCount > 0}
            />

            <div className="sidebar-spacer" />
        </div>
    );
}

function SidebarButton({
                           label,
                           onClick,
                           active,
                           highlight,
                       }: {
    label: string;
    onClick?: () => void;
    active?: boolean;
    highlight?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`sidebar-btn ${active ? "active" : ""} ${highlight ? "highlight" : ""}`}
        >
            {label}
        </button>
    );
}