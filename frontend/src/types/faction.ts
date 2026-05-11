import ingenieureBg from '../assets/faction/ingenieure.png';
import raffinerienBg from '../assets/faction/raffinerien.png';
import hafenmeisterBg from '../assets/faction/hafenmeister.png';
import schmugglerBg from '../assets/faction/schmuggler.png';
import scoutsBg from '../assets/faction/scouts.png';
import haendlerBg from '../assets/faction/haendler.png';
import expressServiceBg from '../assets/faction/express_service.png';

export type PlayerFaction =
    | 'ENGINEERS'
    | 'REFINERIES'
    | 'HARBOR_MASTERS'
    | 'SMUGGLERS'
    | 'SCOUTS'
    | 'TRADERS'
    | 'QUICK_SERVICE'

export const PLAYER_FACTION_VALUES = [
    'ENGINEERS',
    'REFINERIES',
    'HARBOR_MASTERS',
    'SMUGGLERS',
    'SCOUTS',
    'TRADERS',
    'QUICK_SERVICE'
] as const;

export interface FactionDetails {
    id: PlayerFaction;
    name: string;
    icon: string;
    description: string;
    color: string;
    image: string;
}

export const FACTION_DATA: Record<PlayerFaction, FactionDetails> = {
    'ENGINEERS': {
        id: 'ENGINEERS',
        name: 'Ingenieure',
        icon: '⚙️',
        description: 'Spezialisiert auf Schiffe. Besserer Treibstoffverbrauch.',
        color: '#FF6B6B',
        image: ingenieureBg
    },
    'REFINERIES': {
        id: 'REFINERIES',
        name: 'Raffinerien',
        icon: '🏭',
        description: 'Kontrollieren Rohstoff-Märkte. Günstigere Cargo-Preise.',
        color: '#4ECDC4',
        image: raffinerienBg
    },
    'HARBOR_MASTERS': {
        id: 'HARBOR_MASTERS',
        name: 'Hafenmeister',
        icon: '⚓',
        description: 'Dominieren Häfen. Schnelleres Laden/Entladen.',
        color: '#45B7D1',
        image: hafenmeisterBg
    },
    'SMUGGLERS': {
        id: 'SMUGGLERS',
        name: 'Schmuggler',
        icon: '🏴‍☠️',
        description: 'Risiko-Spieler. Höhere Belohnungen aber höheres Risiko.',
        color: '#FFA502',
        image: schmugglerBg
    },
    'SCOUTS': {
        id: 'SCOUTS',
        name: 'Scouts',
        icon: '🔭',
        description: 'Erkunder. Besseres Kartenwissen.',
        color: '#95E1D3',
        image: scoutsBg
    },
    'TRADERS': {
        id: 'TRADERS',
        name: 'Händler',
        icon: '💰',
        description: 'Handels-Experten. Bessere Verkaufspreise.',
        color: '#F38181',
        image: haendlerBg
    },
    'QUICK_SERVICE': {
        id: 'QUICK_SERVICE',
        name: 'Express-Service',
        icon: '⚡',
        description: 'Schnell und effizient. Schnellere Reisen.',
        color: '#AA96DA',
        image: expressServiceBg
    }
};