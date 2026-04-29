# Datenbank starten

## Lokal

```powershell
cd "D:\Crowns Of The Seas\backend"
$env:SPRING_PROFILES_ACTIVE="local"
.\gradlew.bat bootRun
```

## NeonDB

````powershell
cd "D:\Crowns Of The Seas\backend"
$env:SPRING_PROFILES_ACTIVE="demo"
.\gradlew.bat bootRun
````