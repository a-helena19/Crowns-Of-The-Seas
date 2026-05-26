export type SoundCategory = 'music' | 'sfx';

export interface SoundDefinition {
    key: string;
    /** Aufgelöster URL-Pfad (von Vite-Import oder public/-Pfad) */
    url: string | null;
    category: SoundCategory;
    loop?: boolean;
    /** Standard-Lautstärke relativ (0-1) */
    volume?: number;
}

import introMusicUrl from '../assets/audio/intro-music.mp3';
import gameMusicUrl from '../assets/audio/game-music.mp3';
import lobbyMusicUrl from '../assets/audio/lobby-music.mp3';

// Sobald du diese Dateien hast, entkommentiere die Imports:

// SFX – sobald du diese Dateien hast, entkommentiere:
// import clickSfxUrl from '../assets/audio/sfx/click.mp3';
// import shipDepartSfxUrl from '../assets/audio/sfx/ship-depart.mp3';
// import shipArriveSfxUrl from '../assets/audio/sfx/ship-arrive.mp3';
// import coinSfxUrl from '../assets/audio/sfx/coin.mp3';
// import cargoLoadSfxUrl from '../assets/audio/sfx/cargo-load.mp3';
// import notificationSfxUrl from '../assets/audio/sfx/notification.mp3';
// import errorSfxUrl from '../assets/audio/sfx/error.mp3';
// import gameOverSfxUrl from '../assets/audio/sfx/game-over.mp3';

// ─── Musik-Tracks ───
export const MUSIC_TRACKS: Record<string, SoundDefinition> = {
    intro: {
        key: 'music_intro',
        url: introMusicUrl,
        category: 'music',
        loop: false,
        volume: 0.5,
    },
    lobby: {
        key: 'music_lobby',
        url: lobbyMusicUrl,
        category: 'music',
        loop: true,
        volume: 0.3,
    },
    game: {
        key: 'music_game',
        url: gameMusicUrl,
        category: 'music',
        loop: true,
        volume: 0.35,
    },
};

// ─── Soundeffekte ───
export const SFX: Record<string, SoundDefinition> = {
    buttonClick: {
        key: 'sfx_click',
        url: null,                    // ← clickSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.6,
    },
    shipDepart: {
        key: 'sfx_depart',
        url: null,                    // ← shipDepartSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.7,
    },
    shipArrive: {
        key: 'sfx_arrive',
        url: null,                    // ← shipArriveSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.7,
    },
    coinReward: {
        key: 'sfx_coin',
        url: null,                    // ← coinSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.5,
    },
    cargoLoad: {
        key: 'sfx_cargo_load',
        url: null,                    // ← cargoLoadSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.5,
    },
    notification: {
        key: 'sfx_notification',
        url: null,                    // ← notificationSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.4,
    },
    error: {
        key: 'sfx_error',
        url: null,                    // ← errorSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.5,
    },
    gameOver: {
        key: 'sfx_gameover',
        url: null,                    // ← gameOverSfxUrl wenn vorhanden
        category: 'sfx',
        volume: 0.8,
    },
};