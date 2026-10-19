# Aktiver Workout-Screen · Randlicht

Testbarer Arbeitsstand vom 13. Oktober 2026. Gilt ausschließlich für `/workout`; weitere Screens warten auf das Handyfeedback. Die beiden Anhänge bestimmen die Lichtstimmung, BERKKs bestehendes Nachtglas-System bestimmt Farben, Schrift und Funktionen. [Handytest und Dateierklärung](WORKOUT_HANDYTEST.md).

## Darstellung und Daten

Links oben steht das aktuelle lokale Gerätedatum in einer dunklen, durchscheinenden Kapsel (`rgba(20,16,19,0.76)`, Creme, feine Kante). `useLocalDay()` und `formatDay()` liefern Datum und deutsche Darstellung. Das Datum aktualisiert sich beim Tageswechsel und bei App-Rückkehr; es ist nicht auf den Beispieltag festgelegt.

Rechts oben steht das vorhandene `GhostIcon` in 25 Punkten Größe. `WorkoutStreak` liest ausschließlich `workoutStore.history` und berechnet `trainingStreak(history, today)` aus `src/data/calendar.ts`, genau wie Home und Kalender. Abgeschlossene lokale Trainingstage zählen; mehrere Workouts am selben Tag zählen einmal. Eine Serie kann an heute oder gestern enden. Lücken werden nicht überbrückt, Planungen und das noch laufende Workout erhöhen die Serie nicht. Bei 0: ruhiger Geist, `0×`, `Keine Serie`, kein Licht und kein Schweben. Bei positiver Serie: reale Zahl, warmes Licht, eigenes leichtes Schweben. Keine Streak-Regel wurde geändert.

Der frei stehende Timer dominiert den oberen Bereich. Die sichtbaren Texte „Trainingszeit“ und „Füge deine erste Übung hinzu“ sind entfernt. Die Zugänglichkeitsbeschriftung benennt weiterhin die Trainingszeit. Schibsted Grotesk Black, Creme, tabellarische Ziffern, Schriftgröße bis 112 bzw. 40 mit Übungen. Die Breite berücksichtigt Zeichenanzahl, Doppelpunkte, Schriftvergrößerung und Reserve; Stundenanzeigen passen auf 320 Punkte Breite. Der Timer wird von `session.startedAt` und dem bestehenden Timer-Hook berechnet. Sekunden aktualisieren nur die Timer-Komponente, nicht die Satzliste.

## Licht und Bewegung

Vier statische, ungleich platzierte Randflächen bilden orange-rotes Grundlicht. Drei weitere statische radiale SVG-Texturen wandern unabhängig am abgerundeten Rand: 38, 53 und 67 Sekunden pro Umlauf, mit unterschiedlicher Ausgangsposition und leichter Deckkraftänderung. Ein sehr schwacher violetter Lichtbereich liegt statisch in der Dunkelheit. Eine feste dunkle radiale Maske hält die Mitte lesbar. Kein gewöhnlicher gleichmäßiger Bildschirmverlauf, kein animierter Blur, keine Berechnung einzelner Pixel.

Beim frischen Start führt die erste warme Fläche während des bestehenden gemeinsamen Starttakts einen kräftigeren Umlauf aus und beruhigt sich. Datum, Timer und Streak erscheinen versetzt (100, 180, 260 ms; je 340 ms Eintritt). Fortsetzen und Reload wiederholen den Start nicht; `claimIntro` und die gespeicherte Startzeit bleiben erhalten.

Die CTA-Oberfläche bleibt dunkel warmbraun: oben beleuchtet, unten dunkler, warme Kante, separater Plusbereich und Creme-Text. Eine äußere, weich auslaufende Lichtfläche und ein innerer Lichtfleck wandern mit 7,3 Sekunden pro Richtung. Nur die Lichtflächen bewegen sich. Drücken startet sofort die Reaktion: über 70 ms auf 97,5 Prozent Größe, kurzer Lichtimpuls, Rückkehr über 110 ms. Die vorhandene Übungsauswahl öffnet ohne auf den Impuls zu warten. Kein Orange-Violett-Balken.

Der Geist hat einen unabhängigen Takt von 3,1 Sekunden pro Richtung und einen Weg von ±2,5 Punkten. CTA, Geist und Randlicht laufen nicht synchron. Alle Dauertakte pausieren ohne Routenfokus und bei inaktiver App. Reduced Motion friert die Lichtflächen ein, entfernt Geistbewegung, Skalierung und Startumlauf und behält kurze Deckkraft-/Druckrückmeldung. Änderungen der Systemeinstellung werden vom vorhandenen Motion-Provider beobachtet.

## Layout und bestehende Funktionen

Kopf, Timer und Footer liegen im normalen Layoutfluss. Obere, seitliche und untere Safe Areas werden berücksichtigt. Der Timer liegt außerhalb der Übungs-ScrollView und bleibt sichtbar. Mit Übungen wird er kompakt und gibt Platz für echte Namen und Sätze aus `session.exercises` frei. Bestehende Eingaben, Bestätigung, Korrektur, Löschen, Suche und Speichern bleiben erhalten.

Der Button hat mindestens 70 Punkte Höhe und Radius 20. „Training beenden“ besitzt mindestens 48 Punkte Tippfläche, 20 Punkte Abstand zur Hauptaktion und zusätzlich 20 Punkte Luft über der unteren Safe Area (mindestens 12). Bei offener nativer Tastatur bleibt die bestehende Footer-/KeyboardAvoidingView-Logik erhalten. Der leere Scrollbereich erzwingt keine Mindesthöhe mehr und drückt auf kleinen Displays die Aktionen nicht hinaus.

Nach erfolgreichem dauerhaftem Speichern erhält nur die Satzzeile das vorhandene kurze „Gespeichert“-Feedback. Kein Feedback bei fehlgeschlagenem Schreiben oder zwischenzeitlich verändertem Satz. Im gelesenen Projekt existiert keine PR-Erkennung oder stärkere Adrenalin-Animation; es wurde keine erfunden und keine neue Workout-Funktion gebaut.

## Prüfung

- Typecheck und Lint bestanden; 19 Workout- und 17 Kalender-Tests bestanden.
- Endgültiger iOS- und Android-Export mit Hermes nach dem letzten Timer-Breitenfix erfolgreich.
- Isolierter Chrome-Browserlauf ohne Nutzer-Daten: Start, sichtbares Randlicht, 320 × 568 / 375 × 667 / 390 × 844 / 1280 × 900, Suche, Hinzufügen, Gewicht/Wiederholungen, Satzbestätigung mit lokalem Feedback, Reload mit unvollständigem `65,`, unveränderte Startzeit, Streak 0 und 10, Stundenanzeige, lange Liste, Reduced Motion, Abschluss abbrechen, Übersicht und Fortsetzen. Keine Seitenfehler oder offenen Prüfbefunde.
- Die Testdaten für `10×` bestehen aus zehn tatsächlich bestätigten Einträgen in einem eigenen Browserkontext. Die App enthält keine fest codierte Zehn. Berkk-Stores und Streak-Berechnung wurden nicht bearbeitet.
- Design-Detektor: eine Palette-Hinweismeldung für die ausdrücklich gewollte dunkle Datumskapsel; deren lokaler Farbwert ist oben dokumentiert.
- Ein physisches Handy war nicht verbunden (`adb devices` leer). Browser und Bundles beweisen keine native Bildrate, echten Safe Areas oder native Tastaturbedienung. Diese Punkte bleiben für die Handyabnahme offen.

Aktuelle Aufnahmen: [leer, 390](.playwright-mcp/workout-edge/verified-empty-390.png), [leer, 320](.playwright-mcp/workout-edge/verified-empty-320.png), [Eingabe](.playwright-mcp/workout-edge/verified-inputs-375.png), [Streak 10](.playwright-mcp/workout-edge/verified-streak10-390.png), [Stundenanzeige](.playwright-mcp/workout-edge/verified-hour-320.png), [lange Liste](.playwright-mcp/workout-edge/verified-long-list-320.png). Frühere `workout-phases-*`, `locked-in-*`, `first-*` und `final-*` sind historische Zwischenstände.
