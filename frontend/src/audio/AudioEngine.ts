import { MUSIC_TRACKS, SFX, type SoundDefinition } from './SoundLibrary';

export interface AudioSettings {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    musicVolume: number;  // 0 - 1
    sfxVolume: number;    // 0 - 1
}

const STORAGE_KEY = 'crowns_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.7,
};

class AudioEngine {
    private static instance: AudioEngine;

    private settings: AudioSettings;
    private currentMusic: HTMLAudioElement | null = null;
    private currentMusicKey: string | null = null;
    private listeners: Set<(settings: AudioSettings) => void> = new Set();

    private constructor() {
        this.settings = this.loadSettings();
    }

    static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    // ════════════════════════════════════════
    //  Settings
    // ════════════════════════════════════════

    private loadSettings(): AudioSettings {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (e) {
            console.warn('AudioEngine: Fehler beim Laden der Settings', e);
        }
        return { ...DEFAULT_SETTINGS };
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('AudioEngine: Fehler beim Speichern der Settings', e);
        }
        this.notifyListeners();
    }

    getSettings(): AudioSettings {
        return { ...this.settings };
    }

    updateSettings(partial: Partial<AudioSettings>): void {
        this.settings = { ...this.settings, ...partial };
        this.saveSettings();

        // Live-Updates auf aktuelle Musik anwenden
        if (this.currentMusic) {
            if (!this.settings.musicEnabled) {
                this.currentMusic.pause();
            } else {
                const def = this.currentMusicKey ? MUSIC_TRACKS[this.currentMusicKey] : null;
                this.currentMusic.volume = this.computeMusicVolume(def ?? undefined);

                if (this.currentMusic.paused && this.currentMusicKey) {
                    this.currentMusic.play().catch(() => {});
                }
            }
        }
    }

    // ════════════════════════════════════════
    //  Listener (für React Context)
    // ════════════════════════════════════════

    subscribe(listener: (settings: AudioSettings) => void): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    private notifyListeners(): void {
        const snapshot = this.getSettings();
        this.listeners.forEach(fn => fn(snapshot));
    }

    // ════════════════════════════════════════
    //  Musik
    // ════════════════════════════════════════

    private computeMusicVolume(def?: SoundDefinition): number {
        const base = def?.volume ?? 0.5;
        return base * this.settings.musicVolume;
    }

    playMusic(trackKey: string): void {
        const def = MUSIC_TRACKS[trackKey];
        if (!def) {
            console.warn(`AudioEngine: Unbekannter Music-Track "${trackKey}"`);
            return;
        }

        // ★ KERNFIX: Prüfe ob URL vorhanden ist
        if (!def.url) {
            console.log(`AudioEngine: Track "${trackKey}" hat keine Audio-Datei (url ist null) – übersprungen.`);
            this.currentMusicKey = trackKey; // Merken, damit crossfadeTo funktioniert
            return;
        }

        // Wenn gleicher Track schon läuft, nicht neu starten
        if (this.currentMusicKey === trackKey && this.currentMusic && !this.currentMusic.paused) {
            return;
        }

        // Alten Track stoppen
        this.stopMusic();

        if (!this.settings.musicEnabled) {
            this.currentMusicKey = trackKey;
            return;
        }

        try {
            const audio = new Audio(def.url);
            audio.loop = def.loop ?? false;
            audio.volume = this.computeMusicVolume(def);

            // Fehler beim Laden abfangen (z.B. 404)
            audio.addEventListener('error', () => {
                console.warn(`AudioEngine: Konnte "${trackKey}" nicht laden (${def.url})`);
                this.currentMusic = null;
                // currentMusicKey bleibt gesetzt
            });

            audio.play().catch(err => {
                // Kein harter Fehler – passiert bei fehlender User-Interaktion
                console.log(`AudioEngine: Play-Fehler für "${trackKey}":`, err.message);
            });

            this.currentMusic = audio;
            this.currentMusicKey = trackKey;
        } catch (err) {
            console.warn(`AudioEngine: Fehler beim Erstellen des Audio-Elements für "${trackKey}":`, err);
        }
    }

    stopMusic(): void {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
        this.currentMusicKey = null;
    }

    /** Fade-out über eine gegebene Dauer (ms), dann Track stoppen */
    fadeOutMusic(durationMs: number = 1000): Promise<void> {
        return new Promise(resolve => {
            if (!this.currentMusic || this.currentMusic.paused) {
                this.currentMusicKey = null;
                resolve();
                return;
            }

            const audio = this.currentMusic;
            const startVolume = audio.volume;
            const steps = 20;
            const interval = durationMs / steps;
            let step = 0;

            const timer = setInterval(() => {
                step++;
                audio.volume = Math.max(0, startVolume * (1 - step / steps));

                if (step >= steps) {
                    clearInterval(timer);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = startVolume;
                    this.currentMusic = null;
                    this.currentMusicKey = null;
                    resolve();
                }
            }, interval);
        });
    }

    /** Wechsle den Track mit Crossfade */
    async crossfadeTo(trackKey: string, fadeMs: number = 800): Promise<void> {
        // Nur fade-out wenn tatsächlich etwas spielt
        if (this.currentMusic && !this.currentMusic.paused) {
            await this.fadeOutMusic(fadeMs);
        } else {
            this.currentMusicKey = null;
        }
        this.playMusic(trackKey);
    }

    // ════════════════════════════════════════
    //  Soundeffekte
    // ════════════════════════════════════════

    playSfx(sfxKey: string): void {
        if (!this.settings.sfxEnabled) return;

        const def = SFX[sfxKey];
        if (!def) {
            console.warn(`AudioEngine: Unbekannter SFX "${sfxKey}"`);
            return;
        }

        // ★ KERNFIX: Prüfe ob URL vorhanden ist
        if (!def.url) {
            // Still ignorieren – kein Fehler, Datei einfach noch nicht vorhanden
            return;
        }

        try {
            const audio = new Audio(def.url);
            audio.volume = (def.volume ?? 0.5) * this.settings.sfxVolume;

            audio.addEventListener('error', () => {
                console.warn(`AudioEngine: SFX "${sfxKey}" konnte nicht geladen werden`);
            });

            audio.play().catch(() => {
                // Still ignorieren
            });

            audio.addEventListener('ended', () => {
                audio.remove();
            });
        } catch {
            // Still ignorieren
        }
    }

    // ════════════════════════════════════════
    //  Hilfsfunktionen
    // ════════════════════════════════════════

    /** Muss nach erster User-Interaktion aufgerufen werden (Browser-Policy) */
    resumeAfterInteraction(): void {
        if (this.settings.musicEnabled && this.currentMusicKey && this.currentMusic?.paused) {
            this.currentMusic.play().catch(() => {});
        }
    }

    /** Alles stoppen (z.B. beim Logout) */
    destroyAll(): void {
        this.stopMusic();
    }

    get isMusicPlaying(): boolean {
        return !!this.currentMusic && !this.currentMusic.paused;
    }

    get currentTrack(): string | null {
        return this.currentMusicKey;
    }
}

// Exportiere Singleton-Instanz
export const audioEngine = AudioEngine.getInstance();
export default audioEngine;