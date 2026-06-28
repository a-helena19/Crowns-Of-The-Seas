import audioEngine from '../audio/AudioEngine';
import backIcon from '../assets/goback.png';

interface Props {
    onClick: () => void;
    tutorialTarget?: string;
}

export default function BackButton({ onClick, tutorialTarget }: Props) {
    function handleClick() {
        audioEngine.playSfx('buttonClick');
        onClick();
    }

    return (
        <div className="back-icon-btn" onClick={handleClick} data-tutorial={tutorialTarget}>
            <img src={backIcon} alt="Zurück" />
        </div>
    );
}
