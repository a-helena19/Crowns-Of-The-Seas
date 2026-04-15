export default function GameButton({children, onClick, variant = "default", disabled = false}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
}) {
    return (
        <button
            className={`game-btn ${variant}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}