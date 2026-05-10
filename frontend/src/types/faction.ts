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
}

export const FACTION_DATA: Record<PlayerFaction, FactionDetails> = {
    'ENGINEERS': {
        id: 'ENGINEERS',
        name: 'Ingenieure',
        icon: '⚙️',
        description: 'Spezialisiert auf Schiffe. Besserer Treibstoffverbrauch.',
        color: '#FF6B6B'
    },
    'REFINERIES': {
        id: 'REFINERIES',
        name: 'Raffinerien',
        icon: '🏭',
        description: 'Kontrollieren Rohstoff-Märkte. Günstigere Cargo-Preise.',
        color: '#4ECDC4'
    },
    'HARBOR_MASTERS': {
        id: 'HARBOR_MASTERS',
        name: 'Hafenmeister',
        icon: '⚓',
        description: 'Dominieren Häfen. Schnelleres Laden/Entladen.',
        color: '#45B7D1'
    },
    'SMUGGLERS': {
        id: 'SMUGGLERS',
        name: 'Schmuggler',
        icon: '🏴‍☠️',
        description: 'Risiko-Spieler. Höhere Belohnungen aber höheres Risiko.',
        color: '#FFA502'
    },
    'SCOUTS': {
        id: 'SCOUTS',
        name: 'Scouts',
        icon: '🔭',
        description: 'Erkunder. Besseres Kartenwissen.',
        color: '#95E1D3'
    },
    'TRADERS': {
        id: 'TRADERS',
        name: 'Händler',
        icon: '💰',
        description: 'Handels-Experten. Bessere Verkaufspreise.',
        color: '#F38181'
    },
    'QUICK_SERVICE': {
        id: 'QUICK_SERVICE',
        name: 'Express-Service',
        icon: '⚡',
        description: 'Schnell und effizient. Schnellere Reisen.',
        color: '#AA96DA'
    }
};