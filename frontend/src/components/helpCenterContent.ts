// Inhalt für das Kapitänshandbuch (In-Game Hilfe-Center).
// Reiner Daten-Inhalt – die Darstellung übernimmt HelpCenter.tsx.
// Texte sind bewusst kurz und aus Spielersicht geschrieben.

import lobbyStart from "../assets/help/lobby-start.png";
import sessionsResume from "../assets/help/sessions-resume.png";
import audioSettings from "../assets/help/audio-settings.png";
import shipMarketTabs from "../assets/help/ship-market-tabs.png";
import shipDetail from "../assets/help/ship-detail.png";
import shipcardReady from "../assets/help/shipcard-ready.png";
import toggleOtherShips from "../assets/help/toggle-other-ships.png";
import cargoBoard from "../assets/help/cargo-board.png";
import mapMumbaiGold from "../assets/help/map-mumbai-gold.png";
import worldMap from "../assets/help/world-map.png";
import routeSpeed from "../assets/help/route-speed.png";
import shipcardDocking from "../assets/help/shipcard-docking.png";
import captainActions from "../assets/help/captain-actions.png";
import eventStorm from "../assets/help/event-storm-dialog.png";
import minigameTreasure from "../assets/help/minigame-treasure.png";
import smuggleOffer from "../assets/help/smuggle-offer.png";
import customsDialog from "../assets/help/customs-dialog.png";
import customsBribeFailed from "../assets/help/customs-bribe-failed.png";
import portProfileActions from "../assets/help/port-profile-actions.png";
import leaderboard from "../assets/help/leaderboard.png";
import gameoverPodium from "../assets/help/gameover-podium.png";
import factionIngenieure from "../assets/help/faction-ingenieure.png";
import factionRaffinerien from "../assets/help/faction-raffinerien.png";
import factionHafenmeister from "../assets/help/faction-hafenmeister.png";
import factionExpress from "../assets/help/faction-express.png";
import factionScouts from "../assets/help/faction-scouts.png";
import factionHaendler from "../assets/help/faction-haendler.png";
import factionSchmuggler from "../assets/help/faction-schmuggler.png";

export interface HelpImage {
    src: string;
    caption?: string;
}

export interface HelpPage {
    title: string;
    intro?: string;
    paragraphs?: string[];
    bullets?: string[];
    note?: string;
    images?: HelpImage[];
    gallery?: boolean; // mehrere Bilder nebeneinander
}

export interface HelpChapter {
    id: string;
    numeral: string;
    title: string;
    subtitle: string;
    color: string;
    pages: HelpPage[];
}

export const HELP_CHAPTERS: HelpChapter[] = [
    {
        id: "start",
        numeral: "I",
        title: "Erste Schritte",
        subtitle: "Ankommen & loslegen",
        color: "#2f6d8c",
        pages: [
            {
                title: "Willkommen, Kapitän",
                intro: "In Crowns of the Seas führst du eine kleine Reederei und handelst zwischen den großen Häfen der Welt.",
                paragraphs: [
                    "Dein Ziel ist das größte Vermögen der Runde. Gewertet wird dein Gesamtvermögen – also dein Bargeld plus der Wert all deiner Schiffe. Wer am Ende vorne liegt, wird zum Herrscher der Meere gekrönt.",
                    "Bezahlt wird in Talern (T). Die Zeit läuft in Spieltagen: Oben siehst du den aktuellen Tag und das Rundenende (z. B. Tag 69 / 1200).",
                ],
                images: [{ src: lobbyStart, caption: "Die Lobby vor dem Start" }],
            },
            {
                title: "Runde erstellen oder beitreten",
                paragraphs: [
                    "Eine Runde heißt Session. Du kannst selbst eine erstellen (dann bist du der Host) oder einer bestehenden über ihren Spiel-Code beitreten.",
                    "Beim Erstellen legst du als Host drei Dinge fest:",
                ],
                bullets: [
                    "Max. Spieler – wie viele mitspielen (2 bis 4).",
                    "Spieltempo – wie schnell die Tage vergehen.",
                    "Spieldauer – wie lang die Runde insgesamt läuft, von kurzen Test-Längen bis zu mehreren Stunden.",
                ],
                note: "Begonnene Runden findest du unter „Deine aktiven Spiele\" wieder und kannst sie fortsetzen.",
                images: [{ src: sessionsResume, caption: "Laufende Spiele fortsetzen" }],
            },
            {
                title: "Ablauf & Verlassen",
                paragraphs: [
                    "Jede Runde läuft in vier Phasen: erst die Lobby, dann die Fraktionswahl, dann das eigentliche Spiel, und am Ende der Ergebnis-Bildschirm.",
                    "Du kannst jederzeit verlassen – deine Schiffe, Frachten und dein Konto bleiben erhalten, du kannst später wieder einsteigen.",
                ],
                note: "Verlassen alle Spieler die Runde, wird sie endgültig geschlossen. Soll es weitergehen, bleibt am besten jemand verbunden.",
            },
            {
                title: "Hilfe, Sound & Musik",
                paragraphs: [
                    "Dieses Handbuch erreichst du jederzeit über das Buch-Symbol oben rechts. Blättere in Ruhe – das Spiel wartet so lange.",
                    "Im selben Menü stellst du Musik und Soundeffekte ein: jeweils an- und ausschalten und die Lautstärke frei regeln.",
                ],
                images: [{ src: audioSettings, caption: "Musik & Effekte im Menü" }],
            },
        ],
    },
    {
        id: "ship",
        numeral: "II",
        title: "Dein Schiff",
        subtitle: "Kaufen, verstehen, steuern",
        color: "#9c6b2e",
        pages: [
            {
                title: "Schiffe kaufen",
                paragraphs: [
                    "Ohne Schiffe kein Handel. Auf dem Markt findest du Schiffe in drei Klassen:",
                ],
                bullets: [
                    "Budget – günstig, kleiner Laderaum. Gut für den Einstieg.",
                    "Standard – ausgewogener Allrounder.",
                    "Premium – teuer, aber großer Laderaum, schnell und zuverlässig.",
                ],
                note: "Achte auf Laderaum, Geschwindigkeit und Verbrauch – sie entscheiden, welche Routen sich lohnen.",
                images: [{ src: shipMarketTabs, caption: "Markt: Klassen, Gebraucht & Angebote" }],
            },
            {
                title: "Angebote & Gebrauchtschiffe",
                paragraphs: [
                    "Im Markt tauchen immer wieder zeitlich begrenzte Angebote mit Rabatt auf – nur in kleiner Stückzahl und für kurze Zeit. Wer zuerst kommt, kauft günstiger.",
                    "Du kannst Schiffe auch wieder verkaufen. Der Preis richtet sich vor allem nach dem Zustand: Ein gepflegtes Schiff bringt deutlich mehr. Gebrauchte Schiffe anderer Spieler kannst du günstiger übernehmen.",
                ],
                images: [{ src: shipDetail, caption: "Ein Schiff im Detail" }],
            },
            {
                title: "Die Schiffskarte",
                paragraphs: [
                    "Jedes Schiff hat eine Karte mit Name, Status sowie zwei Balken: Tank (Treibstoff) und Zustand.",
                    "Die Karte leuchtet auf, sobald du etwas entscheiden musst – etwa wenn das Schiff reisebereit ist, anlegen muss, ein Angebot vorliegt oder ein Ereignis ansteht. Tippe sie dann an.",
                ],
                note: "Ruhige Karten brauchen nichts von dir. Leuchtet eine Karte, will dein Schiff eine Entscheidung.",
                images: [{ src: shipcardReady, caption: "Reisebereit – wartet auf die Abfahrt" }],
            },
            {
                title: "Andere Schiffe anzeigen",
                paragraphs: [
                    "Auf der Karte siehst du normalerweise auch die Schiffe der anderen Kapitäne unterwegs.",
                    "Mit „Andere Schiffe anzeigen\" blendest du sie ein oder aus – schalte sie aus, wenn du dich nur auf deine eigene Flotte konzentrieren willst.",
                ],
                images: [{ src: toggleOtherShips, caption: "Fremde Schiffe ein- oder ausblenden" }],
            },
        ],
    },
    {
        id: "cargo",
        numeral: "III",
        title: "Fracht & Häfen",
        subtitle: "Aufträge & die Welt",
        color: "#6f7d39",
        pages: [
            {
                title: "Die Frachtbörse",
                paragraphs: [
                    "Auf der Frachtbörse nimmst du Transportaufträge an. Jeder Auftrag hat einen Start- und Zielhafen, einen Platzbedarf im Laderaum und eine Belohnung, die du bei pünktlicher Lieferung erhältst.",
                    "Manche Aufträge sind dauerhaft verfügbar, andere verschwinden wieder, wenn sie niemand annimmt.",
                ],
                images: [{ src: cargoBoard, caption: "Ein Auftrag auf der Frachtbörse" }],
            },
            {
                title: "Frachttypen & Luxus",
                paragraphs: [
                    "Der Frachttyp bestimmt, wie empfindlich eine Ware ist. Verderbliche Ware (z. B. Lebensmittel) muss schnell ankommen, zerbrechliche Ware leidet unter rauen Passagen.",
                    "Luxusgüter bringen am meisten ein. Häfen mit Luxusaufträgen leuchten auf der Karte golden – ein klares Zeichen, dass sich der Weg lohnt.",
                ],
                note: "Verderbliches und Gefahrgut zuerst und pünktlich liefern – Verspätung kostet hier am meisten.",
                images: [{ src: mapMumbaiGold, caption: "Goldene Markierung: Luxusfracht wartet" }],
            },
            {
                title: "Häfen & Karte",
                paragraphs: [
                    "Neun große Häfen sind über Seerouten verbunden. Tippe einen Hafen an, um sein Hafenprofil zu öffnen – mit kurzen Fakten und den dort verfügbaren Aufträgen.",
                    "Du musst keine Route zeichnen: Das Spiel wählt automatisch den kürzesten Seeweg. Wundere dich nicht, wenn ein Schiff am Kartenrand verschwindet und auf der anderen Seite wieder auftaucht – das ist der Weg über den Pazifik.",
                ],
                images: [{ src: worldMap, caption: "Die Weltkarte mit allen Häfen" }],
            },
        ],
    },
    {
        id: "travel",
        numeral: "IV",
        title: "Reisen",
        subtitle: "Auslaufen & ankommen",
        color: "#46588f",
        pages: [
            {
                title: "Reise starten",
                paragraphs: [
                    "Hast du Fracht geladen, wählst du den Zielhafen und die Reisegeschwindigkeit – von Langsam bis Volldampf.",
                    "Schneller fahren heißt früher ankommen, kostet aber mehr Treibstoff. Die Anzeige zeigt dir vorab Verbrauch und Dauer in Tagen.",
                ],
                images: [{ src: routeSpeed, caption: "Ziel & Geschwindigkeit wählen" }],
            },
            {
                title: "Lotse oder selbst steuern",
                paragraphs: [
                    "Beim Start kannst du den Lotsendienst dazubuchen. Dann laufen Abfahrt und Anlegen automatisch und sicher ab.",
                    "Ohne Lotsen steuerst du selbst: Beim Auslaufen und beim Anlegen meisterst du jeweils ein kurzes Steuer-Minispiel. Misslingt es, gibt es eine kleine Strafe und etwas Verschleiß.",
                ],
                note: "Bei wertvoller oder verderblicher Fracht ist der Lotse oft gut investiert.",
                images: [{ src: shipcardDocking, caption: "Manuelles Anlegen steht an" }],
            },
            {
                title: "Leerfahrt",
                paragraphs: [
                    "Manchmal willst du ein Schiff ohne Fracht zu einem anderen Hafen bringen – etwa dorthin, wo die guten Aufträge warten.",
                    "Das ist die Leerfahrt: eine normale Reise ohne Ladung. Sie kostet Treibstoff, kann sich aber lohnen, wenn dein nächster Auftrag dadurch viel besser wird.",
                ],
                images: [{ src: captainActions, caption: "„Wohin geht's hin, Kapitän?\"" }],
            },
        ],
    },
    {
        id: "danger",
        numeral: "V",
        title: "Gefahren unterwegs",
        subtitle: "Ereignisse & Minispiele",
        color: "#3f6f6b",
        pages: [
            {
                title: "Ereignisse & Minispiele",
                paragraphs: [
                    "Unterwegs können Ereignisse auftreten. Die Reise pausiert, und du meisterst ein kleines Minispiel.",
                    "Bestehst du, geht es ohne Schaden weiter. Scheiterst du, drohen Frachtverlust, Schäden am Schiff oder ein Abzug von der Belohnung.",
                ],
                images: [{ src: eventStorm, caption: "Ein Ereignis kündigt sich an" }],
            },
            {
                title: "Die vier Minispiele",
                bullets: [
                    "Rattenbefall – triff mit dem Cursor die Ratten, bevor sie die Ladung anfressen.",
                    "Sturm – steuere durchs Unwetter und sammle dabei Sonnen.",
                    "Gefährliche Passage – weiche mit den Pfeiltasten den Hindernissen aus.",
                    "Schatzjagd – sammle Schätze ein und entkomme den Piraten; gelingt es, gibt es einen Bonus.",
                ],
                note: "Deine Fraktion beeinflusst, wie oft Ereignisse auftreten – Späher haben Ruhe, Schmuggler erleben mehr.",
                images: [{ src: minigameTreasure, caption: "Schatzjagd: sammeln und entkommen" }],
            },
            {
                title: "Lotsenstreik",
                paragraphs: [
                    "Ab und zu streiken die Lotsen in einem Hafen. Solange der Streik läuft, kannst du dort keinen Lotsendienst buchen und musst selbst an- und ablegen.",
                    "Hattest du bereits gebucht und der Streik bricht aus, wird der Dienst storniert und dir zurückerstattet.",
                ],
                note: "Plane bei wichtiger Fracht etwas Puffer ein, falls ein betroffener Hafen dein Ziel ist.",
            },
        ],
    },
    {
        id: "trade",
        numeral: "VI",
        title: "Schmuggel & Zoll",
        subtitle: "Hohes Risiko, hohe Beute",
        color: "#8a3a3a",
        pages: [
            {
                title: "Schmuggelangebot",
                paragraphs: [
                    "Beim Auslaufen bekommst du manchmal ein Schmuggelangebot: zusätzliche illegale Ware gegen eine satte Extra-Belohnung.",
                    "Du entscheidest frei, ob du annimmst. Der Haken: Mit illegaler Ware riskierst du bei der Ankunft eine Zollkontrolle.",
                ],
                images: [{ src: smuggleOffer, caption: "Annehmen oder ablehnen?" }],
            },
            {
                title: "Zollkontrolle",
                paragraphs: [
                    "Ohne illegale Ware wirst du einfach durchgewunken. Hast du welche an Bord, kann der Zoll sie finden – mit etwas Glück bleibt sie aber unentdeckt.",
                    "Wirst du erwischt, hast du zwei Möglichkeiten: kooperieren (Strafe zahlen und kurz festgehalten werden) oder bestechen (kostet weniger, klappt aber nur manchmal).",
                ],
                images: [{ src: customsDialog, caption: "Kooperieren oder bestechen" }],
            },
            {
                title: "Wenn es schiefgeht",
                paragraphs: [
                    "Misslingt die Bestechung, zahlst du die Bestechung und die doppelte Strafe – und wirst trotzdem festgehalten. Bestechen ist also ein echtes Wagnis.",
                    "Davon getrennt gibt es den Regress: Kommt eine Lieferung zu spät oder beschädigt an, wird ein Teil der Belohnung abgezogen. Empfindliche Fracht trifft das härter.",
                ],
                images: [{ src: customsBribeFailed, caption: "Bestechung fehlgeschlagen" }],
            },
        ],
    },
    {
        id: "factions",
        numeral: "VII",
        title: "Fraktionen",
        subtitle: "Deine Spielweise",
        color: "#6b4a8c",
        pages: [
            {
                title: "Was Fraktionen sind",
                paragraphs: [
                    "Zu Beginn wählst du eine von sieben Fraktionen. Sie gibt dir feste Vor- und Nachteile, die zu einer bestimmten Spielweise passen.",
                    "Es gibt keine beste Fraktion – nur die, die zu deinem Plan passt. Auf den nächsten Seiten findest du alle im Überblick.",
                ],
            },
            {
                title: "Ingenieure & Raffinerien",
                paragraphs: [
                    "Ingenieure halten die Reparaturen günstig, brauchen aber länger beim Be- und Entladen.",
                    "Raffinerien fahren besonders sparsam, reparieren dafür etwas langsamer.",
                ],
                gallery: true,
                images: [{ src: factionIngenieure }, { src: factionRaffinerien }],
            },
            {
                title: "Hafenmeister & Schnellservice",
                paragraphs: [
                    "Hafenmeister laden blitzschnell, zahlen aber mehr für Treibstoff.",
                    "Der Express-Service (Schnellservice) tankt und repariert besonders schnell.",
                ],
                gallery: true,
                images: [{ src: factionHafenmeister }, { src: factionExpress }],
            },
            {
                title: "Späher & Händler",
                paragraphs: [
                    "Späher erleben weniger Ereignisse und sehen neue Aufträge früher.",
                    "Händler bekommen mehr und bessere Marktangebote, dafür seltener Schmuggelangebote.",
                ],
                gallery: true,
                images: [{ src: factionScouts }, { src: factionHaendler }],
            },
            {
                title: "Schmuggler",
                paragraphs: [
                    "Schmuggler verdienen am illegalen Handel: mehr Angebote und ein geringeres Risiko, beim Zoll erwischt zu werden.",
                    "Der Preis dafür: unterwegs passieren mehr Ereignisse. Eine Fraktion für mutige Kapitäne.",
                ],
                images: [{ src: factionSchmuggler, caption: "Hohes Risiko, hohe Beute" }],
            },
        ],
    },
    {
        id: "endgame",
        numeral: "VIII",
        title: "Pflege & Sieg",
        subtitle: "Instandhalten & gewinnen",
        color: "#b0782a",
        pages: [
            {
                title: "Tanken & Reparieren",
                paragraphs: [
                    "Im Hafen bringst du dein Schiff wieder in Form. Beim Tanken wählst du, auf wie viel Prozent du auffüllst; eine Reparatur setzt den Zustand wieder auf 100 %.",
                    "Beides dauert ein paar Tage und kostet Taler. Deine Fraktion kann es günstiger oder schneller machen.",
                ],
                note: "Pflege lohnt sich doppelt: Ein gut gewartetes Schiff fährt zuverlässiger und ist am Ende mehr wert.",
                images: [{ src: portProfileActions, caption: "Betanken, reparieren, verkaufen" }],
            },
            {
                title: "Rangliste",
                paragraphs: [
                    "Die Rangliste zeigt jederzeit, wie du im Vergleich stehst. Gewertet wird das Gesamtvermögen: Bargeld plus Schiffswerte.",
                    "Für jede gelieferte Fracht erscheint kurz eine Belohnungs-Einblendung – sie verschwindet von selbst wieder.",
                ],
                images: [{ src: leaderboard, caption: "Wer führt die Meere an?" }],
            },
            {
                title: "Das Spielende",
                paragraphs: [
                    "Ist der letzte Spieltag erreicht, endet die Runde automatisch. Kurz vorher wirst du gewarnt, dass es bald so weit ist.",
                    "Dann werden alle Vermögen verglichen. Wer am meisten besitzt – Bargeld und Schiffe zusammen – wird zum Herrscher der Meere gekrönt.",
                ],
                note: "Weil Schiffe mitzählen, lohnt es sich, sie bis zum Schluss in gutem Zustand zu halten.",
                images: [{ src: gameoverPodium, caption: "Die Siegerehrung" }],
            },
        ],
    },
];
