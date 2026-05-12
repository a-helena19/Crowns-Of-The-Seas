import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSessionWebSocket } from '../hooks/useGameSessionWebSocket';
import '../style/intro.css';
import skipIcon from '../assets/intro/skip.png';
import introMusic from '../assets/audio/intro-music.mp3';

const INTRO_DURATION_MS = 6000;

export default function IntroAnimation() {
    const navigate = useNavigate();
    const [showSkip, setShowSkip] = useState(false);
    const [audioStarted, setAudioStarted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
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
        navigate('/session-waiting');
    }, [navigate]);

    const handleUnmute = () => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio(introMusic);
                audioRef.current.volume = 0.5;
                audioRef.current.loop = false;
            }
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setAudioStarted(true))
                    .catch(error => console.log('Audio-Fehler:', error));
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
        const skipTimer = setTimeout(() => setShowSkip(true), 1000);
        const redirectTimer = setTimeout(goBackToWaiting, INTRO_DURATION_MS);

        return () => {
            clearTimeout(skipTimer);
            clearTimeout(redirectTimer);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [goBackToWaiting]);

    const handleSkip = () => goBackToWaiting();

    return (
        <div className="intro-container">
            {!audioStarted && (
                <div className="unmute-button" onClick={handleUnmute} title="Sound einschalten">
                    🔇
                </div>
            )}

            {audioStarted && (
                <div className="mute-button" onClick={handleMute} title="Sound stumm schalten">
                    🔊
                </div>
            )}

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