import audioEngine from '../audio/AudioEngine';

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
    function handleClick() {
        audioEngine.playSfx('buttonClick');
        onClick();
    }

    return (
        <button
            className={`game-btn${variant ? ` ${variant}` : ""}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}