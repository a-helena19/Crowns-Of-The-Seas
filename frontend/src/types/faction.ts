import ingenieureBg from '../assets/faction/ingenieure.png';
import raffinerienBg from '../assets/faction/raffinerien.png';
import hafenmeisterBg from '../assets/faction/hafenmeister.png';
import schmugglerBg from '../assets/faction/schmuggler.png';
import scoutsBg from '../assets/faction/scouts.png';
import haendlerBg from '../assets/faction/haendler.png';
import expressServiceBg from '../assets/faction/express_service.png';
import ing1 from '../assets/faction/mini-characters/ing1.png';
import ing2 from '../assets/faction/mini-characters/ing2.png';
import ref1 from '../assets/faction/mini-characters/ref1.png';
import ref2 from '../assets/faction/mini-characters/ref2.png';
import hm1 from '../assets/faction/mini-characters/hm1.png';
import hm2 from '../assets/faction/mini-characters/hm2.png';
import smug1 from '../assets/faction/mini-characters/smug1.png';
import smug2 from '../assets/faction/mini-characters/smug2.png';
import scout1 from '../assets/faction/mini-characters/scout1.png';
import scout2 from '../assets/faction/mini-characters/scout2.png';
import hae1 from '../assets/faction/mini-characters/hae1.png';
import hae2 from '../assets/faction/mini-characters/hae2.png';
import ex1 from '../assets/faction/mini-characters/ex1.png';
import ex2 from '../assets/faction/mini-characters/ex2.png';

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
    icon1: string;
    icon2: string;
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
        icon1: ing1,
        icon2: ing2,
        description: 'Meister der Mechanik – kein Schiff ist vor ihnen sicher.',
        pros: ['+25% günstigere Reparaturen'],
        cons: ['+20% langsameres Laden/Entladen'],
        color: '#FF6B6B',
        image: ingenieureBg
    },
    'REFINERIES': {
        id: 'REFINERIES',
        name: 'Raffinerien',
        icon1: ref1,
        icon2: ref2,
        description: 'Kontrollieren die Rohstoffe, kontrollieren die See.',
        pros: ['+25% günstigerer Treibstoff'],
        cons: ['+15% längere Reparaturzeit'],
        color: '#4ECDC4',
        image: raffinerienBg
    },
    'HARBOR_MASTERS': {
        id: 'HARBOR_MASTERS',
        name: 'Hafenmeister',
        icon1: hm1,
        icon2: hm2,
        description: 'Jeder Hafen ist ihr Zuhause.',
        pros: ['+30% schnelleres Laden/Entladen'],
        cons: ['+15% teurerer Treibstoff'],
        color: '#45B7D1',
        image: hafenmeisterBg
    },
    'SMUGGLERS': {
        id: 'SMUGGLERS',
        name: 'Schmuggler',
        icon1: smug1,
        icon2: smug2,
        description: 'Hohes Risiko, hohe Beute – nichts für schwache Nerven.',
        pros: ['+30% bessere Marktpreise', '−30% Schmuggel-Risiko'],
        cons: ['+40% höheres Zoll-Risiko', '+30% häufigere Ereignisse'],
        color: '#FFA502',
        image: schmugglerBg
    },
    'SCOUTS': {
        id: 'SCOUTS',
        name: 'Scouts',
        icon1: scout1,
        icon2: scout2,
        description: 'Immer einen Schritt voraus – sie sehen, was andere nicht sehen.',
        pros: ['+50% frühere Auftragserkennung', '−30% seltenere Ereignisse'],
        cons: ['+20% längere Tank-/Reparaturzeit'],
        color: '#95E1D3',
        image: scoutsBg
    },
    'TRADERS': {
        id: 'TRADERS',
        name: 'Händler',
        icon1: hae1,
        icon2: hae2,
        description: 'Wo andere handeln, verdienen sie doppelt.',
        pros: ['+20% bessere Marktpreise', '+20% mehr Angebotsmenge'],
        cons: ['+20% höheres Schmuggel-Risiko'],
        color: '#F38181',
        image: haendlerBg
    },
    'QUICK_SERVICE': {
        id: 'QUICK_SERVICE',
        name: 'Express-Service',
        icon1: ex1,
        icon2: ex2,
        description: 'Zeit ist Geld – und sie verschwenden keins davon.',
        pros: ['−30% Tankzeit', '−30% Reparaturzeit'],
        cons: ['+30% spätere Auftragserkennung'],
        color: '#AA96DA',
        image: expressServiceBg
    }
};