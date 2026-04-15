import "../style/Sidebar.css";

type View = "map" | "harbor" | "broker";

interface Props {
    currentView: View;
    onStartAction: () => void;
    onOpenBroker: () => void;
}

export default function Sidebar({
                                    currentView,
                                    onStartAction,
                                    onOpenBroker,
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
            <div className="sidebar-spacer" />
        </div>
    );
}

function SidebarButton({
                           label,
                           onClick,
                           active,
                       }: any) {
    return (
        <button
            onClick={onClick}
            className={`sidebar-btn ${active ? "active" : ""}`}
        >
            {label}
        </button>
    );
}