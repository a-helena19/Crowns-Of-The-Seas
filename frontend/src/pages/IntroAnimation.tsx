import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/intro.css';
import skipIcon from "../assets/intro/skip.png";
import introMusic from "../assets/audio/intro-music.mp3";

export default function IntroAnimation() {
    const navigate = useNavigate();
    const [showSkip, setShowSkip] = useState(false);
    const [audioStarted, setAudioStarted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [starPositions] = useState(() =>
        [...Array(20)].map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 40,
            delay: Math.random() * 2
        }))
    );

    const handleUnmute = () => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio(introMusic);
                audioRef.current.volume = 0.5;
                audioRef.current.loop = false;
            }

            // Stelle sicher, dass die Wiedergabe von vorne startet
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Audio erfolgreich abgespielt');
                        setAudioStarted(true);
                    })
                    .catch(error => {
                        console.log('Audio-Fehler:', error);
                    });
            }
        } catch (error) {
            console.log('Audio nicht verfügbar:', error);
        }
    };

    const handleMute = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setAudioStarted(false);
        }
    };

    useEffect(() => {
        // Show skip button after 1 second
        const skipTimer = setTimeout(() => {
            setShowSkip(true);
        }, 1000);

        // Redirect to faction selection after animation completes
        const redirectTimer = setTimeout(() => {
            if (sessionStorage.getItem('gameStarted') === 'true') {
                sessionStorage.removeItem('gameStarted');
                navigate('/game');
            } else {
                navigate('/session-waiting', { state: { showFactionDialog: true } });
            }
        }, 6000); // 6 seconds total

        return () => {
            clearTimeout(skipTimer);
            clearTimeout(redirectTimer);
            // Stoppe die Audio-Wiedergabe
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [navigate]);

    const handleSkip = () => {
        if (sessionStorage.getItem('gameStarted') === 'true') {
            sessionStorage.removeItem('gameStarted');
            navigate('/game');
        } else {
            navigate('/session-waiting', { state: { showFactionDialog: true } });
        }
    };

    return (
        <div className="intro-container">
            {/* Unmute button */}
            {!audioStarted && (
                <div className="unmute-button" onClick={handleUnmute} title="Sound einschalten">
                    🔇
                </div>
            )}

            {/* Muted indicator */}
            {audioStarted && (
                <div className="mute-button" onClick={handleMute} title="Sound stumm schalten">
                    🔊
                </div>
            )}

            {/* Moon & Sky background (via CSS) */}
            <div className="moon" />

            {/* Stars background */}
            <div className="stars">
                {starPositions.map((pos, i) => (
                    <div key={i} className="star" style={{
                        left: `${pos.left}%`,
                        top: `${pos.top}%`,
                        animationDelay: `${pos.delay}s`
                    }} />
                ))}
            </div>

            {/* Story text animation */}
            <div className="intro-story">
                <div className="story-text story-line-1">
                    <span>Die Meere rufen...</span>
                </div>
                <div className="story-text story-line-2">
                    <span>Werde zum Kapitän deiner eigenen Legende</span>
                </div>
                <div className="story-text story-line-3">
                    <span>Crown of the Seas wartet</span>
                </div>
            </div>

            {/* Ocean Waves with Pixel-Art Layers */}
            <div className="intro-ocean">
                {/* Das Pixel-Art Schiff segelt zwischen den Ebenen */}
                <div className="ship-container">
                    <div className="ship-hull" /> {/* Emoji entfernt */}
                </div>

                {/* Zwei Wellen-Ebenen für Parallax-Effekt */}
                <div className="waves wave-1" />
                <div className="waves wave-2" />
            </div>

            {/* Skip button */}
            {showSkip && (
                <div className="skip-button" onClick={handleSkip}>
                    <img src={skipIcon} alt="Überspringen" />
                </div>
            )}

            {/* Loading bar */}
            <div className="loading-bar">
                <div className="loading-progress" />
            </div>
        </div>
    );
}