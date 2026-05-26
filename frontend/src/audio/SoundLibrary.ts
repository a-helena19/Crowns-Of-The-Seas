export type SoundCategory = 'music' | 'sfx';

export interface SoundDefinition {
    key: string;
    url: string | null;
    category: SoundCategory;
    loop?: boolean;
    volume?: number;
}

import introMusicUrl from '../assets/audio/intro-music.mp3';
import gameMusicUrl from '../assets/audio/game-music.mp3';
import lobbyMusicUrl from '../assets/audio/lobby-music.mp3';

// SFX – sobald du diese Dateien hast, entkommentiere:
import clickSfxUrl from '../assets/audio/sfx/click.mp3';
// import shipDepartSfxUrl from '../assets/audio/sfx/ship-depart.mp3';
// import shipArriveSfxUrl from '../assets/audio/sfx/ship-arrive.mp3';
import coinSfxUrl from '../assets/audio/sfx/coin.mp3';
// import cargoLoadSfxUrl from '../assets/audio/sfx/cargo-load.mp3';
import notificationSfxUrl from '../assets/audio/sfx/notification.mp3';
import errorSfxUrl from '../assets/audio/sfx/error.mp3';
import gameOverSfxUrl from '../assets/audio/sfx/game-over.mp3';

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
        volume: 0.7,
    },
};

// ─── Soundeffekte ───
export const SFX: Record<string, SoundDefinition> = {
    buttonClick: {
        key: 'sfx_click',
        url: clickSfxUrl,
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
        url: coinSfxUrl,
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
        url: notificationSfxUrl,
        category: 'sfx',
        volume: 0.4,
    },
    error: {
        key: 'sfx_error',
        url: errorSfxUrl,
        category: 'sfx',
        volume: 0.5,
    },
    gameOver: {
        key: 'sfx_gameover',
        url: gameOverSfxUrl,
        category: 'sfx',
        volume: 0.8,
    },
};