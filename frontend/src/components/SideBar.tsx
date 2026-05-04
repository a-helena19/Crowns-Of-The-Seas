import "../style/Sidebar.css";

type View = "map" | "harbor" | "broker" | "portProfile" | "cargoManagement" | "office";

interface Props {
    currentView: View;
    onOpenOffice: () => void;
    onStartAction: () => void;
    onOpenBroker: () => void;
    onOpenCargoManagement: () => void;
    assignedCargoCount: number;
}

export default function Sidebar({
                                    currentView,
                                    onOpenOffice,
                                    onStartAction,
                                    onOpenBroker,
                                    onOpenCargoManagement,
                                    assignedCargoCount,
                                }: Props) {
    return (
        <div className="sidebar">
            <SidebarButton
                label="Office"
                active={currentView === "office"}
                onClick={onOpenOffice}
            />

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
