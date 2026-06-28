import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import audioEngine from '../audio/AudioEngine';
import { useFullscreen } from '../context/FullscreenContext';
import '../style/startScreen.css';

export default function StartScreen() {
    const navigate = useNavigate();
    const [leaving, setLeaving] = useState(false);
    const { requestRecommendedFullscreen } = useFullscreen();

    const handleEnter = async () => {
        if (leaving) return;
        setLeaving(true);
        await requestRecommendedFullscreen();
        audioEngine.markInteracted();
        audioEngine.playMusic('lobby');

        // Kurz warten damit die Exit-Animation sichtbar ist
        setTimeout(() => navigate('/lobby'), 600);
    };

    return (
        <div className={`start-screen ${leaving ? 'leaving' : ''}`}>

            {/* Mond */}
            <div className="start-moon" />

            {/* Sterne */}
            <div className="start-stars">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="start-star"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 40}%`,
                            animationDelay: `${Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Logo & Text — kommt von oben */}
            <div className="start-logo-area">
                <h1 className="start-title">Crown of the Seas</h1>
                <div className="start-divider">⚓</div>
                <p className="start-subtitle">Ein Handels- und Seefahrt-Abenteuer</p>
            </div>

            {/* Button — fadet ein nachdem Logo gelandet ist */}
            <button className="start-btn" onClick={handleEnter}>
                Spiel starten
            </button>

            {/* Ozean + Schiff — kommt von unten */}
            <div className="start-ocean-area">
                <div className="start-ship-container">
                    <div className="start-ship" />
                </div>
                <div className="start-waves start-wave-1" />
                <div className="start-waves start-wave-2" />
            </div>
        </div>
    );
}
