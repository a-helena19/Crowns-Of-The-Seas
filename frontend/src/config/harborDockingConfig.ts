import hamburgImg    from '../assets/harbors/Hamburg.png';
import kapstadtImg   from '../assets/harbors/Kapstadt.png';
import losAngelesImg from '../assets/harbors/Los_Angeles.png';
import newYorkImg    from '../assets/harbors/New_York.png';
import santosImg     from '../assets/harbors/Santos.png';
import shanghaiImg   from '../assets/harbors/Shanghai.png';
import singapurImg   from '../assets/harbors/Singapur.png';
import mumbaiImg     from '../assets/harbors/Mumbai.png';
import sydneyImg     from '../assets/harbors/Sydney.png';

export interface HarborDockConfig {
    backgroundImage: string;
    /**
     * Y-Grenze der Landmasse (0–1 von oben).
     * Fallback-Kollision wenn kein Hafenbild geladen ist.
     */
    landBoundaryY: number;
    /**
     * Zielfeld beim Anlegen (Ankunft) — normalisiert (0–1 relativ zur Canvas).
     * x/y = Mittelpunkt, w/h = Breite/Höhe als Anteil der Canvas-Größe.
     * Muss im Wasser neben dem Steg liegen.
     */
    arrivalZone: { x: number; y: number; w: number; h: number };
    /**
     * Startposition bei Ankunft — offenes Wasser am unteren Bildrand.
     */
    arrivalSpawn: { x: number; y: number };
    /**
     * Startposition für Abfahrt (optional). Wenn gesetzt, startet das Schiff
     * im Abfahrts-Minigame hier statt an der arrivalZone-Position.
     * Nötig wenn arrivalZone von Stegen umgeben ist und wenig Manövrierraum lässt.
     */
    departureSpawn?: { x: number; y: number };
}

// Koordinaten kalibriert: Zielzonen in Wasser-Liegeplätzen, Spawn in offenem Wasser.
// Zone-Y um +0.04 erhöht damit der Anlege-Bereich zugänglich ist ohne sofortigen Wandkontakt.
export const HARBOR_DOCK_CONFIG: Record<string, HarborDockConfig> = {
    'Hamburg': {
        backgroundImage: hamburgImg,
        landBoundaryY: 0.48,
        arrivalZone: { x: 0.62, y: 0.68, w: 0.07, h: 0.04 },
        arrivalSpawn: { x: 0.18, y: 0.92 },
    },
    'Kapstadt': {
        backgroundImage: kapstadtImg,
        landBoundaryY: 0.38,
        arrivalZone: { x: 0.24, y: 0.62, w: 0.06, h: 0.04 },
        arrivalSpawn: { x: 0.82, y: 0.92 },
    },
    'Mumbai': {
        backgroundImage: mumbaiImg,
        landBoundaryY: 0.28,
        arrivalZone: { x: 0.57, y: 0.54, w: 0.07, h: 0.05 },
        arrivalSpawn: { x: 0.15, y: 0.92 },
    },
    'Los Angeles': {
        backgroundImage: losAngelesImg,
        landBoundaryY: 0.42,
        arrivalZone: { x: 0.38, y: 0.66, w: 0.06, h: 0.04 },
        arrivalSpawn: { x: 0.82, y: 0.92 },
    },
    'New York': {
        backgroundImage: newYorkImg,
        landBoundaryY: 0.35,
        arrivalZone: { x: 0.24, y: 0.62, w: 0.06, h: 0.04 },
        arrivalSpawn: { x: 0.80, y: 0.92 },
    },
    'Santos': {
        backgroundImage: santosImg,
        landBoundaryY: 0.40,
        arrivalZone: { x: 0.32, y: 0.66, w: 0.06, h: 0.04 },
        arrivalSpawn: { x: 0.80, y: 0.92 },
    },
    'Shanghai': {
        backgroundImage: shanghaiImg,
        landBoundaryY: 0.42,
        arrivalZone: { x: 0.42, y: 0.66, w: 0.06, h: 0.04 },
        arrivalSpawn: { x: 0.82, y: 0.92 },
    },
    'Singapur': {
        backgroundImage: singapurImg,
        landBoundaryY: 0.38,
        arrivalZone: { x: 0.40, y: 0.64, w: 0.06, h: 0.05 },
        arrivalSpawn: { x: 0.82, y: 0.92 },
        // Anlege-Zone liegt zwischen Stegen — Abfahrts-Spawn in die rechte Bucht zwischen den Piers
        departureSpawn: { x: 0.54, y: 0.50 },
    },
    'Sydney': {
        backgroundImage: sydneyImg,
        landBoundaryY: 0.40,
        arrivalZone: { x: 0.30, y: 0.66, w: 0.06, h: 0.04 },
        arrivalSpawn: { x: 0.82, y: 0.92 },
    },
};

/** Fallback für unbekannte Häfen */
export const DEFAULT_HARBOR_CONFIG: HarborDockConfig = {
    backgroundImage: '',
    landBoundaryY: 0.45,
    arrivalZone: { x: 0.26, y: 0.64, w: 0.07, h: 0.06 },
    arrivalSpawn: { x: 0.50, y: 0.92 },
};

/**
 * Abfahrts-Zielzone — gemeinsam für alle Häfen.
 * War: w: 0.50, h: 0.05 — jetzt halbiert.
 */
export const DEPARTURE_EXIT_ZONE = { x: 0.50, y: 0.97, w: 0.25, h: 0.03 };
