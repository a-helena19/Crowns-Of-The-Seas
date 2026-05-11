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
    pros: string[];
    cons: string[];
    color: string;
    image: string;
}

export const FACTION_DATA: Record<PlayerFaction, FactionDetails> = {
    'ENGINEERS': {
        id: 'ENGINEERS',
        name: 'Ingenieure',
        icon: '⚙️',
        description: 'Meister der Mechanik – kein Schiff ist vor ihnen sicher.',
        pros: ['+25% günstigere Reparaturen'],
        cons: ['+20% langsameres Laden/Entladen'],
        color: '#FF6B6B',
        image: ingenieureBg
    },
    'REFINERIES': {
        id: 'REFINERIES',
        name: 'Raffinerien',
        icon: '🏭',
        description: 'Kontrollieren die Rohstoffe, kontrollieren die See.',
        pros: ['+25% günstigerer Treibstoff'],
        cons: ['+15% längere Reparaturzeit'],
        color: '#4ECDC4',
        image: raffinerienBg
    },
    'HARBOR_MASTERS': {
        id: 'HARBOR_MASTERS',
        name: 'Hafenmeister',
        icon: '⚓',
        description: 'Jeder Hafen ist ihr Zuhause.',
        pros: ['+30% schnelleres Laden/Entladen'],
        cons: ['+15% teurerer Treibstoff'],
        color: '#45B7D1',
        image: hafenmeisterBg
    },
    'SMUGGLERS': {
        id: 'SMUGGLERS',
        name: 'Schmuggler',
        icon: '🏴‍☠️',
        description: 'Hohes Risiko, hohe Beute – nichts für schwache Nerven.',
        pros: ['+30% bessere Marktpreise', '−30% Schmuggel-Risiko'],
        cons: ['+40% höheres Zoll-Risiko'],
        color: '#FFA502',
        image: schmugglerBg
    },
    'SCOUTS': {
        id: 'SCOUTS',
        name: 'Scouts',
        icon: '🔭',
        description: 'Immer einen Schritt voraus – sie sehen, was andere nicht sehen.',
        pros: ['+50% frühere Auftragserkennung'],
        cons: ['+20% längere Tank-/Reparaturzeit'],
        color: '#95E1D3',
        image: scoutsBg
    },
    'TRADERS': {
        id: 'TRADERS',
        name: 'Händler',
        icon: '💰',
        description: 'Wo andere handeln, verdienen sie doppelt.',
        pros: ['+20% bessere Marktpreise', '+20% mehr Angebotsmenge'],
        cons: ['+20% höheres Schmuggel-Risiko'],
        color: '#F38181',
        image: haendlerBg
    },
    'QUICK_SERVICE': {
        id: 'QUICK_SERVICE',
        name: 'Express-Service',
        icon: '⚡',
        description: 'Zeit ist Geld – und sie verschwenden keins davon.',
        pros: ['−30% Tankzeit', '−30% Reparaturzeit'],
        cons: ['+30% spätere Auftragserkennung'],
        color: '#AA96DA',
        image: expressServiceBg
    }
};