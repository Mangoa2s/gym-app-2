# Trainingsmodus: Übungen und Einträge

## Katalog erweitern

`src/data/exercises.ts` enthält **117 Übungen**, 13 Kategorien (12 Muskelgruppen plus Cardio), 8 Equipment-Gruppen und alle 5 Erfassungstypen. Der Katalog deckt verbreitete Gym-Übungen und Varianten ab; er ist kein vollständiges Verzeichnis aller Übungen.

Eine Zeile in `definitions` hat dieses Schema:

```ts
['stable-id', 'Deutscher Name', 'English name', 'Brust', 'Kurzhantel', 'strength', 'synonyme suchbegriffe', ['Trizeps']]
```

IDs bleiben bei Umbenennungen stabil. Synonyme gehören in die Suchbegriffe derselben Übung. Der letzte Parameter ist optional. Kategorien, Equipment und Erfassungstypen sind als TypeScript-Typen festgelegt. Eigene Übungen werden über das Such-Sheet erstellt und im lokalen Store gespeichert; gleiche deutsche oder englische Namen verweisen auf die vorhandene Übung.

## Erfassung

`src/data/workout-records.ts` definiert Felder, Validierung und Historienbeschriftung:

| Typ | Pflichtfelder | Optional |
| --- | --- | --- |
| `strength` | kg, ganze Wiederholungen | — |
| `bodyweight` | ganze Wiederholungen | Zusatzgewicht in kg |
| `assisted` | Unterstützung in kg, ganze Wiederholungen | — |
| `hold` | Sekunden | Zusatzgewicht in kg |
| `cardio` | Minuten, auch dezimal | Distanz in km |

Dezimalkomma und Dezimalpunkt sind zulässig. Entwürfe bleiben Strings, damit auch unfertige Eingaben wie `65,` beim Neustart erhalten bleiben. Bestätigung benötigt gültige Werte. Jede Änderung hebt die Bestätigung auf; ein erneuter Druck auf einen bestätigten Haken nimmt sie zurück. Es werden keine Leistungswerte vorausgefüllt.

## Lokaler Zustand

- `src/store/workout-state.ts`: Zustand-Store mit injizierbarem Speicher und Uhr für Tests.
- `src/store/workout.ts`: AsyncStorage-Anbindung; Schlüssel `berkk-workouts`, Schema-Version 1.
- Gespeichert werden Session, aufgeklappte Übung, Entwürfe, Bestätigungen, eigene Übungen und Historie. Schreibvorgänge werden in Reihenfolge abgearbeitet.
- Vor dem Laden sind neue Sessions gesperrt. Fehlerhafte gespeicherte Daten werden nicht überschrieben; Lade- und Speicherfehler bieten eine Wiederholung an.
- Beenden speichert ausschließlich bestätigte Einträge mit Übungsmetadaten. Die aktive Session bleibt bei einem Schreibfehler erhalten. Der Abschlussdialog nennt verworfene, ausgefüllte Entwürfe.
- Die Trainingsdauer basiert weiterhin auf `startedAt`, nicht auf gezählten Timer-Ticks. Wiederhergestellte Sessions überspringen die Startanimation.

## Oberfläche

`workout-recorder.tsx` enthält die aufklappbare Liste und Eingaben. `exercise-search.tsx` nutzt das vorhandene Full-Layout von `DetailSheetProvider`: Ziehen nur am Kopf, unabhängige Liste, deutsche/englische Suche und kombinierbare Filter. Der Timer bleibt auch im Sheet sichtbar. `src/app/(tabs)/progress.tsx` zeigt die gespeicherte Workout-Historie.

## Tatsächlich geprüft

- `npx tsc --noEmit`
- `npm run lint`
- `node --test scripts/workout.test.mjs scripts/workout-recording.test.mjs scripts/body-weight.test.mjs`: 29 Tests; darunter Erfassung, Validierung, schnelle Mehrfachaktionen, langsamer/fehlerhafter Speicher und Wiederherstellung.
- Separater Chromium-Browserkontext: deutsche/englische Suche, alle fünf Erfassungstypen ausfüllen/bestätigen/korrigieren/Bestätigung zurücknehmen; bereits enthaltene Übung auswählen; Löschschutz; eigene Übung erstellen; Seite neu laden und Session einschließlich unvollständiger Dezimaleingabe wiederherstellen; beenden und alle fünf Einträge in der Historie öffnen.
- Screenshots bei 390 × 844 und 1280 × 900; mechanische Designprüfung ohne Befund.

Ein echter iOS-/Android-App-Neustart, native Bildschirmtastatur, Safe Areas auf Geräten und native Ziehgesten konnten in dieser Umgebung nicht getestet werden. Der Browser-Neuladevorgang und die Speicher-Tests decken die Wiederherstellungslogik ab, ersetzen diesen Gerätetest aber nicht.

### Abschlussreview: bestanden

| Befund | Ergebnis |
| --- | --- |
| Deutsche Singularformen | Behoben: Satz, Eintrag, Übung und Training |
| Zu breite Eingabezeilen am Desktop | Behoben: zentrierte Spalte mit maximal 800 px; mobile Ansicht unverändert |
