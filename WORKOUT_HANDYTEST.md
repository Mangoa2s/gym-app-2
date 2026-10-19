# Workout auf deinem Handy testen

Der neue Screen ist lokal testbar. Nur dieser Screen wurde verändert. Andere Screens folgen erst nach deiner Beurteilung. Der physische Handytest steht noch aus: Hier war kein Handy angeschlossen.

## Öffnen

Der vorhandene Expo-Server läuft auf Port 8081. Computer und Handy müssen im selben WLAN/LAN sein. Öffne die App wie bisher in Expo Go; die lokale Adresse ist `exp://192.168.2.128:8081`. Bereits geöffnete App einmal neu laden. Falls der Server später nicht mehr läuft: Terminal im Ordner `gymapp` öffnen und `npm start` ausführen, dann den angezeigten QR-Code scannen. Die IP kann sich später ändern; dann die neue Terminaladresse benutzen.

Alternativ zum Prüfen mit separaten Daten: im privaten Safari-Tab `http://192.168.2.128:8081` öffnen. Browserdaten sind von Expo Go getrennt. Ein Browsertest ersetzt den Test der nativen App mit ihrer Tastatur und Safe Areas nicht.

## Testfolge

1. **Frischer Start:** Eine bestehende Sitzung gegebenenfalls regulär abschließen. Auf „Workout starten“ tippen. Das Licht läuft kräftiger am Rand entlang; Datum, Timer und Geist erscheinen leicht versetzt. Der Timer zählt sofort die echte Zeit. Die früheren beiden Hilfstexte fehlen.
2. **Laufendes Workout:** Mindestens 60 Sekunden betrachten. Die warmen Bereiche wandern unterschiedlich schnell an allen Rändern; die Mitte bleibt dunkel. Bei einer positiven Serie schwebt der kleine Geist unabhängig vom Button. Mit „Übersicht“ zurück und „Zum Training“ wieder öffnen: Startzeit bleibt gleich und die Startanimation wird nicht wiederholt. App kurz in den Hintergrund schicken: Der Timer berücksichtigt die vergangene Zeit.
3. **Übung und Sätze:** „Übung hinzufügen“ drücken. Schon beim Drücken soll eine kleine physische Bewegung mit stärkerem Licht sichtbar sein; die Auswahl öffnet sofort. Bankdrücken suchen und hinzufügen. Satzzeile antippen, z. B. 62,5 kg und 8 Wiederholungen eingeben und bestätigen. Die Zeile meldet kurz „Gespeichert“. Bearbeiten und Bestätigung zurücknehmen müssen weiter funktionieren. Mehrere Übungen und Sätze ergänzen und wiederholt scrollen, während das Licht läuft.
4. **Kleines iPhone und Tastatur:** Besonders auf einem iPhone SE prüfen. Gewicht und Wiederholungen müssen oberhalb der Tastatur erreichbar sein. Die kompakte Uhr bleibt sichtbar und „Übung hinzufügen“ erreichbar. Tastatur schließen: „Training beenden“ hat eine eigene, große Tippfläche mit Abstand zur Hauptaktion und zum Home-Indikator. Zusätzlich größere Systemschrift ausprobieren.
5. **Streak 0:** In einem frischen privaten Safari-Tab ohne gespeicherte Workouts starten. Rechts steht `0×` mit „Keine Serie“, der Geist bleibt ruhig. In Expo Go mit vorhandenen Daten steht immer deine tatsächliche Serie; Daten nicht löschen, um 0 zu erzwingen.
6. **Streak 10:** Im separaten privaten Browser-Test über **Kalender → vergangenen Tag wählen → Workout nachtragen** für gestern und die neun Tage davor je ein Test-Workout speichern: mindestens 1 Minute Dauer, eine Übung, gültige Werte, mindestens ein bestätigter Satz. Die Tage müssen lückenlos sein. Anschließend starten: `10×`. Am 13. Oktober 2026 wären das 3.–12. Oktober. Nur abgeschlossene Tage zählen, nicht Planungen oder ein noch laufendes Workout. Diese Einträge ausschließlich in der separaten Testsession anlegen.
7. **Reduced Motion:** Auf dem iPhone **Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren** einschalten, dann zur App zurückkehren. Kein Randumlauf, kein Schweben und keine Button-Skalierung; das statische warme Licht, Timer und Eingaben bleiben. Auch bei bereits laufendem Workout prüfen. In Safari gegebenenfalls die Seite neu laden. Danach die Einstellung ausschalten und erneut prüfen.
8. **Abschluss:** „Training beenden“ tippen, mit „Weitertrainieren“ abbrechen, erneut öffnen und regulär speichern. Die bestehenden Daten und der Abschluss bleiben erhalten.

## Welche Datei macht was?

| Datei | Änderung in einfachen Worten |
| --- | --- |
| `src/components/berkk/workout-timer-overlay.tsx` | Datumskapsel, Streak-Platz, frei stehender Timer und kompakte Ansicht mit Übungen. Entfernt die beiden Hilfstexte. Nur die Timer-Komponente aktualisiert sich pro Sekunde. |
| `src/components/berkk/workout-ambient.tsx` | Vier warme Ränder, drei unabhängig wandernde Lichter, dezentes Violett und eine feste dunkle Mitte. Ein stärkerer Umlauf beim Start. |
| `src/components/berkk/workout-add-button.tsx` | Dunkle beleuchtete Oberfläche, eigener äußerer Lichtschein, kleine sofortige Druckbewegung und Lichtimpuls. Öffnet weiterhin die vorhandene Übungsauswahl. |
| `src/components/berkk/workout-streak.tsx` | Neues kleines Anzeigeelement mit vorhandenem Geist-Symbol, echter Streak-Zahl und verständlicher 0-Anzeige. |
| `src/components/berkk/workout-light.tsx` | Wiederverwendbare, statische weiche Lichtgrafik für Hintergrund, Button und Geist. |
| `src/components/berkk/workout-recorder.tsx` | Entfernt die feste Mindesthöhe der leeren Mitte; die bestehende Liste und Eingaben behalten ihren Platz. Ergänzt eine technische Kennung für den Scrolltest. |
| `src/constants/workout-motion.ts` | Sammelt Farben, Stärkeeinstellungen, Bewegungszeiten und die größeren Abstände unter der Hauptaktion. |
| `src/hooks/use-workout-drift.ts` | Ermöglicht verschiedene Ausgangspositionen der Randlichter. Die vorhandenen Pausen bei Hintergrund und fehlendem Fokus bleiben. |
| `DESIGN.md`, `WORKOUT_RUNNING_DESIGN.md` | Dokumentieren die neue Darstellung dieses Screens, Datenquellen und Prüfgrenzen. |
| `WORKOUT_HANDYTEST.md` | Diese Erklärung und die Testschritte. |
| `.playwright-mcp/workout-edge-check.cjs` | Lokaler isolierter Browsertest mit eigenen Daten; ist kein App-Screen und kein Teil der Workout-Funktionen. Aufnahmen und Prüfbericht liegen in `.playwright-mcp/workout-edge/`. |

## Warum das Scrollen möglichst wenig belastet wird

Die Lichtgrafiken bleiben unverändert. Reanimated verschiebt auf dem nativen UI-Thread nur drei begrenzte Flächen und verändert deren Deckkraft. Es gibt keine laufende Blur-Neuberechnung und keine Animation aller Bildpunkte. Die Mitte bleibt durch eine feste dunkle Ebene geschützt. Geist und Button besitzen getrennte, kleine Licht-/Bewegungsebenen. Hintergrund und Licht fangen keine Berührungen ab. Die Übungsliste liegt davor in ihrer eigenen ScrollView; Timer und Aktionen liegen außerhalb. Die Timer-Sekunden rendern nicht die ganze Liste neu.

Das ist eine sparsame Konstruktion, aber noch kein gemessener Nachweis für dein iPhone. Prüfe auf dem Handy während der Lichtbewegung wiederholt Eingaben und lange Scrollbewegungen. Achte auf verzögerte Tastendrücke, stockendes Scrollen oder deutlich zunehmende Wärme. Für eine belastbare Bildrate braucht es zusätzlich einen profilierten nativen Build auf dem echten Gerät.

Datum kommt aus `useLocalDay()` und `formatDay()` anhand der lokalen Handyzeit. Die Streak stammt allein aus `trainingStreak(workoutStore.history, today)`. Store, Datenschema, Streak-Regeln und Speicherfeedback wurden nicht geändert. Es existiert im gelesenen Stand keine PR-Erkennung oder Adrenalin-Animation; diese Umsetzung erfindet keine Rekorde.

## Bisher geprüft

Typecheck, Lint, 19 Workout- und 17 Kalender-Tests. Isolierter Browserlauf bei 320 × 568, 375 × 667, 390 × 844 und 1280 × 900: Start, Suche, Satzwerte, Speicherfeedback, Entwürfe nach Reload, Streak 0/10, Stundenanzeige, lange Liste, Reduced Motion und Fortsetzen. Keine Seitenfehler. iOS-/Android-Bundles mit Hermes. Native Tastatur, echte Safe Areas und Geräteleistung bleiben offen für deine Handyabnahme.

Bitte beurteile zuerst auf deinem Handy Randlicht, Timergröße und Button. Bis zu diesem Feedback werden keine weiteren Screens gestaltet.
