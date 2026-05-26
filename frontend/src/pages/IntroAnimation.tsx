import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSessionWebSocket } from '../hooks/useGameSessionWebSocket';
import audioEngine from '../audio/AudioEngine';
import '../style/intro.css';
import skipIcon from '../assets/intro/skip.png';

const INTRO_DURATION_MS = 6000;

export default function IntroAnimation() {
    const navigate = useNavigate();
    const [showSkip, setShowSkip] = useState(false);
    const hasNavigatedRef = useRef(false);

    const [starPositions] = useState(() =>
        [...Array(20)].map(() => ({
            left: Math.random() * 100,
            top: Math.random() * 40,
            delay: Math.random() * 2,
        }))
    );

    const sessionId = (() => {
        const data = sessionStorage.getItem('currentSession');
        return data ? JSON.parse(data).id : null;
    })();

    const handleSessionUpdate = useCallback(
        (event: { type: string; status: string }) => {
            if (event.status === 'RUNNING' && !hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                audioEngine.stopMusic();          // ← SOFORT stoppen
                navigate('/game');
            }
        },
        [navigate]
    );

    useGameSessionWebSocket({
        sessionId,
        onSessionUpdate: handleSessionUpdate,
    });

    const goBackToWaiting = useCallback(() => {
        if (hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;
        audioEngine.stopMusic();
        navigate('/session-waiting');
    }, [navigate]);

    // Intro-Musik starten
    useEffect(() => {
        audioEngine.crossfadeTo('intro', 500);

        // Sicherheits-Cleanup falls React langsam unmountet
        return () => {
            audioEngine.stopMusic();
        };
    }, []);

    useEffect(() => {
        const skipTimer = setTimeout(() => setShowSkip(true), 1000);
        const redirectTimer = setTimeout(goBackToWaiting, INTRO_DURATION_MS);

        return () => {
            clearTimeout(skipTimer);
            clearTimeout(redirectTimer);
        };
    }, [goBackToWaiting]);

    const handleSkip = () => goBackToWaiting();

    const audioSettings = audioEngine.getSettings();
    const isMuted = !audioSettings.musicEnabled;

    return (
        <div className="intro-container">
            <div
                className={isMuted ? 'unmute-button' : 'mute-button'}
                onClick={() => {
                    audioEngine.updateSettings({ musicEnabled: !audioSettings.musicEnabled });
                    if (audioSettings.musicEnabled) {
                        // War an → wird aus
                    } else {
                        // War aus → wird an, Intro-Track starten
                        audioEngine.playMusic('intro');
                    }
                }}
                title={isMuted ? 'Sound einschalten' : 'Sound stumm schalten'}
            >
                {isMuted ? '🔇' : '🔊'}
            </div>

            <div className="moon" />

            <div className="stars">
                {starPositions.map((pos, i) => (
                    <div
                        key={i}
                        className="star"
                        style={{
                            left: `${pos.left}%`,
                            top: `${pos.top}%`,
                            animationDelay: `${pos.delay}s`,
                        }}
                    />
                ))}
            </div>

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

            <div className="intro-ocean">
                <div className="ship-container">
                    <div className="ship-hull" />
                </div>
                <div className="waves wave-1" />
                <div className="waves wave-2" />
            </div>

            {showSkip && (
                <div className="skip-button" onClick={handleSkip}>
                    <img src={skipIcon} alt="Überspringen" />
                </div>
            )}

            <div className="loading-bar">
                <div className="loading-progress" />
            </div>
        </div>
    );
}