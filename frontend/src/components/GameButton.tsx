export default function GameButton({
                                       onClick,
                                       children,
                                       variant,
                                       disabled,
                                   }: {
    onClick: () => void;
    children: React.ReactNode;
    variant?: "danger";
    disabled?: boolean;
}) {
    return (
        <button
            className={`game-btn${variant ? ` ${variant}` : ""}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}