# BERKK-Kalender – repariertes Raster und native Prüfung

Das zuletzt angehängte Bild ersetzt alle älteren Kalenderbilder. Die neue Ansicht bleibt im vorhandenen Tab `/plan`; Workout-Details, Nachträge und Planungen verwenden weiterhin `/journal`, laufende Workouts `/workout`. Es wurde nichts committet oder gemergt.

## 1. Geänderte Dateien

Alle Angaben sind relativ zu `C:\Users\aslan\Desktop\Programming learning own projects\gymtry2\gymapp`.

- `src/app/(tabs)/plan.tsx`: kompakte Streak-Zeile, Montagsspalten, vertikale Monatsliste, Auswahl, Abstand unten und Anbindung an bestehende Routen.
- `src/data/calendar-layout.ts`: Wochen mit genau sieben Plätzen sowie berechnete Monatshöhen und Scrollpositionen, auch bei größerer Systemschrift.
- `src/components/berkk/calendar-month.tsx`: wiederverwendbare Monatsansicht mit festen Zellstilen, Statuspunkten und Auswahlring.
- `src/components/berkk/calendar-day-sheet.tsx`: Tagesfenster, Glas, statischer Lichtschein, kurze Animation und Schließgeste.
- `src/components/berkk/calendar-ambient.tsx`: zwei langsam bewegte Hintergrundlichter mit Pause bei Tab-Wechsel, Hintergrund und reduzierter Bewegung.
- `src/constants/calendar-appearance.ts`: alle Kalenderfarben und die wichtigsten Effekt-Regler an einer Stelle.
- `src/data/calendar.ts`: Tagesstatus und Zusammenfassung sowie sichtbarer Monatsbereich. Bestehende Streak-Regel dokumentiert; ihre Berechnung bleibt erhalten.
- `scripts/calendar.test.mjs`: 17 Tests für Datenstatus, Speicherung, Streak, Monatsbereich und das native Raster.
- `CALENDAR.md`: diese Anleitung und aktuelle Prüfergebnisse.
- `DESIGN.md`: Kalenderbeschreibung auf den neuesten Entwurf angepasst; andere Ansichten behalten ihre Gestaltung.

Die Store-Dateien, AsyncStorage-Struktur, Schriften, Tabs und Routen wurden nicht geändert.

## 1a. Warum das Raster jetzt sieben Spalten hat

Die bisherige Zellgröße stand in einer `Pressable`-Style-Funktion. NativeWind hat diese Funktion im installierten nativen Laufzeitpfad nicht ausgewertet; Breite und Höhe gingen dadurch verloren. Im Browser war das nicht sichtbar, auf Android entstanden bis zu 13 Spalten.

Jetzt besteht jede Woche ausdrücklich aus sieben gleich breiten Plätzen, einschließlich leerer Plätze am Monatsanfang und -ende. Die Zellstile sind feste `StyleSheet`-Werte. Bei normaler Systemschrift ist eine Zeile 52 Punkte hoch; größere Schrift erhöht Zeilen- und Kopfgröße. Monatshöhen und Scrollpositionen verwenden dieselbe Berechnung. Der seitliche Abstand passt sich auf kleinen Displays an, damit Tagesflächen mindestens 44 Punkte breit bleiben.

Die Monatsliste bleibt eine begrenzte `FlatList`: drei Monate beim Start, höchstens vier je Renderdurchgang, Fenstergröße fünf. Monatsansichten und Auswahlhandler sind stabil und zwischengespeichert. Tageszellen haben keine eigenen SVG-Lichter, Lichtsaum-Ebenen oder Animationen.

Das Tagesfenster reserviert seine aktuelle Höhe plus Tab-Abstand im normalen Layout. Dadurch endet der sichtbare Kalender oberhalb des Fensters und bleibt auch bei geöffneten Details scrollbar. Scrollen verändert die Auswahl nicht; die Datumszeile im Fenster zeigt „Heute“ oder „Auswahl“ mit Jahr. Ein frischer Kalenderbesuch führt zum heutigen Monat und Tag zurück; nach der Rückkehr aus Details bleibt der gewählte Tag erhalten.

## 2. Datenquellen

`src/store/workout.ts` bindet AsyncStorage an den bestehenden Zustand aus `src/store/workout-state.ts`. Der Speichername lautet `berkk-workouts` (Version 2). Der Kalender wartet auf erfolgreiches Laden und nutzt ausschließlich `history`, `plans` und `session` aus diesem Store.

- Orange Punkte: `completedDays(history)` in `src/data/calendar.ts`. Nur gespeicherte Workouts mit mindestens einem bestätigten Trainingssatz zählen. Zwei Workouts am selben Datum ergeben einen Trainingspunkt.
- Umrisse: tatsächliche `plans[].localDate`. Hat derselbe Tag auch ein abgeschlossenes Workout, bleibt der orange Punkt mit einem kleinen zusätzlichen Planungsmarker erhalten.
- Kleine dunkle Punkte: kein abgeschlossenes Workout und keine Planung. Eine laufende Session oder ein gespeicherter Abschluss ohne Sätze wird dadurch nicht als abgeschlossen dargestellt; das Sheet zeigt den echten Status.
- Datum: `localDate`, bei alten Workouts ohne dieses Feld der lokale Starttag (`workoutDay`). Keine Zuordnung durch Abschneiden eines UTC-Datums.
- Tagesfenster: `calendarDay(...)`. Die Zustände sind „Abgeschlossen“, „Training läuft“, „Geplant“, „Erfasst“ und „Kein Eintrag“. Es zeigt den gespeicherten Namen bzw. mehrere Workouts, tatsächliche Dauer und bestätigte Sätze. Alle Einträge bleiben einzeln erreichbar.
- Streak: `trainingStreak(history, today)` zählt aufeinanderfolgende lokale Tage mit bestätigten Sätzen. Heute ohne Abschluss beginnt die Prüfung bei gestern. Ein leerer vergangener Tag unterbricht die Serie. Planungen, laufende Sessions und Abschlüsse ohne Sätze zählen nicht. Mehrere Workouts am selben Tag zählen einmal.

**Konkrete Datenlücke:** Es gibt noch keine Programmdatenbank, keinen datierten Ruhe-/Trainingstag-Plan und keine gespeicherten früheren Programmversionen. Das optionale `programId` in `PlannedWorkout` liefert keine solche Zuordnung. Vergangene Ruhetage sind daher auch nach Programmänderungen nicht rekonstruierbar. Die App zeigt deshalb keinen erfundenen „Ruhetag“ und überbrückt keine Lücken als programmkonforme Streak. Die angezeigte Zahl ist ausschließlich die belegbare Tages-Streak.

„Schwach / Normal / Stark“ bleiben die vorhandenen Gefühle (`weak / normal / strong`). Es gibt kein neues Energiesystem und keine eingebauten Beispieldaten.

## 3. Wo werden Farbe, Lichtsaum und Glas gesteuert?

In `src/constants/calendar-appearance.ts`:

| Wert | Wirkung |
| --- | --- |
| `background` | Vier dunkle Hintergrundfarben von warmem Braun zu Violett. |
| `completed` | Orange der abgeschlossenen Trainingspunkte und des Streak-Akzents. |
| `empty`, `dayInk` | Dunkle leere Punkte und Farbe der kleinen Tageszahlen. |
| `cellHeight`, `monthHeaderHeight`, `monthBottomSpace` | Grundhöhe der Wochen, Monatsköpfe und Abstand zwischen Monaten. |
| `ambient.warmColor`, `ambient.violetColor` | Warmes und violettes Hintergrundlicht. |
| `ambient.warmOpacity`, `ambient.violetOpacity`, `ambient.size` | Stärke und Größe der beiden Hintergrundlichter; aktuell `0.10`, `0.09` und `480`. |
| `ambient.driftX`, `ambient.driftY`, `ambient.halfCycleMs` | Bewegungsweg und Dauer; aktuell `24`, `18` und `48000` ms je Richtung. |
| `sheet.blurIntensity` | Unschärfe des Hintergrunds im Sheet. |
| `sheet.wash`, `sheet.warmWash` | Dunkler transparenter Verlauf für normale bzw. abgeschlossene Tage. |
| `sheet.border`, `sheet.topEdge` | Feine Außenkante und hellere Oberkante. |
| `sheet.glowNeutral`, `sheet.glowWarm` | Violette bzw. orange Farbe des Lichts hinter dem Sheet. |
| `sheet.glowOpacity`, `sheet.glowSize` | Stärke und Ausdehnung des Hintergrundlichts. |

Die Umsetzung steht in `calendar-day-sheet.tsx`: `GlowBlob` zeichnet den statischen Lichtschein, `BlurView` verwischt den Hintergrund, `LinearGradient` legt die transparente dunkle Fläche darüber, `styles.glass` zeichnet die Kanten. Der `BlurTargetView` in `plan.tsx` enthält ausschließlich den Hintergrund; Zahlen und Tagespunkte werden nicht in die Glasfläche hineingeblurt.

`calendar-ambient.tsx` zeichnet zwei statische SVG-Lichter. Reanimated bewegt nur deren umgebende Flächen auf dem UI-Thread: 48 Sekunden in eine Richtung, 96 Sekunden für einen vollständigen Hin-und-zurück-Zyklus. Unschärfe und SVG-Inhalt werden dabei nicht animiert. Ohne Fokus oder im Hintergrund pausiert die Bewegung; beim Entfernen der Ansicht wird sie beendet. Änderungen an „Bewegung reduzieren“ werden sofort übernommen und halten das Hintergrundlicht still.

Das Sheet wechselt seine Höhe direkt und zeigt bei Auswahl, Öffnen oder Schließen einmalig eine 180-ms-Animation aus leichtem Versatz und Deckkraft. Sie läuft mit dem nativen Animationstreiber. Bei reduzierter Bewegung entfällt auch diese kurze Animation.

## 4. Effekt heller oder schwächer machen

Am besten immer nur einen Wert ändern, speichern und auf dem Handy neu laden.

- Sheet präsenter/heller: `sheet.glowOpacity` von `0.18` auf etwa `0.24` setzen. Für weniger Licht auf `0.10` senken.
- Oberkante heller: die letzte Zahl in `sheet.topEdge` von `0.40` auf `0.48` setzen. Ruhiger: etwa `0.26`.
- Mehr Hintergrundfarbe durchlassen: die letzten Zahlen der RGBA-Farben in `sheet.wash` bzw. `sheet.warmWash` vorsichtig senken, z. B. `0.68` auf `0.60`. Höhere Zahlen machen die Fläche deckender. Eine zu transparente Fläche kann Zahlen darunter sichtbar machen.
- Mehr/weicheres Glas: `sheet.blurIntensity` von `18` auf etwa `22` setzen. Weniger Unschärfe: etwa `12`. Unschärfe verändert nicht direkt die Helligkeit; den Wert anschließend auf einem nativen Gerät prüfen.
- Hintergrund ruhiger: `ambient.warmOpacity` von `0.10` auf `0.06` und `ambient.violetOpacity` von `0.09` auf `0.05` senken. Kleinere `driftX`/`driftY` reduzieren den Bewegungsweg. Die Trainingspunkte selbst haben keinen Lichtsaum.

## 5. Auf dem Handy testen

Im bestehenden Expo-Server neu laden und die App auf dem Handy öffnen. Falls kein Server läuft, in PowerShell:

```powershell
Set-Location -LiteralPath 'C:\Users\aslan\Desktop\Programming learning own projects\gymtry2\gymapp'
npm start
```

Den QR-Code wie bisher mit deiner Expo-App öffnen; Computer und Handy müssen für die LAN-Verbindung im selben WLAN sein. Den vom Server ausgegebenen Port verwenden. Bei Verbindungsproblemen ist der schon vorhandene `npm run tunnel`-Befehl verfügbar.

1. Kalender frisch öffnen: aktueller Monat sichtbar, heute ausgewählt. Streak-Zeile antippen: zurück zu heute.
2. Einen alten Trainingstag wählen, Sheet öffnen, Workout antippen: bisherige Details, Sätze, Notiz und „Schwach / Normal / Stark“ sichtbar. Zurück: ausgewählter Tag bleibt erhalten und Sheet ist eingeklappt.
3. Zwei Workouts am selben Tag: ein orangefarbener Tag, beide Workouts im Tagesfenster einzeln erreichbar.
4. Zukunftstag wählen und planen, speichern, App neu öffnen: Plan bleibt erhalten und der Punkt hat einen Umriss. Ein Plan alleine erhöht die Streak nicht.
5. Leeren Tag wählen: „Kein Eintrag“, niemals automatisch „Ruhetag“. Alte Abschlüsse ohne Sätze dürfen keinen orangefarbenen Punkt erzeugen.
6. Mit abgeschlossenen Trainings gestern/vorgestern, aber noch nicht heute: Streak bleibt bestehen. Ein leerer Tag vor heute unterbricht die Serie. Einen alten Nachtrag speichern und aktualisierte Streak prüfen.
7. Sheet antippen/hochziehen: öffnen. Die Vorschau erneut antippen, am Kopf herunterziehen oder „Schließen“ antippen: einklappen. Bei Android auch Zurück testen. Innerhalb der Details scrollen: unabhängig vom Kalender. Es gibt keinen bildschirmfüllenden Schließhintergrund; die Kalenderfläche bleibt bedienbar.
8. Bei eingeklapptem und geöffnetem Sheet durch Monate scrollen: letzte Tageszellen müssen vollständig oberhalb des Fensters erreichbar bleiben. Die Auswahl bleibt beim Scrollen bestehen. Tab-Bar und Sheet dürfen sich nie überlagern.
9. Auf 375 × 667 bzw. möglichst kleinem Display sowie mit größerer Systemschrift prüfen: genau sieben Spalten, Zahlen lesbar, Status verständlich, Aktionen im Sheet erreichbar. Auf Geräten mit Home-Indikator/Notch Safe Areas prüfen.
10. Die sehr langsame Hintergrundbewegung beobachten, dann Tab wechseln oder App in den Hintergrund schicken. „Bewegung reduzieren“ bei offener App ein- und ausschalten: das Licht muss sofort stillstehen bzw. wieder anlaufen. Auch einen Tageswechsel prüfen.

## Lokale Prüfung und Grenzen

- TypeScript und Expo-Lint erfolgreich.
- 17 Kalendertests plus 19 bestehende Workout-Tests erfolgreich: insgesamt 36. Die Kalendertests prüfen auch sieben Plätze je Woche, exakte Monatshöhen/Scrollpositionen bei mehreren Schriftgrößen, Mindestbreiten und den NativeWind-Fehlerpfad.
- iOS- und Android-Exporte mit Hermes erfolgreich.
- Browser bei 375 und 430 Punkten Breite geprüft: Spalten, Auswahl, bestehende Routen, Scrollen bei offenem Sheet und Einklappen.
- Android nativ in Expo Go auf dem Emulator bei 375 × 667 und 430 × 932 geprüft: sieben Spalten, Auswahl und Detailrouten, unabhängiges Scrollen bei geöffnetem Sheet, Schließgeste und Android-Zurück.
- Die langsame Hintergrundbewegung und das sofortige Ein-/Ausschalten über die native Einstellung „Bewegung reduzieren“ wurden auf Android geprüft. Das native Video dokumentiert die Bewegung. Ein nach der Wischgeste eintreffender zusätzlicher Klick wird kurz unterdrückt, damit das Sheet nicht sofort wieder aufgeht.
- Es war kein physisches iPhone angeschlossen. iPhone-Safe-Areas, Glaswirkung und Touch-Verhalten bleiben dort zu prüfen; eine gemessene iPhone-Bildrate liegt nicht vor. Der erfolgreiche iOS-Export ersetzt diesen Gerätetest nicht. Screenreader und AsyncStorage nach einem erzwungenen App-Neustart bleiben für den echten Handytest offen.

Aktuelle native Referenzen: [kleines Display](.playwright-mcp/calendar-native-375.png), [geöffnetes Sheet](.playwright-mcp/calendar-native-open-375.png), [großes Display](.playwright-mcp/calendar-native-430.png) und [Bewegungsvideo](.playwright-mcp/calendar-native-motion.mp4). Ältere `calendar-v2-*`-Aufnahmen dokumentieren den vorherigen Stand. Weitere Details zur Reparatur stehen in [CALENDAR_NATIVE_FIX.md](CALENDAR_NATIVE_FIX.md).
