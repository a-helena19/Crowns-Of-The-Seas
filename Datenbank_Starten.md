# Datenbank starten

## Lokal

Docker Desktop muss laufen.

Über den Play Button in IntelliJ muss nichts eingestellt werden.

Wenn man das Terminal benutzt, muss man folgendes eingeben:

```powershell
cd "D:\Crowns Of The Seas\backend"
$env:SPRING_PROFILES_ACTIVE="local"
.\gradlew.bat bootRun
```

## NeonDB

Und bei NeonDB (Für Coachings und Endpräsi):

````powershell
cd "D:\Crowns Of The Seas\backend"
$env:SPRING_PROFILES_ACTIVE="demo"
.\gradlew.bat bootRun
````