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
                    { kind: "image", src: lobbyStart, caption: "Die Lobby kurz vor dem Start", align: "side" },
                    { kind: "text", text: "Die Idee ist einfach: Du kaufst Schiffe, nimmst Transportaufträge an, bringst Fracht von einem Hafen zum anderen und verdienst dabei Geld. Mit dem Gewinn kaufst du größere oder schnellere Schiffe, nimmst lukrativere Aufträge an und baust deine Flotte Stück für Stück aus." },
                    { kind: "text", text: "Dein Ziel ist das größte Vermögen der Runde. Gewertet wird nicht nur dein Bargeld, sondern dein Gesamtvermögen – also dein Geld plus der Wert all deiner Schiffe zusammen. Wer am Ende vorne liegt, wird zum Herrscher der Meere gekrönt. Bezahlt wird in Talern, abgekürzt mit „T\". Die Zeit läuft nicht in echten Minuten, sondern in Spieltagen: Oben in der Leiste siehst du immer den aktuellen Tag und das Rundenende, zum Beispiel „Tag 69 / 1200\"." },
                    { kind: "text", text: "Eine Spielrunde heißt Session. Du kannst entweder selbst eine neue Session erstellen – dann bist du der Host – oder einer bestehenden Session beitreten, indem du ihren Spiel-Code eingibst. Den Code bekommst du von der Person, die die Runde erstellt hat." },
                    { kind: "text", text: "Erstellst du selbst eine Runde, legst du als Host vorab drei Dinge fest, die für alle gelten:" },
                    { kind: "bullets", items: [
                            "Maximale Spielerzahl – wie viele Kapitäne mitspielen dürfen (von 2 bis 4).",
                            "Spieltempo – wie schnell die Spieltage vergehen. Langsam gibt dir mehr Zeit zum Überlegen, schnell macht die Runde hektischer.",
                            "Spieldauer – wie lang die Runde insgesamt läuft, von kurzen Test-Längen bis zu mehreren Stunden Spielzeit.",
                        ] },
                    { kind: "tip", text: "Eine bereits begonnene Runde verschwindet nicht. Du findest sie unter „Deine aktiven Spiele\" wieder und machst dort weiter, wo du aufgehört hast." },
                ],
            },
            {
                id: "ablauf",
                title: "Ablauf, Hilfe & Sound",
                blocks: [
                    { kind: "image", src: sessionsResume, caption: "Laufende Spiele fortsetzen", align: "side" },
                    { kind: "text", text: "Jede Runde durchläuft vier Phasen. Zuerst die Lobby, in der alle warten, bis es losgeht. Dann die Fraktionswahl, bei der jeder seine Spielweise festlegt. Danach das eigentliche Spiel, in dem gehandelt wird. Und ganz am Ende der Ergebnis-Bildschirm mit der Siegerehrung." },
                    { kind: "text", text: "Du kannst eine laufende Runde jederzeit verlassen, ohne etwas zu verlieren. Deine Schiffe, deine Frachten und dein Konto bleiben vollständig erhalten. Steigst du später wieder ein, findest du alles genau so vor, wie du es zurückgelassen hast." },
                    { kind: "tip", text: "Verlassen alle Spieler gleichzeitig die Runde, wird sie endgültig geschlossen. Soll später weitergespielt werden, bleibt am besten jemand verbunden." },
                    { kind: "image", src: audioSettings, caption: "Musik, Effekte & Handbuch im Menü", align: "side" },
                    { kind: "text", text: "Alle Einstellungen und auch dieses Handbuch erreichst du jederzeit über das Menü-Symbol (☰) oben rechts in der Leiste. Es öffnet ein kleines Klappmenü." },
                    { kind: "text", text: "Dort kannst du die Hintergrundmusik und die Soundeffekte getrennt voneinander an- und ausschalten und ihre Lautstärke frei einstellen. Im selben Menü findest du den Eintrag, mit dem du dieses Kapitänshandbuch öffnest, sowie die Schaltfläche, um zur Lobby zurückzukehren." },
                    { kind: "text", text: "Das Handbuch kannst du in aller Ruhe lesen – das Spiel läuft im Hintergrund ganz normal weiter, du verpasst also nichts." },
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
                    { kind: "image", src: shipMarketTabs, caption: "Der Markt: Klassen, Gebrauchte & Angebote", align: "side" },
                    { kind: "text", text: "Ohne Schiff kein Handel – dein erster Schritt ist also immer der Kauf eines Schiffs. Auf dem Markt findest du die verfügbaren Schiffe übersichtlich in drei Klassen sortiert. Jede Klasse hat ihren eigenen Charakter:" },
                    { kind: "bullets", items: [
                            "Budget – günstig in der Anschaffung, dafür kleiner Laderaum und eher gemächlich. Perfekt für den Einstieg, wenn das Startkapital noch knapp ist.",
                            "Standard – der ausgewogene Allrounder mit solidem Laderaum, vernünftigem Tempo und fairem Preis. Für die meisten Routen eine sichere Wahl.",
                            "Premium – teuer, aber jeden Taler wert: großer Laderaum, hohe Geschwindigkeit und zuverlässig auf langen Strecken. Ideal, sobald du größere Aufträge stemmen willst.",
                        ] },
                    { kind: "tip", text: "Achte beim Kauf nicht nur auf den Preis, sondern auf Laderaum, Geschwindigkeit und Verbrauch. Diese drei Werte entscheiden, welche Aufträge und Routen sich für ein Schiff lohnen." },
                    { kind: "text", text: "Im Markt tauchen außerdem immer wieder zeitlich begrenzte Sonderangebote auf: dieselben Schiffe mit Rabatt, aber nur in kleiner Stückzahl und für kurze Zeit. Wer schnell zugreift, spart hier ordentlich." },
                    { kind: "image", src: shipDetail, caption: "Ein Schiff mit allen Details", align: "side" },
                    { kind: "text", text: "Du kannst Schiffe natürlich auch wieder verkaufen. Wie viel du dafür bekommst, hängt vor allem vom Zustand ab: Ein gepflegtes Schiff bringt deutlich mehr als ein heruntergekommenes. Gebrauchte Schiffe, die andere Spieler abgestoßen haben, kannst du im Gegenzug günstiger übernehmen – ein guter Weg, an ein zweites Schiff zu kommen." },
                ],
            },
            {
                id: "schiffskarte",
                title: "Die Schiffskarte & andere Schiffe",
                blocks: [
                    { kind: "image", src: shipcardReady, caption: "Reisebereit – wartet auf die Abfahrt", align: "side" },
                    { kind: "text", text: "Jedes deiner Schiffe hat eine eigene Schiffskarte. Sie zeigt dir auf einen Blick den Namen, den aktuellen Status (zum Beispiel „Im Hafen\", „Reisebereit\" oder „Unterwegs\") und zwei Balken: den Tank (wie viel Treibstoff noch da ist) und den Zustand (wie gut gewartet das Schiff ist)." },
                    { kind: "text", text: "Das Wichtigste an der Karte: Sie leuchtet auf und bekommt einen farbigen Rahmen, sobald dein Schiff eine Entscheidung von dir braucht – etwa wenn es reisebereit ist und auf die Abfahrt wartet, wenn es anlegen muss, wenn ein Angebot vorliegt oder wenn unterwegs ein Ereignis ansteht. Tippe die Karte dann an, um zu reagieren." },
                    { kind: "tip", text: "Ruhige, nicht leuchtende Karten brauchen gerade nichts von dir. Leuchtet eine Karte auf, will dein Schiff aktiv eine Entscheidung." },
                    { kind: "image", src: toggleOtherShips, caption: "Fremde Schiffe ein- oder ausblenden", align: "side" },
                    { kind: "text", text: "Auf der Weltkarte siehst du standardmäßig nicht nur deine eigenen Schiffe, sondern auch die der anderen Kapitäne, während sie unterwegs sind. Über die Schaltfläche „Andere Schiffe anzeigen\" kannst du fremde Schiffe ein- oder ausblenden – praktisch, wenn die Karte dir zu unübersichtlich wird und du dich nur auf deine eigene Flotte konzentrieren willst." },
                ],
            },
            {
                id: "Tanken & reparieren",
                title: "Tanken & reparieren",
                blocks: [
                    { kind: "image", src: portProfileActions, caption: "Betanken, reparieren oder verkaufen", align: "wide" },
                    { kind: "text", text: "Im Hafen bringst du dein Schiff wieder in Form. Beim Tanken wählst du selbst, auf wie viel Prozent du den Tank auffüllst – das hilft, wenn du Treibstoff sparen oder ganz vollmachen willst. Eine Reparatur setzt den Zustand des Schiffs wieder auf 100 Prozent." },
                    { kind: "text", text: "Beides braucht ein paar Spieltage Zeit und kostet Taler. Welche Fraktion du gewählt hast, macht hier einen spürbaren Unterschied: Manche tanken und reparieren günstiger, andere schneller." },
                    { kind: "tip", text: "Pflege lohnt sich doppelt: Ein gut gewartetes Schiff fährt zuverlässiger durch Ereignisse und ist am Ende mehr wert – und der Schiffswert zählt voll fürs Endergebnis." },
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
                    { kind: "text", text: "Auf der Frachtbörse findest du alle Transportaufträge, die du annehmen kannst. Jeder Auftrag beschreibt genau, was zu tun ist: Es gibt einen Starthafen, in dem die Ware wartet, und einen Zielhafen, zu dem sie gebracht werden muss. Außerdem siehst du, wie viel Platz die Fracht im Laderaum belegt und welche Belohnung du bei pünktlicher Lieferung bekommst." },
                    { kind: "image", src: cargoBoard, caption: "Ein Auftrag auf der Frachtbörse", align: "wide" },
                    { kind: "text", text: "Manche Aufträge sind dauerhaft verfügbar und warten geduldig auf dich. Andere verschwinden nach einer Weile wieder, wenn sie niemand annimmt. Ein guter Auftrag kann also auch mal weg sein, wenn du zu lange zögerst." },
                    { kind: "text", text: "Nicht jede Ware ist gleich. Der Frachttyp verrät dir, wie empfindlich eine Ladung ist: Verderbliche Ware wie Lebensmittel muss schnell ankommen, sonst verliert sie an Wert. Zerbrechliche Ware leidet unter rauen Passagen und Unwettern unterwegs. Besonders interessant sind Luxusgüter – sie bringen die höchsten Belohnungen." },
                    { kind: "image", src: mapMumbaiGold, caption: "Goldene Markierung: hier wartet Luxusfracht", align: "side" },
                    { kind: "text", text: "Häfen, in denen gerade Luxusaufträge auf einen Transporteur warten, leuchten auf der Karte golden auf. Das ist ein klares Signal, dass sich der Weg dorthin lohnen kann." },
                    { kind: "tip", text: "Liefere verderbliche und empfindliche Fracht zuerst und möglichst pünktlich. Gerade bei diesen Waren kostet dich eine Verspätung am meisten von der Belohnung." },
                ],
            },
            {
                id: "haefen",
                title: "Häfen & die Weltkarte",
                blocks: [
                    { kind: "text", text: "Neun große Häfen sind über feste Seerouten miteinander verbunden und bilden deine Spielwelt. Tippe einen Hafen auf der Karte an, um sein Hafenprofil zu öffnen. Dort findest du ein paar kurze Fakten über den Hafen und – ganz wichtig – die Aufträge, die gerade von dort aus verfügbar sind." },
                    { kind: "image", src: worldMap, caption: "Die Weltkarte mit allen neun Häfen", align: "wide" },
                    { kind: "text", text: "Du musst keine Routen selbst einzeichnen. Sobald du ein Ziel auswählst, sucht das Spiel automatisch den kürzesten Seeweg dorthin." },
                    { kind: "tip", text: "Wundere dich nicht, wenn ein Schiff am rechten Kartenrand verschwindet und links wieder auftaucht – das ist einfach der Weg über den Pazifik, die Welt ist rund." },
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
                    { kind: "text", text: "Hast du Fracht geladen und ein Ziel im Kopf, startest du die Reise direkt vom Schiff aus. Dabei wählst du den Zielhafen und entscheidest dich für eine Reisegeschwindigkeit – von „Langsam\" bis „Volldampf\"." },
                    { kind: "image", src: cargoBoard, caption: "Ziel und Geschwindigkeit auswählen", align: "wide" },
                    { kind: "text", text: "Die Geschwindigkeit ist eine echte Abwägung: Schneller zu fahren bedeutet, früher anzukommen, kostet aber spürbar mehr Treibstoff. Bevor du bestätigst, zeigt dir die Anzeige genau, wie viel Treibstoff die Reise verbraucht und wie viele Spieltage sie dauert." },
                    { kind: "image", src: shipcardDocking, caption: "Manuelles Anlegen steht an", align: "side" },
                    { kind: "text", text: "Beim Start kannst du zusätzlich einen Lotsendienst buchen. Mit Lotse laufen Abfahrt und Anlegen vollautomatisch und sicher ab – du musst dich um nichts kümmern. Verzichtest du auf den Lotsen, steuerst du selbst: Beim Auslaufen und beim Anlegen meisterst du jeweils ein kurzes Steuer-Minispiel. Misslingt es, gibt es eine kleine Strafe und etwas Verschleiß am Schiff." },
                    { kind: "tip", text: "Bei wertvoller oder verderblicher Fracht ist der Lotse oft gut investiertes Geld – ein misslungenes Anlegemanöver mit teurer Ladung ärgert mehr, als der Lotse gekostet hätte." },
                ],
            },
            {
                id: "leerfahrt",
                title: "Die Leerfahrt",
                blocks: [
                    { kind: "image", src: routeSpeed, caption: "„Wohin geht's hin, Kapitän?\"", align: "wide" },
                    { kind: "text", text: "Manchmal willst du ein Schiff ohne Ladung an einen anderen Ort bringen – zum Beispiel dorthin, wo gerade die richtig guten Aufträge warten, oder zu einem Hafen, in dem du günstig tanken und reparieren kannst." },
                    { kind: "text", text: "Genau dafür gibt es die Leerfahrt: eine ganz normale Reise, nur eben ohne Fracht an Bord. Sie kostet zwar Treibstoff, kann sich aber trotzdem lohnen, wenn dein nächster Auftrag dadurch deutlich besser ausfällt." },
                    { kind: "text", text: "Du startest sie über die Schiffsaktionen, indem du einfach ein Ziel wählst, ohne vorher Fracht zu laden. Ansonsten verläuft sie wie jede andere Reise – inklusive Geschwindigkeitswahl und der Möglichkeit, einen Lotsen zu buchen." },
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
                    { kind: "text", text: "Während ein Schiff unterwegs ist, können Ereignisse auftreten. Passiert das, pausiert die Reise und du musst ein kleines Minispiel meistern, um die Lage in den Griff zu bekommen." },
                    { kind: "text", text: "Bestehst du das Minispiel, geht die Fahrt ohne Schaden weiter. Scheiterst du, drohen unangenehme Folgen: Du kannst einen Teil deiner Fracht verlieren, dein Schiff nimmt Schaden, oder dir wird ein Teil der Belohnung abgezogen." },
                    { kind: "text", text: "Es gibt vier verschiedene Minispiele. Auf den nächsten Seiten erkläre ich dir jedes einzeln – mit Steuerung, Ziel und der besten Taktik." },
                    { kind: "tip", text: "Deine Fraktion beeinflusst, wie oft Ereignisse auftreten. Späher haben unterwegs deutlich mehr Ruhe, Schmuggler erleben dagegen besonders viel Aufregung." },
                ],
            },
            {
                id: "mg-rats",
                title: "Minispiel: Rattenbefall",
                blocks: [
                    { kind: "lead", text: "Ratten haben sich an Bord geschlichen und machen sich über die Ladung her. Jetzt heißt es schnell sein." },
                    { kind: "image", src: minigameRats, caption: "Triff die Ratten, bevor sie die Ladung erreichen", align: "side" },
                    { kind: "text", text: "Steuerung: Du spielst mit der Maus. Bewege den Cursor übers Deck und klicke auf jede Ratte, die auftaucht, um sie zu vertreiben." },
                    { kind: "text", text: "Ziel: Triff die geforderte Anzahl Ratten, bevor die Zeit abläuft. Die Ratten erscheinen einzeln an wechselnden Stellen des Decks – sobald du eine erwischt hast, taucht die nächste woanders auf." },
                    { kind: "text", text: "Wenn es schiefgeht: Schaffst du die geforderte Trefferzahl nicht rechtzeitig, fressen die Ratten einen Teil deiner Fracht an und du verlierst sie." },
                    { kind: "tip", text: "Lass den Cursor ruhig in der Mitte des Decks schweben, statt ihn an den Rand zu legen. So hast du zu jeder neuen Ratte einen kurzen Weg und reagierst schneller." },
                ],
            },
            {
                id: "mg-storm",
                title: "Minispiel: Sturm auf See",
                blocks: [
                    { kind: "lead", text: "Ein schweres Unwetter zieht auf. Blitze schlagen ins Wasser, und du musst dein Schiff heil durch den Sturm bringen." },
                    { kind: "image", src: minigameStorm, caption: "Sonnen sammeln, Blitzen ausweichen", align: "side" },
                    { kind: "text", text: "Steuerung: Du lenkst das Schiff nach links und rechts – entweder mit den Pfeiltasten ← und → oder mit den Tasten A und D." },
                    { kind: "text", text: "Ziel: Sammle die geforderte Anzahl Sonnen ein, die vom Himmel herabschweben, und weiche dabei den herabfahrenden Blitzen aus. Oben siehst du jederzeit die verbleibende Zeit, deine Haltbarkeit und deinen Sonnen-Fortschritt (zum Beispiel „Sonnen: 3 / 8\")." },
                    { kind: "text", text: "Wenn es schiefgeht: Jeder Blitz, der dich trifft, zieht ordentlich Haltbarkeit ab. Sinkt sie auf null oder bekommst du nicht genug Sonnen zusammen, ist das Minispiel verloren – dann drohen Zustandsschaden und Frachtverlust." },
                    { kind: "tip", text: "Konzentrier dich zuerst aufs Ausweichen und nimm Sonnen mit, die ohnehin auf deinem Weg liegen. Ein heiles Schiff bringt dich weiter als ein paar Sonnen mit halber Haltbarkeit." },
                ],
            },
            {
                id: "mg-passage",
                title: "Minispiel: Gefährliche Passage",
                blocks: [
                    { kind: "lead", text: "Vor dir liegt ein enges, gefährliches Fahrwasser voller Hindernisse. Nur wer geschickt ausweicht, kommt sauber durch." },
                    { kind: "image", src: minigamePassage, caption: "Den Hindernissen ausweichen Richtung Ziel", align: "side" },
                    { kind: "text", text: "Steuerung: Hier steuerst du frei in alle Richtungen – mit WASD oder den Pfeiltasten. So manövrierst du dein Schiff nach oben, unten, links und rechts." },
                    { kind: "text", text: "Ziel: Bring dein Schiff bis zum Ziel (am Rand mit „ZIEL\" markiert), ohne zu oft anzuecken. Mal führt der Weg durch offenes Wasser mit treibenden Felsen, mal durch eine enge Fahrrinne – die Hindernisse unterscheiden sich je nach Strecke." },
                    { kind: "text", text: "Wenn es schiefgeht: Jede Kollision beschädigt dein Schiff. Wird es dabei zerstört oder läuft die Zeit ab, bevor du das Ziel erreichst, gilt die Passage als nicht bestanden und du fährst mit Schaden weiter." },
                    { kind: "tip", text: "Lieber langsam und kontrolliert ausweichen als in Panik durchzubrettern. Kleine, ruhige Lenkbewegungen bringen dich sicherer durch als hektisches Hin und Her." },
                ],
            },
            {
                id: "mg-treasure",
                title: "Minispiel: Schatzjagd",
                blocks: [
                    { kind: "lead", text: "Ein Schatz wurde gesichtet! Anders als die übrigen Ereignisse ist die Schatzjagd freiwillig – und sie kann sich richtig lohnen." },
                    { kind: "image", src: minigameTreasureMaze, caption: "Schätze sammeln, Piraten ausweichen", align: "side" },
                    { kind: "text", text: "Vorab entscheidest du selbst: Folgst du der Spur oder nicht? Sagst du Nein, geht deine Reise ganz normal weiter, ohne Risiko und ohne Bonus. Sagst du Ja, beginnt die Schatzjagd – mit der Chance auf einen Bonus, aber auch dem Risiko, Fracht zu verlieren." },
                    { kind: "text", text: "Steuerung: Du fährst mit WASD oder den Pfeiltasten durch ein Labyrinth aus Seewegen." },
                    { kind: "text", text: "Ziel: Sammle die geforderte Anzahl Schätze ein und entkomme dabei den Piraten, die durch das Labyrinth patrouillieren. Schaffst du es, gibt es eine Extra-Belohnung obendrauf." },
                    { kind: "text", text: "Wenn es schiefgeht: Stellt dich ein Pirat, ist die Jagd vorbei und du gehst nicht nur leer aus, sondern riskierst auch noch einen Frachtverlust." },
                    { kind: "tip", text: "Plane deinen Weg kurz voraus und merke dir, wo die Piraten kreisen. Ein Schatz direkt neben einem Piraten ist es selten wert – hol dir lieber zuerst die sicher erreichbaren." },
                ],
            },
            {
                id: "lotsenstreik",
                title: "Lotsenstreik",
                blocks: [
                    { kind: "text", text: "Ab und zu legen die Lotsen in einem Hafen die Arbeit nieder. Solange der Streik andauert, kannst du dort keinen Lotsendienst buchen und musst beim An- und Ablegen selbst ans Steuer – also das Steuer-Minispiel meistern." },
                    { kind: "text", text: "Hattest du den Lotsen für diesen Hafen schon gebucht und der Streik bricht aus, wird der Dienst automatisch storniert und dir der Betrag zurückerstattet. Du verlierst also kein Geld, musst aber selbst Hand anlegen." },
                    { kind: "tip", text: "Bringst du wertvolle Fracht zu einem Hafen, der zum Streik neigt, plane etwas zeitlichen Puffer ein – falls du am Ende doch selbst anlegen musst." },
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
                    { kind: "text", text: "Beim Auslaufen aus einem Hafen bekommst du manchmal ein verlockendes Schmuggelangebot: Du kannst zusätzliche, illegale Ware an Bord nehmen und dafür eine satte Extra-Belohnung kassieren. Ob du annimmst, entscheidest du ganz frei." },
                    { kind: "text", text: "Der Haken liegt auf der Hand: Sobald du illegale Ware geladen hast, riskierst du bei der Ankunft im Zielhafen eine Zollkontrolle. Schmuggel ist also immer eine Wette auf dein Glück." },
                    { kind: "image", src: customsDialog, caption: "Kooperieren oder bestechen?", align: "side" },
                    { kind: "text", text: "Hast du keine illegale Ware an Bord, wirst du beim Anlegen einfach durchgewunken. Führst du dagegen Schmuggelgut mit dir, kann der Zoll es bei einer Kontrolle entdecken – mit etwas Glück bleibt es aber unbemerkt." },
                    { kind: "text", text: "Wirst du erwischt, hast du zwei Möglichkeiten: kooperieren (du zahlst eine Strafe und wirst kurz festgehalten) oder den Beamten bestechen (kostet weniger, klappt aber nur manchmal)." },
                ],
            },
            {
                id: "regress",
                title: "Strafe & Regress",
                blocks: [
                    { kind: "image", src: customsBribeFailed, caption: "Bestechung fehlgeschlagen", align: "side" },
                    { kind: "text", text: "Geht eine Bestechung daneben, wird es richtig teuer: Du zahlst die Bestechungssumme und obendrauf die doppelte Strafe – und festgehalten wirst du trotzdem. Bestechen ist also ein echtes Wagnis und nichts für schwache Nerven." },
                    { kind: "image", src: regress, caption: "Regress: Abzug von der Belohnung", align: "wide" },
                    { kind: "text", text: "Davon ganz unabhängig gibt es noch den Regress. Damit ist gemeint: Kommt eine Lieferung zu spät oder beschädigt im Zielhafen an, wird dir ein Teil der vereinbarten Belohnung wieder abgezogen. Bei empfindlicher und verderblicher Fracht fällt dieser Abzug besonders heftig aus." },
                    { kind: "tip", text: "Regress trifft dich auch ohne jeden Schmuggel – allein durch Verspätung oder Schäden. Pünktliche, heile Lieferungen sind deshalb fast immer die sicherste Einnahmequelle." },
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
                    { kind: "text", text: "Gleich zu Beginn jeder Runde wählst du eine von sieben Fraktionen. Deine Fraktion gibt dir feste Vor- und Nachteile, die zu einer bestimmten Spielweise passen – die eine spart beim Treibstoff, die nächste lädt schneller, wieder eine andere lebt vom Schmuggel." },
                    { kind: "text", text: "Es gibt keine insgesamt beste Fraktion. Es gibt nur die, die am besten zu deinem Plan passt. Überleg dir kurz, wie du spielen willst, und wähle danach." },
                    { kind: "text", text: "Ingenieure sind die Meister der Mechanik: Ihre Reparaturen sind günstiger, dafür brauchen sie beim Be- und Entladen etwas länger. Raffinerien kontrollieren die Rohstoffe und fahren besonders sparsam – der Preis dafür: Sie reparieren ein wenig langsamer." },
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
                    { kind: "text", text: "Der Preis dafür: Unterwegs passieren ihnen mehr Ereignisse als allen anderen. Eine Fraktion für mutige Kapitäne, die das Risiko nicht scheuen." },
                    { kind: "tip", text: "Schmuggler und Späher sind echte Gegenpole: Der eine sucht das Risiko und die Aufregung, der andere die ruhige, sichere Fahrt. Wähle nach deinem Nervenkostüm." },
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
                    { kind: "text", text: "Die Rangliste zeigt dir jederzeit, wie du im Vergleich zu den anderen Kapitänen dastehst. Gewertet wird dabei immer das Gesamtvermögen – Bargeld plus Schiffswerte. Für jede erfolgreich gelieferte Fracht erscheint außerdem kurz eine Belohnungs-Einblendung, die nach wenigen Sekunden von selbst wieder verschwindet." },
                ],
            },
            {
                id: "spielende",
                title: "Das Spielende",
                blocks: [
                    { kind: "image", src: gameoverPodium, caption: "Die Siegerehrung", align: "side" },
                    { kind: "text", text: "Ist der letzte Spieltag der Runde erreicht, endet das Spiel automatisch. Kurz vorher wirst du mit einer Einblendung gewarnt, dass es bald so weit ist – so kannst du noch letzte Geschäfte abschließen." },
                    { kind: "text", text: "Am Ende werden alle Vermögen miteinander verglichen. Wer am meisten besitzt – Bargeld und Schiffe zusammengerechnet – gewinnt die Runde und wird zum Herrscher der Meere gekrönt." },
                    { kind: "tip", text: "Weil deine Schiffe voll mitzählen, lohnt es sich, sie bis zum letzten Tag in gutem Zustand zu halten, statt sie verkommen zu lassen. Ein gepflegtes Schiff ist bares Geld wert." },
                ],
            },
        ],
    },
];