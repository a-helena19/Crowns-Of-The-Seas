import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import audioEngine, { type AudioSettings } from './AudioEngine';

interface AudioSettingsContextValue {
    settings: AudioSettings;
    setMusicEnabled: (enabled: boolean) => void;
    setSfxEnabled: (enabled: boolean) => void;
    setMusicVolume: (volume: number) => void;
    setSfxVolume: (volume: number) => void;
    playMusic: (track: string) => void;
    stopMusic: () => void;
    playSfx: (key: string) => void;
}

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null);

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AudioSettings>(audioEngine.getSettings());

    useEffect(() => {
        const unsubscribe = audioEngine.subscribe((newSettings) => {
            setSettings(newSettings);
        });
        return unsubscribe;
    }, []);

    const value: AudioSettingsContextValue = {
        settings,
        setMusicEnabled: (enabled) => audioEngine.updateSettings({ musicEnabled: enabled }),
        setSfxEnabled: (enabled) => audioEngine.updateSettings({ sfxEnabled: enabled }),
        setMusicVolume: (volume) => audioEngine.updateSettings({ musicVolume: volume }),
        setSfxVolume: (volume) => audioEngine.updateSettings({ sfxVolume: volume }),
        playMusic: (track) => audioEngine.playMusic(track),
        stopMusic: () => audioEngine.stopMusic(),
        playSfx: (key) => audioEngine.playSfx(key),
    };

    return (
        <AudioSettingsContext.Provider value={value}>
            {children}
        </AudioSettingsContext.Provider>
    );
}

export function useAudioSettings(): AudioSettingsContextValue {
    const ctx = useContext(AudioSettingsContext);
    if (!ctx) {
        throw new Error('useAudioSettings muss innerhalb von AudioSettingsProvider verwendet werden');
    }
    return ctx;
}