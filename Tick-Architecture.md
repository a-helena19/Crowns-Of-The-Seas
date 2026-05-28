# Backend Architektur – Tick-System

## Überblick

Das Tick-System besteht aus drei Klassen:

```
GameTickScheduler  →  GameTickProcessor  →  TickContext
   (Scheduling)         (Spiellogik)        (Daten)
```

**`GameTickScheduler`** – Kümmert sich nur um Timing, Locking und Rate-Limiting. Enthält keine Spiellogik und keine Repository-Abhängigkeiten.

**`GameTickProcessor`** – Enthält die gesamte Spiellogik eines Ticks. Läuft in einer einzigen `@Transactional` Methode. Wird vom Scheduler über Spring Dependency Injection aufgerufen, damit die Transaktion korrekt funktioniert.

**`TickContext`** – Hält alle Daten, die für einen Tick benötigt werden. Wird einmal am Anfang des Ticks gebaut und an alle Methoden weitergereicht.

---

## Warum ist das so aufgebaut?

Vorher hat der Scheduler alle Daten in jeder Methode einzeln aus der Datenbank geladen. Bei 4 Spielern mit je 2 Schiffen waren das ~30+ DB-Queries pro Tick. Bei mehreren parallelen Sessions hat sich das multipliziert und die Ticks wurden extrem langsam.

Jetzt werden alle Daten **einmal** am Anfang des Ticks geladen (6-7 Queries) und über den `TickContext` an alle Methoden weitergegeben.

---

## Regeln für neue Features

### 1. Keine neuen Repository-Aufrufe im Tick

Wenn dein Feature Daten braucht, die pro Session existieren (Ships, Travels, Cargos, etc.), dann nutze den `TickContext` statt selbst `repository.findAll()` aufzurufen.

```java
// FALSCH – neue DB-Query im Tick
private void meinNeuesFeature(UUID sessionId) {
    List<PlayerShip> ships = playerShipRepository.findAllBySessionId(sessionId);
    // ...
}

// RICHTIG – Daten aus dem Context nehmen
private void meinNeuesFeature(TickContext ctx) {
    List<PlayerShip> ships = ctx.getAllShips();
    // ...
}
```

### 2. Wenn du neue Daten im Tick brauchst, erweitere den TickContext

Falls dein Feature eine Tabelle braucht, die noch nicht im Context ist:

1. Füge das Feld + Getter in `TickContext` hinzu
2. Lade die Daten in `GameTickProcessor.buildTickContext()` einmal
3. Nutze sie über `ctx.getMeineNeuenDaten()`

```java
// In TickContext.java
private final List<MeinEntity> meineEntities;

public List<MeinEntity> getMeineEntities() {
    return meineEntities;
}

// In GameTickProcessor.buildTickContext()
List<MeinEntity> meineEntities = meinRepository.findAllBySessionId(sessionId);
// ... und dem Constructor übergeben
```

### 3. Geänderte Entities über den Context tracken

Wenn du im Tick ein Entity änderst, speichere es nicht sofort einzeln, sondern markiere es als modifiziert. Am Ende des Ticks wird alles gesammelt gespeichert.

```java
// FALSCH – einzelner Save im Tick
ship.setStatus(ShipStatus.READY);
playerShipRepository.save(ship);

// RICHTIG – markieren, wird am Ende batch-gesaved
ship.setStatus(ShipStatus.READY);
ctx.markShipModified(ship);
```

Aktuell funktioniert das Batch-Saving für `PlayerShip`. Für andere Entity-Typen (`Travel`, `SessionCargo`) gibt es `markTravelModified()` und `markCargoModified()` im Context – die `saveAll()`-Aufrufe dafür müssten noch in `executeTick()` ergänzt werden, wenn ihr sie braucht.

### 4. Statische Daten gehören in den Cache

Daten, die sich während einer Session nicht ändern (Ports, Ship-Templates, Routen, Cargo-Typen), werden in `GameTickProcessor` gecacht und nur einmal aus der DB geladen.

```java
// In GameTickProcessor
private volatile List<MeinStatischerTyp> cachedDaten;

private List<MeinStatischerTyp> getCachedDaten() {
    if (cachedDaten == null) {
        cachedDaten = meinRepository.findAll();
    }
    return cachedDaten;
}
```

### 5. Spiellogik gehört in den GameTickProcessor, nicht in den Scheduler

Der `GameTickScheduler` hat keine Spiellogik und keine Repositories. Neue Tick-Features kommen immer in den `GameTickProcessor`.

```java
// In GameTickProcessor.executeTick(), nach den bestehenden Checks:
checkLoadingCompletion(ctx);
checkRefuelingCompletion(ctx);
checkRepairingCompletion(ctx);
// ...
meinNeuesFeature(ctx);  // ← hier einfügen
```

### 6. Sub-Services die vom Tick aufgerufen werden

Einige Services wie `TravelArrivalService`, `CargoUnloadingPhaseService` etc. werden vom Tick aufgerufen und haben eigene `@Transactional` Annotationen. Das ist ok – da `executeTick()` bereits eine Transaktion öffnet, klinken sich die Sub-Services automatisch in dieselbe Transaktion ein (Spring Default: `REQUIRED`).

Wenn dein neuer Service vom Tick aufgerufen wird, muss er **nicht** `REQUIRES_NEW` verwenden. Normales `@Transactional` reicht.

### 7. Zugriff von außerhalb des Ticks

Wenn ein REST-Controller oder ein anderer Service eine sofortige Aktualisierung der Ship-Positionen braucht (z.B. nach einem Schiffskauf), nutze:

```java
gameTickScheduler.triggerImmediateBroadcast(sessionId);
```

Das baut intern einen eigenen `TickContext` und broadcastet die Positionen, ohne den Tick-Zyklus zu stören.

---

## Dateiübersicht

```
application/services/impl/session/
├── GameTickScheduler.java    — Scheduling, Lock, Rate-Limiting (~90 Zeilen)
├── GameTickProcessor.java    — Spiellogik, @Transactional (~600 Zeilen)
└── TickContext.java           — Vorgeladene Daten für einen Tick (~180 Zeilen)
```

---

## Properties

In `application.properties` sind folgende Performance-relevante Einstellungen:

```properties
# SQL-Logging ist aus – nicht einschalten bei Performance-Tests
spring.jpa.show-sql=false
logging.level.org.hibernate.SQL=OFF

# Connection Pool: 15 Connections, 5 idle
spring.datasource.hikari.maximum-pool-size=15
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=5000
```

Falls du beim Entwickeln SQL-Queries sehen willst, kannst du `show-sql` **lokal** auf `true` setzen. Aber nicht committen – bei mehreren Sessions flutet das die Konsole und bremst die Performance.