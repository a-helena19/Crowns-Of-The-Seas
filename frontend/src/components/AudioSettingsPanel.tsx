import { useState } from 'react';
import { useAudioSettings } from '../audio/AudioSettingsContext';
import '../style/AudioSettingsPanel.css';

interface Props {
    /** Kompakter Modus für In-Game (nur Icon + Dropdown) */
    compact?: boolean;
}

export default function AudioSettingsPanel({ compact = false }: Props) {
    const {
        settings,
        setMusicEnabled,
        setSfxEnabled,
        setMusicVolume,
        setSfxVolume,
    } = useAudioSettings();

    const [isOpen, setIsOpen] = useState(false);

    if (compact) {
        return (
            <div className="audio-settings-compact">
                <button
                    className="audio-toggle-btn"
                    onClick={() => setIsOpen(!isOpen)}
                    title="Audio Einstellungen"
                >
                    {settings.musicEnabled || settings.sfxEnabled ? '🔊' : '🔇'}
                </button>

                {isOpen && (
                    <div className="audio-dropdown">
                        <AudioControls
                            settings={settings}
                            onMusicToggle={setMusicEnabled}
                            onSfxToggle={setSfxEnabled}
                            onMusicVolume={setMusicVolume}
                            onSfxVolume={setSfxVolume}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="audio-settings-panel">
            <h3 className="audio-settings-title">🔊 Audio Einstellungen</h3>
            <AudioControls
                settings={settings}
                onMusicToggle={setMusicEnabled}
                onSfxToggle={setSfxEnabled}
                onMusicVolume={setMusicVolume}
                onSfxVolume={setSfxVolume}
            />
        </div>
    );
}

function AudioControls({
                           settings,
                           onMusicToggle,
                           onSfxToggle,
                           onMusicVolume,
                           onSfxVolume,
                       }: {
    settings: { musicEnabled: boolean; sfxEnabled: boolean; musicVolume: number; sfxVolume: number };
    onMusicToggle: (v: boolean) => void;
    onSfxToggle: (v: boolean) => void;
    onMusicVolume: (v: number) => void;
    onSfxVolume: (v: number) => void;
}) {
    return (
        <div className="audio-controls">
            {/* Musik */}
            <div className="audio-row">
                <label className="audio-label">
                    <span className="audio-icon">🎵</span>
                    Musik
                </label>
                <div className="audio-row-controls">
                    <button
                        className={`toggle-btn ${settings.musicEnabled ? 'on' : 'off'}`}
                        onClick={() => onMusicToggle(!settings.musicEnabled)}
                    >
                        {settings.musicEnabled ? 'AN' : 'AUS'}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(settings.musicVolume * 100)}
                        onChange={(e) => onMusicVolume(Number(e.target.value) / 100)}
                        disabled={!settings.musicEnabled}
                        className="volume-slider"
                    />
                    <span className="volume-value">
            {Math.round(settings.musicVolume * 100)}%
          </span>
                </div>
            </div>

            {/* Soundeffekte */}
            <div className="audio-row">
                <label className="audio-label">
                    <span className="audio-icon">🔔</span>
                    Soundeffekte
                </label>
                <div className="audio-row-controls">
                    <button
                        className={`toggle-btn ${settings.sfxEnabled ? 'on' : 'off'}`}
                        onClick={() => onSfxToggle(!settings.sfxEnabled)}
                    >
                        {settings.sfxEnabled ? 'AN' : 'AUS'}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(settings.sfxVolume * 100)}
                        onChange={(e) => onSfxVolume(Number(e.target.value) / 100)}
                        disabled={!settings.sfxEnabled}
                        className="volume-slider"
                    />
                    <span className="volume-value">
            {Math.round(settings.sfxVolume * 100)}%
          </span>
                </div>
            </div>
        </div>
    );
}