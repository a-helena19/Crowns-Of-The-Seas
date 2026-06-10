import audioEngine from '../audio/AudioEngine';
import backIcon from '../assets/goback.png';

interface Props {
    onClick: () => void;
}

export default function BackButton({ onClick }: Props) {
    function handleClick() {
        audioEngine.playSfx('buttonClick');
        onClick();
    }

    return (
        <div className="back-icon-btn" onClick={handleClick}>
            <img src={backIcon} alt="Zurück" />
        </div>
    );
}