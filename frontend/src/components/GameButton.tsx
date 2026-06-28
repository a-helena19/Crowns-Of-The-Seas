import audioEngine from '../audio/AudioEngine';

export default function GameButton({
                                       onClick,
                                       children,
                                       variant,
                                       disabled,
                                       tutorialTarget,
                                   }: {
    onClick: () => void;
    children: React.ReactNode;
    variant?: "danger";
    disabled?: boolean;
    tutorialTarget?: string;
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
            data-tutorial={tutorialTarget}
        >
            {children}
        </button>
    );
}
