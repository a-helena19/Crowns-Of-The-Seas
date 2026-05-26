// src/audio/SoundLibrary.ts

export type SoundCategory = 'music' | 'sfx';

export interface SoundDefinition {
    key: string;
    url: string | null;
    category: SoundCategory;
    loop?: boolean;
    volume?: number;
}

// ─── Musik-Imports ───
import introMusicUrl from '../assets/audio/intro-music.mp3';
import gameMusicUrl from '../assets/audio/game-music.mp3';
import lobbyMusicUrl from '../assets/audio/lobby-music.mp3';
import dockingMusicUrl from '../assets/audio/docking-music.mp3';
import ratMusicUrl from '../assets/audio/rat-music.mp3';

// ─── SFX-Imports ───
import clickSfxUrl from '../assets/audio/sfx/click.mp3';
import coinSfxUrl from '../assets/audio/sfx/coin.mp3';
import notificationSfxUrl from '../assets/audio/sfx/notification.mp3';
import errorSfxUrl from '../assets/audio/sfx/error.mp3';
import gameOverSfxUrl from '../assets/audio/sfx/game-over.mp3';
import crashSfxUrl from '../assets/audio/sfx/crash.mp3';
import doorSfxUrl from '../assets/audio/sfx/door.mp3';
import dockingSuccessSfxUrl from '../assets/audio/sfx/docking-success.mp3';
import ratKillSfxUrl from '../assets/audio/sfx/rat-kill.mp3';
import ratSqueaksSfxUrl from '../assets/audio/sfx/rat-squeaks.mp3';
import ratTickingSfxUrl from '../assets/audio/sfx/rat-ticking.mp3';

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
    docking: {
        key: 'music_docking',
        url: dockingMusicUrl,
        category: 'music',
        loop: true,
        volume: 0.5,
    },
    rats: {
        key: 'music_rats',
        url: ratMusicUrl,
        category: 'music',
        loop: true,
        volume: 0.5,
    },
};

// ─── Soundeffekte ───
export const SFX: Record<string, SoundDefinition> = {
    // ── UI ──
    buttonClick: {
        key: 'sfx_click',
        url: clickSfxUrl,
        category: 'sfx',
        volume: 0.6,
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

    // ── Gameplay ──
    coinReward: {
        key: 'sfx_coin',
        url: coinSfxUrl,
        category: 'sfx',
        volume: 0.5,
    },
    gameOver: {
        key: 'sfx_gameover',
        url: gameOverSfxUrl,
        category: 'sfx',
        volume: 0.8,
    },
    door: {
        key: 'sfx_door',
        url: doorSfxUrl,
        category: 'sfx',
        volume: 0.5,
    },

    // ── Schiff & Cargo ──
    shipDepart: {
        key: 'sfx_depart',
        url: null,           // departure sound später einfügen
        category: 'sfx',
        volume: 0.7,
    },
    shipArrive: {
        key: 'sfx_arrive',
        url: null,    // arrival sound später einfügen
        category: 'sfx',
        volume: 0.7,
    },
    cargoLoad: {
        key: 'sfx_cargo_load',
        url: null,           // louding sound später einfügen
        category: 'sfx',
        volume: 0.5,
    },

    // ── Docking-Minigame ──
    dockingSuccess: {
        key: 'sfx_docking_success',
        url: dockingSuccessSfxUrl,
        category: 'sfx',
        volume: 0.4,
    },
    dockingCrash: {
        key: 'sfx_docking_crash',
        url: crashSfxUrl,
        category: 'sfx',
        volume: 0.5,
    },

    // ── Ratten-Minigame ──
    ratKill: {
        key: 'sfx_rat_kill',
        url: ratKillSfxUrl,
        category: 'sfx',
        volume: 0.6,
    },
    ratSqueak: {
        key: 'sfx_rat_squeak',
        url: ratSqueaksSfxUrl,
        category: 'sfx',
        volume: 0.5,
    },

    ratTickingClock: {
        key: 'sfx_rat_ticking_clock',
        url: ratTickingSfxUrl,
        category: 'sfx',
        volume: 0.9,
    },
};