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
}

// Koordinaten kalibriert: Zielzonen in Wasser-Liegeplätzen, Spawn in offenem Wasser.
export const HARBOR_DOCK_CONFIG: Record<string, HarborDockConfig> = {
    'Hamburg': {
        backgroundImage: hamburgImg,
        landBoundaryY: 0.48,
        arrivalZone: { x: 0.62, y: 0.64, w: 0.14, h: 0.08 },
        arrivalSpawn: { x: 0.28, y: 0.92 },
    },
    'Kapstadt': {
        backgroundImage: kapstadtImg,
        landBoundaryY: 0.38,
        arrivalZone: { x: 0.24, y: 0.58, w: 0.12, h: 0.09 },
        arrivalSpawn: { x: 0.72, y: 0.92 },
    },
    'Mumbai': {
        backgroundImage: mumbaiImg,
        landBoundaryY: 0.28,
        arrivalZone: { x: 0.57, y: 0.50, w: 0.14, h: 0.10 },
        arrivalSpawn: { x: 0.20, y: 0.92 },
    },
    'Los Angeles': {
        backgroundImage: losAngelesImg,
        landBoundaryY: 0.42,
        arrivalZone: { x: 0.38, y: 0.62, w: 0.13, h: 0.09 },
        arrivalSpawn: { x: 0.72, y: 0.92 },
    },
    'New York': {
        backgroundImage: newYorkImg,
        landBoundaryY: 0.35,
        arrivalZone: { x: 0.24, y: 0.58, w: 0.12, h: 0.08 },
        arrivalSpawn: { x: 0.68, y: 0.92 },
    },
    'Santos': {
        backgroundImage: santosImg,
        landBoundaryY: 0.40,
        arrivalZone: { x: 0.32, y: 0.62, w: 0.13, h: 0.09 },
        arrivalSpawn: { x: 0.22, y: 0.92 },
    },
    'Shanghai': {
        backgroundImage: shanghaiImg,
        landBoundaryY: 0.42,
        arrivalZone: { x: 0.42, y: 0.62, w: 0.13, h: 0.09 },
        arrivalSpawn: { x: 0.72, y: 0.92 },
    },
    'Singapur': {
        backgroundImage: singapurImg,
        landBoundaryY: 0.38,
        arrivalZone: { x: 0.40, y: 0.60, w: 0.13, h: 0.10 },
        arrivalSpawn: { x: 0.72, y: 0.92 },
    },
    'Sydney': {
        backgroundImage: sydneyImg,
        landBoundaryY: 0.40,
        arrivalZone: { x: 0.30, y: 0.62, w: 0.13, h: 0.09 },
        arrivalSpawn: { x: 0.72, y: 0.92 },
    },
};

/** Fallback für unbekannte Häfen */
export const DEFAULT_HARBOR_CONFIG: HarborDockConfig = {
    backgroundImage: '',
    landBoundaryY: 0.45,
    arrivalZone: { x: 0.26, y: 0.60, w: 0.15, h: 0.13 },
    arrivalSpawn: { x: 0.50, y: 0.92 },
};

/**
 * Abfahrts-Zielzone — gemeinsam für alle Häfen.
 * Breiter Streifen am unteren Bildrand = Ausfahrt ins offene Meer.
 */
export const DEPARTURE_EXIT_ZONE = { x: 0.50, y: 0.97, w: 0.50, h: 0.05 };
