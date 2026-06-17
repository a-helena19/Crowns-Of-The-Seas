import lobbyStart from "../assets/help/lobby-start.png";
import sessionsResume from "../assets/help/sessions-resume.png";
import sound2 from "../assets/help/sound2.png";
import anlegen from "../assets/help/anlegen2.png";
import fractionWahl from "../assets/help/fraction-wahl.png";
import shipcardReady from "../assets/help/shipcard-ready.png";
import toggleOtherShips from "../assets/help/toggle-other-ships.png";
import cargoBoard from "../assets/help/cargo-board.png";
import mapMumbaiGold from "../assets/help/map-mumbai-gold.png";
import Ankuendigung from "../assets/help/Ankuendigung.png";
import starten from "../assets/help/starten.png";
import worldMap from "../assets/help/world-map.png";
import eventPassage from "../assets/help/event-passage.png";
import strike from "../assets/help/strike.png";
import eventRats from "../assets/help/event-rats.png";
import eventTreasure from "../assets/help/event-treasure.png";
import start from "../assets/help/start.png";
import schiffsmarkt2 from "../assets/help/Schiffsmarkt2.png";
import schiffVerkaufen from "../assets/help/schiff-verkaufen.png";
import routeSpeed from "../assets/help/route-speed.png";
import eventStorm from "../assets/help/event-storm-dialog.png";
import minigameRats from "../assets/help/minigame-rats.png";
import minigameStorm from "../assets/help/minigame-storm.png";
import minigamePassage from "../assets/help/minigame-passage.png";
import minigameTreasureMaze from "../assets/help/minigame-treasure-maze.png";
import smuggleOffer from "../assets/help/smuggle-offer.png";
import customsDialog from "../assets/help/customs-dialog.png";
import customsBribeFailed from "../assets/help/customs-bribe-failed.png";
import regress from "../assets/help/regress.png";
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

export type HelpImageAlign = "side" | "wide";

export interface HelpGalleryImage {
    src: string;
    caption?: string;
}

export type HelpBlock =
    | { kind: "lead"; text: string }
    | { kind: "text"; text: string }
    | { kind: "bullets"; items: string[] }
    | { kind: "tip"; text: string }
    | { kind: "image"; src: string; caption?: string; align?: HelpImageAlign }
    | { kind: "gallery"; images: HelpGalleryImage[] };

export interface HelpPage {
    id: string;
    title: string;
    blocks: HelpBlock[];
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
                id: "willkommen",
                title: "Willkommen & Runde starten",
                blocks: [
                    { kind: "lead", text: "In Crowns of the Seas führst du eine kleine Reederei und handelst zwischen den großen Häfen der Welt." },
                    { kind: "image", src: start, align: "wide", caption: "Willkommen-Screen" },
                    { kind: "text", text: "Die Idee ist einfach: Du kaufst Schiffe, nimmst Transportaufträge an, bringst Fracht von einem Hafen zum anderen und verdienst dabei Geld." },
                    { kind: "text", text: "Dein Ziel ist das größte Vermögen der Runde. Gewertet wird dein Gesamtvermögen. Dazu gehören deine auch deine Schiffe. Wer am Ende vorne liegt, wird zum Herrscher der Meere gekrönt. Bezahlt wird in Talern. Oben in der Leiste siehst du immer den aktuellen Tag und das Rundenende, zum Beispiel „Tag 72 / 1200\"." },
                ],
            },
            {
                id: "Runde starten",
                title: "Runde starten & Fraktion wählen",
                blocks: [
                    { kind: "text", text: "Eine Spielrunde heißt Session. Du kannst entweder selbst eine neue Session erstellen, dann bist du der Host oder einer bestehenden Session beitreten, indem du ihren Spiel-Code eingibst." },
                    { kind: "image", src: lobbyStart, caption: "Die Lobby kurz vor dem Start", align: "side" },
                    { kind: "text", text: "Erstellst du selbst eine Runde, legst du als Host vorab drei Dinge fest, die für alle gelten:" },
                    { kind: "bullets", items: [
                            "Maximale Spielerzahl – wie viele Kapitäne mitspielen dürfen (von 2 bis 4).",
                            "Spieltempo – wie schnell die Spieltage vergehen.",
                            "Spieldauer – wie lang die Runde insgesamt läuft.",
                        ] },
                    { kind: "text", text: "Jede Runde durchläuft vier Phasen. Zuerst die Lobby. Dann die Fraktionswahl & Heimathafen, bei der jeder seine Spielweise festlegt. Danach das eigentliche Spiel, in dem gehandelt wird. Und ganz am Ende der Ergebnis-Bildschirm." },
                    { kind: "image", src: fractionWahl, caption: "Fraktions-Wahl und Wahl des Heimatshafen.", align: "wide" },
                ]
            },
            {
                id: "ablauf",
                title: "Ablauf, Hilfe & Sound",
                blocks: [
                    { kind: "image", src: sessionsResume, caption: "Laufende Spiele fortsetzen", align: "side" },
                    { kind: "text", text: "Du kannst eine laufende Runde jederzeit verlassen, ohne etwas zu verlieren.Steigst du später wieder ein, findest du alles genau so vor, wie du es zurückgelassen hast." },
                    { kind: "tip", text: "Verlassen alle Spieler gleichzeitig die Runde, wird sie endgültig geschlossen." },
                    { kind: "image", src: sound2, caption: "Musik, Effekte & Handbuch im Menü", align: "side" },
                    { kind: "text", text: "Alle Einstellungen und auch dieses Handbuch erreichst du jederzeit über das Menü-Symbol (☰) oben rechts in der Leiste." },
                    { kind: "text", text: "Dort kannst du die Hintergrundmusik und die Soundeffekte an- und ausschalten und ihre Lautstärke frei einstellen. Im selben Menü findest du das Kapitänshandbuch und ein Button, um zur Lobby zurückzukehren." },
                    { kind: "text", text: "Im Spiel gibt es einen Chat, über den du Nachrichten an alle Spieler senden kannst." },
                ],
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
                id: "kaufen",
                title: "Schiffe kaufen & der Markt",
                blocks: [
                    { kind: "text", text: "Der erster Schritt ist immer der Kauf eines Schiffs. Auf dem Markt findest du die verfügbaren Schiffe in drei Klassen sortiert:" },
                    { kind: "image", src: schiffsmarkt2, caption: "Der Markt: Klassen, Gebrauchte & Angebote", align: "wide" },
                    { kind: "bullets", items: [
                            "Budget – günstig in der Anschaffung, dafür kleiner Laderaum und eher gemächlich. Perfekt für den Einstieg.",
                            "Standard – der ausgewogene Allrounder mit solidem Laderaum, vernünftigem Tempo und fairem Preis.",
                            "Premium – teuer, aber wert: großer Laderaum, hohe Geschwindigkeit und zuverlässig auf langen Strecken.",
                        ] },
                    { kind: "tip", text: "Achte beim Kauf nicht nur auf den Preis, sondern auf Laderaum, Geschwindigkeit und Verbrauch." },
                    { kind: "text", text: "Im Markt tauchen außerdem immer wieder zeitlich begrenzte Sonderangebote auf: dieselben Schiffe mit Rabatt, aber nur in kleiner Stückzahl und für kurze Zeit." },
                ],
            },
            {
                id: "schiffskarte",
                title: "Die Schiffskarte & andere Schiffe",
                blocks: [
                    { kind: "image", src: shipcardReady, caption: "Reisebereit – wartet auf die Abfahrt", align: "side" },
                    { kind: "text", text: "Jedes deiner Schiffe hat eine eigene Schiffskarte. Sie zeigt dir auf einen Blick den Namen, den aktuellen Status (zum Beispiel „Im Hafen\", „Reisebereit\" oder „Unterwegs\") und zwei Balken: den Tank und den Zustand." },
                    { kind: "text", text: "Das Schiffskarte leuchtet auf und bekommt einen farbigen Rahmen, sobald dein Schiff eine Entscheidung von dir braucht z.B. wenn es reisebereit ist und auf die Abfahrt wartet, wenn es anlegen muss, wenn ein Angebot vorliegt oder wenn unterwegs ein Ereignis ansteht. Tippe die Karte dann an, um zu reagieren." },
                    { kind: "image", src: toggleOtherShips, caption: "Fremde Schiffe ein- oder ausblenden", align: "side" },
                    { kind: "text", text: "Über die Schaltfläche „Andere Schiffe anzeigen\" kannst du fremde Schiffe ein- oder ausblenden auf der Karte ausschalten, wenn du mit anderen zusammen spielst." },
                ],
            },
            {
                id: "Tanken & reparieren",
                title: "Tanken & reparieren",
                blocks: [
                    {
                        kind: "image",
                        src: portProfileActions,
                        caption: "Betanken, reparieren oder verkaufen",
                        align: "wide"
                    },
                    {
                        kind: "text",
                        text: "Im Office kannst du dein Schiff tanken & reparieren. Beim Tanken wählst du selbst, auf wie viel Prozent du den Tank auffüllst. Eine Reparatur setzt den Zustand des Schiffs wieder auf 100 Prozent."
                    },
                    {
                        kind: "text",
                        text: "Beides braucht ein paar Spieltage Zeit und kostet Taler. Manche Fraktionen tanken und reparieren günstiger, andere schneller."
                    }
                ],
            },
            {
                id: "Verkaufen",
                title: "Schiffe verkaufen",
                blocks: [
                    { kind: "image", src: schiffVerkaufen, caption: "Ein Schiff mit allen Details", align: "wide" },
                    { kind: "text", text: "Du kannst Schiffe auch wieder verkaufen. Wie viel du dafür bekommst, hängt vor allem vom Zustand ab: Ein gepflegtes Schiff bringt deutlich mehr als ein heruntergekommenes. Gebrauchte Schiffe kannst du im Gegenzug günstiger übernehmen." },
                    ],
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
                id: "frachtboerse",
                title: "Frachtbörse & Frachttypen",
                blocks: [
                    { kind: "text", text: "Auf der Frachtbörse findest du alle Frachtaufträge. Jeder Auftrag hat ein Starthafen, in dem die Ware wartet, und einen Zielhafen, zu dem sie gebracht werden muss. Außerdem siehst du, wie viel Platz die Fracht belegt und welche Belohnung du bei pünktlicher Lieferung bekommst." },
                    { kind: "image", src: cargoBoard, caption: "Ein Auftrag auf der Frachtbörse", align: "wide" },
                    { kind: "text", text: "Die Aufträge verschwinden nach einer Zeit. Ein Auftrag pro Hafen verschwindet nicht." },
                    { kind: "text", text: "Der Frachttyp verrät dir, wie empfindlich eine Ladung ist: Verderbliche Ware wie Lebensmittel muss schnell ankommen, sonst verliert sie an Wert. Zerbrechliche Ware leidet unter Unwettern unterwegs. Luxusgüter bringen die höchsten Belohnungen." },
                    { kind: "image", src: mapMumbaiGold, caption: "Goldene Markierung: hier wartet Luxusfracht", align: "side" },
                    { kind: "text", text: "Häfen, in denen gerade Luxusaufträge auf einen Transporteur warten, leuchten auf der Karte golden auf." },
                ],
            },
            {
                id: "haefen",
                title: "Häfen & die Weltkarte",
                blocks: [
                    { kind: "text", text: "Neun Häfen sind bilden deine Spielwelt. Tippe einen Hafen auf der Karte an, um sein Hafenprofil zu öffnen. Dort findest du Fakten über den Hafen und die Aufträge, die gerade dort verfügbar sind." },
                    { kind: "image", src: worldMap, caption: "Die Weltkarte mit allen neun Häfen", align: "wide" },
                    { kind: "text", text: "Sobald du ein Ziel auswählst, sucht das Spiel automatisch den kürzesten Seeweg dorthin. Schiff kann am rechten Kartenrand verschwinden und links wieder auftauchen." },
                ],
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
                id: "reise-starten",
                title: "Reise starten & Lotse",
                blocks: [
                    { kind: "text", text: "Hast du ein Schiff und Fracht ausgewählt, wählst du auch den Zielhafen und entscheidest dich für eine Reisegeschwindigkeit – von „Langsam\" bis „Volldampf\"." },
                    { kind: "image", src: cargoBoard, caption: "Ziel und Geschwindigkeit auswählen", align: "wide" },
                    { kind: "text", text: "Schneller zu fahren bedeutet, früher anzukommen, kostet aber spürbar mehr Treibstoff. Bevor du bestätigst, zeigt dir die Anzeige, wie viel Treibstoff die Reise verbraucht und wie viele Spieltage sie dauert." },
                ],
            },
            {
                id: "leerfahrt",
                title: "Die Leerfahrt",
                blocks: [
                    { kind: "image", src: routeSpeed, caption: "„Wohin geht's hin, Kapitän?\"", align: "wide" },
                    { kind: "text", text: "Manchmal willst du ein Schiff ohne Ladung an einen anderen Ort bringen." },
                    { kind: "text", text: "Dafür gibt es die Leerfahrt: eine normale Reise, nur eben ohne Fracht. Sie kostet aber auch Treibstoff und kann Mini-Games triggern." },
                    { kind: "text", text: "Du startest sie über die Schiffsaktionen, indem du einfach ein Ziel wählst, ohne vorher Fracht zu laden." },
                ],
            },
            {
                id: "reise-starten",
                title: "Reise starten",
                blocks: [
                    { kind: "image", src: starten, caption: "Manuelles losfahren", align: "wide" },
                    { kind: "text", text: "Beim Start kannst du zusätzlich einen Lotsendienst buchen für 1000 T. Mit Lotse laufen Abfahrt und Anlegen vollautomatisch und sicher ab. Steuerst du selbst: Beim Auslaufen und beim Anlegen meisterst du ein kurzes Steuer-Minispiel. Misslingt es, gibt es eine Strafe und etwas Verschleiß am Schiff." },
                ],
            },

            {
                id: "reise-beenden",
                title: "Reise beenden & Anlegen",
                blocks: [
                    { kind: "text", text: "Wenn du mit dem Schiff manuell losgefahren bist, musst du diesen auch manuell anlegen. " },
                    { kind: "text", text: "Manuell anlegen ist bei uns ein Minigame, bei dem man ab der 3 maligen Kollision ein Teil der Ware verliert und Strafe bezahlen muss." },
                    { kind: "text", text: "Beim Anlegen muss das Schiff für drei Sekunden auf der Plattform liegen. " },
                    { kind: "image", src: anlegen, caption: "Anlege-Plattform", align: "side" },
                ],
            },
        ],
    },
    {
        id: "danger",
        numeral: "V",
        title: "Gefahren & Minispiele",
        subtitle: "Ereignisse meistern",
        color: "#3f6f6b",
        pages: [
            {
                id: "ereignisse",
                title: "Ereignisse unterwegs",
                blocks: [
                    { kind: "lead", text: "Eine Seereise verläuft nicht immer ruhig." },
                    { kind: "image", src: eventStorm, caption: "Ein Ereignis kündigt sich an", align: "wide" },
                    { kind: "text", text: "Während ein Schiff unterwegs ist, können Ereignisse auftreten. Passiert das, pausiert die Reise und du musst ein kleines Minispiel meistern." },
                    { kind: "text", text: "Bestehst du das Minispiel, geht die Fahrt ohne Schaden weiter. Scheiterst du, drohen Folgen: Du kannst einen Teil der Fracht verlieren, Schiff nimmt Schaden oder dir wird ein Teil der Belohnung abgezogen." },
                    { kind: "text", text: "Es gibt vier Minispiele. Auf den nächsten Seiten findest du eine Erklärung mit Steuerung, Ziel und der besten Taktik." },
                ],
            },
            {
                id: "mg-rats",
                title: "Minispiel: Rattenbefall",
                blocks: [
                    { kind: "lead", text: "Ratten haben sich an Bord geschlichen und machen sich über die Ladung her." },
                    { kind: "image", src: eventRats, caption: "Triff die Ratten, bevor sie die Ladung erreichen", align: "wide" },
                    { kind: "text", text: "Steuerung: Du spielst mit der Maus. Bewege den Cursor übers Deck und klicke auf jede Ratte, die auftaucht, um sie zu vertreiben." },
                    { kind: "text", text: "Ziel: Triff die geforderte Anzahl Ratten, bevor die Zeit abläuft. Die Ratten erscheinen einzeln an wechselnden Stellen des Decks, sobald du eine erwischt hast, taucht die nächste woanders auf." },
                    { kind: "image", src: minigameRats, caption: "Blick auf die Ratten", align: "wide" },
                    { kind: "text", text: "Wenn es schiefgeht: Schaffst du die geforderte Trefferzahl nicht rechtzeitig, fressen die Ratten einen Teil deiner Fracht an und du verlierst sie." },
                    { kind: "tip", text: "Lass den Cursor ruhig in der Mitte des Decks schweben. So hast du zu jeder neuen Ratte einen kurzen Weg und reagierst schneller." },
                ],
            },
            {
                id: "mg-storm",
                title: "Minispiel: Sturm auf See",
                blocks: [
                    { kind: "lead", text: "Ein schweres Unwetter zieht auf. Blitze schlagen ins Wasser, und du musst dein Schiff heil durch den Sturm bringen." },
                    { kind: "image", src: eventStorm, caption: "Sonnen sammeln, Blitzen ausweichen", align: "wide" },
                    { kind: "text", text: "Steuerung: Du lenkst das Schiff nach links und rechts – entweder mit den Pfeiltasten ← und → oder mit den Tasten A und D." },
                    { kind: "text", text: "Ziel: Sammle die geforderte Anzahl Sonnen ein, die vom Himmel herabschweben, und weiche dabei den herabfahrenden Blitzen aus. Oben siehst du jederzeit die verbleibende Zeit, deine Haltbarkeit und deinen Sonnen-Fortschritt (zum Beispiel „Sonnen: 3 / 8\")." },
                    { kind: "image", src: minigameStorm, caption: "Blick auf den Sturm auf See", align: "wide" },
                    { kind: "text", text: "Wenn es schiefgeht: Jeder Blitz, der dich trifft, zieht ordentlich Haltbarkeit ab. Sinkt sie auf null oder bekommst du nicht genug Sonnen zusammen, ist das Minispiel verloren – dann drohen Zustandsschaden und Frachtverlust." },
                ],
            },
            {
                id: "mg-passage",
                title: "Minispiel: Gefährliche Passage",
                blocks: [
                    { kind: "lead", text: "Vor dir liegt ein enges, gefährliches Fahrwasser voller Hindernisse. Nur wer geschickt ausweicht, kommt sauber durch." },
                    { kind: "image", src: eventPassage, caption: "Den Hindernissen ausweichen Richtung Ziel", align: "wide" },
                    { kind: "text", text: "Steuerung: Hier steuerst du frei in alle Richtungen – mit WASD oder den Pfeiltasten. So manövrierst du dein Schiff nach oben, unten, links und rechts." },
                    { kind: "text", text: "Ziel: Bring dein Schiff bis zum Ziel (am Rand mit „ZIEL\" markiert), ohne zu oft anzuecken. Mal führt der Weg durch offenes Wasser mit treibenden Felsen, mal durch eine enge Fahrrinne – die Hindernisse unterscheiden sich je nach Strecke." },
                    { kind: "image", src: minigamePassage, caption: "Weiche den Hindernissen aus", align: "wide" },
                    { kind: "text", text: "Wenn es schiefgeht: Jede Kollision beschädigt dein Schiff. Wird es dabei zerstört oder läuft die Zeit ab, bevor du das Ziel erreichst, gilt die Passage als nicht bestanden und du fährst mit Schaden weiter." },
                ],
            },
            {
                id: "mg-treasure",
                title: "Minispiel: Schatzjagd",
                blocks: [
                    { kind: "lead", text: "Ein Schatz wurde gesichtet! Anders als die übrigen Ereignisse ist die Schatzjagd freiwillig – und sie kann sich richtig lohnen." },
                    { kind: "image", src: eventTreasure, caption: "Schätze sammeln, Piraten ausweichen", align: "wide" },
                    { kind: "text", text: "Vorab entscheidest du selbst: Folgst du der Spur oder nicht? Sagst du Nein, geht deine Reise ganz normal weiter, ohne Risiko und ohne Bonus. Sagst du Ja, beginnt die Schatzjagd – mit der Chance auf einen Bonus, aber auch dem Risiko, Fracht zu verlieren." },
                    { kind: "text", text: "Steuerung: Du fährst mit WASD oder den Pfeiltasten durch ein Labyrinth aus Seewegen." },
                    { kind: "text", text: "Ziel: Sammle die geforderte Anzahl Schätze ein und entkomme dabei den Piraten, die durch das Labyrinth patrouillieren. Schaffst du es, gibt es eine Extra-Belohnung obendrauf." },
                    { kind: "image", src: minigameTreasureMaze, caption: "Sammle deine Schätze", align: "wide" },
                    { kind: "text", text: "Wenn es schiefgeht: Stellt dich ein Pirat, ist die Jagd vorbei und du gehst nicht nur leer aus, sondern riskierst auch noch einen Frachtverlust." },
                ],
            },
            {
                id: "lotsenstreik",
                title: "Lotsenstreik",
                blocks: [
                    { kind: "image", src: strike, caption: "Ankündigung eines Lotsenstreiks", align: "wide" },
                    { kind: "text", text: "Ab und zu gibt es ein Lotsenstreik. Solange der Streik andauert, kannst du dort keinen Lotsendienst buchen und musst beim An- und Ablegen selbst ans Steuer – also das Steuer-Minispiel meistern. Hattest du schon Lotsen bestellt und es ein Streik gibt, bekommst du den Betrag zurückerstattet." },
                    { kind: "tip", text: "Bringst du wertvolle Fracht zu einem Hafen, der zum Streik neigt, plane etwas Zeit ein falls ein Lotsenstreik ausbricht." },
                ],
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
                id: "schmuggel",
                title: "Schmuggelangebot & Zollkontrolle",
                blocks: [
                    { kind: "image", src: smuggleOffer, caption: "Annehmen oder lieber ablehnen?", align: "wide" },
                    { kind: "text", text: "Beim Auslaufen aus einem Hafen bekommst du manchmal ein Schmuggelangebot: Du kannst zusätzliche, illegale Ware an Bord nehmen und dafür eine Extra-Belohnung kassieren." },
                    { kind: "text", text: "Sobald du illegale Ware geladen hast, riskierst du bei der Ankunft im Zielhafen eine Zollkontrolle." },
                    { kind: "image", src: customsDialog, caption: "Kooperieren oder bestechen?", align: "side" },
                    { kind: "text", text: "Hast du keine illegale Ware an Bord, wirst du beim Anlegen einfach durchgewunken. Führst du dagegen Schmuggelgut mit dir, kann der Zoll es bei einer Kontrolle entdecken – mit etwas Glück bleibt es aber unbemerkt." },
                    { kind: "text", text: "Wirst du erwischt, kannst du kooperieren (du zahlst eine Strafe und wirst kurz festgehalten) oder den Beamten bestechen (kostet weniger, klappt aber nur manchmal)." },
                ],
            },
            {
                id: "regress",
                title: "Strafe & Regress",
                blocks: [
                    { kind: "image", src: customsBribeFailed, caption: "Bestechung fehlgeschlagen", align: "side" },
                    { kind: "text", text: "Geht eine Bestechung daneben, zahlst du die Bestechungssumme und obendrauf die doppelte Strafe. Dein Schiff wird trotzdem festgehalten." },
                    { kind: "image", src: regress, caption: "Regress: Abzug von der Belohnung", align: "wide" },
                    { kind: "text", text: "Es gibt noch den Regress. Kommt eine Lieferung zu spät oder beschädigt im Zielhafen an, wird dir ein Teil der Belohnung abgezogen. Bei empfindlicher und verderblicher Fracht fällt dieser Abzug besonders heftig aus." },
                    { kind: "tip", text: "Regress trifft dich auch ohne jeden Schmuggel – allein durch Verspätung oder Schäden." },
                ],
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
                id: "factions-intro",
                title: "Fraktionen verstehen",
                blocks: [
                    { kind: "text", text: "Gleich zu Beginn jeder Runde wählst du eine von sieben Fraktionen. Deine Fraktion gibt dir feste Vor- und Nachteile, die zu einer bestimmten Spielweise passen." },
                    { kind: "text", text: "Es gibt keine insgesamt beste Fraktion. Überleg dir kurz, wie du spielen willst, und wähle danach." },
                    { kind: "text", text: "Ingenieure sind die Meister der Mechanik: Ihre Reparaturen sind günstiger, dafür brauchen sie beim Be- und Entladen etwas länger. Raffinerien kontrollieren die Rohstoffe und fahren besonders sparsam, der Preis dafür: Sie reparieren ein wenig langsamer." },
                    { kind: "gallery", images: [{ src: factionIngenieure }, { src: factionRaffinerien }] },
                ],
            },
            {
                id: "factions-2",
                title: "Hafenmeister, Express, Späher & Händler",
                blocks: [
                    { kind: "text", text: "Für Hafenmeister ist jeder Hafen ein Zuhause: Sie laden und entladen blitzschnell, zahlen dafür aber mehr für ihren Treibstoff. Der Express-Service (Schnellservice) lebt nach dem Motto „Zeit ist Geld\" – Tanken und Reparieren gehen besonders flott von der Hand." },
                    { kind: "gallery", images: [{ src: factionHafenmeister }, { src: factionExpress }] },
                    { kind: "text", text: "Späher sind immer einen Schritt voraus: Sie erleben unterwegs deutlich weniger Ereignisse und sehen neue Aufträge früher als alle anderen. Händler dagegen verdienen, wo andere nur handeln: Sie bekommen mehr und bessere Marktangebote, dafür aber seltener ein Schmuggelangebot." },
                    { kind: "gallery", images: [{ src: factionScouts }, { src: factionHaendler }] },
                ],
            },
            {
                id: "factions-schmuggler",
                title: "Schmuggler",
                blocks: [
                    { kind: "image", src: factionSchmuggler, caption: "Hohes Risiko, hohe Beute", align: "side" },
                    { kind: "text", text: "Schmuggler verdienen ihr Geld am illegalen Handel. Sie bekommen mehr Schmuggelangebote und werden seltener vom Zoll erwischt – ihr Risiko bei der Kontrolle ist also geringer." },
                    { kind: "text", text: "Der Preis dafür: Unterwegs passieren ihnen mehr Ereignisse als allen anderen." },
                ],
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
                id: "rangliste",
                title: "Rangliste",
                blocks: [
                    { kind: "image", src: leaderboard, caption: "Wer führt gerade die Meere an?", align: "side" },
                    { kind: "text", text: "Die Rangliste zeigt dir jederzeit, wie du im Vergleich zu den anderen Kapitänen dastehst. Gewertet wird dabei immer das Gesamtvermögen – Bargeld plus Schiffswerte. Für jede gelieferte Fracht erscheint kurz eine Belohnungs-Einblendung." },
                ],
            },
            {
                id: "spielende",
                title: "Das Spielende",
                blocks: [
                    { kind: "image", src: Ankuendigung, caption: "Ankündigung des Spielende", align: "side" },
                    { kind: "text", text: "Ist der letzte Spieltag der Runde erreicht, endet das Spiel automatisch. Kurz vorher wirst du mit einer Einblendung gewarnt, dass es bald so weit ist." },
                    { kind: "text", text: "Am Ende werden alle Vermögen miteinander verglichen. Wer am meisten besitzt, gewinnt die Runde und wird zum Herrscher der Meere gekrönt." },
                    { kind: "image", src: gameoverPodium, caption: "Die Siegerehrung", align: "wide" },
                    { kind: "tip", text: "Weil deine Schiffe voll mitzählen, lohnt es sich, sie bis zum letzten Tag in gutem Zustand zu halten." },
                ],
            },
        ],
    },
];