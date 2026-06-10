# Auth Service Setup

## Lokale Entwicklung

Backend und Auth-Service werden **separat** gestartet.

### Backend starten
```bash
# Terminal 1 — aus backend/
./gradlew bootRun
# oder IntelliJ: BackendApplication Play-Button
```
Startet automatisch: `crowns-postgres-container` (Port 5432)

### Auth-Service starten
```bash
# Terminal 2 — aus auth-service/
./gradlew bootRun
# oder IntelliJ: AuthServiceApplication Play-Button
```
Startet automatisch: `crowns-auth-postgres-container` (Port 5433)

---

## Erstes Setup (einmalig)

Damit der Auth-Service auf dem Server deployt werden kann, muss das Docker Image einmalig gebaut werden:

```bash
docker build -t eateam6-auth-service:latest ./auth-service
```
