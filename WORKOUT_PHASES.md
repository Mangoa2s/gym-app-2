# BERKK – drei Zustände im aktiven Workout

Lokale Version zur Handybeurteilung. Dieser Durchgang ändert nur das aktive Training und seine Dokumentation; Kalender, Onboarding, Home-Buttons und Routen wurden nicht überarbeitet. Kein Commit oder Merge.

## 1. Dateien und Aufgaben

Projektordner: `C:\Users\aslan\Desktop\Programming learning own projects\gymtry2\gymapp`.

| Datei relativ zum Projektordner | Aufgabe |
| --- | --- |
| `src/components/berkk/workout-timer-overlay.tsx` | Datum, Übersicht-Aktion, großer/kompakter Timer und kurze Ankunft im Trainingsmodus. |
| `src/components/berkk/workout-recorder.tsx` | Tatsächliche Übungen und Satzfortschritt; kompakte Satzzeilen; Öffnen der bestehenden Eingabe; Auslösen der Speicherbestätigung; erreichbare Aktionen. |
| `src/components/berkk/workout-ambient.tsx` | Langsam umlaufendes Randlicht und kurze Bewegung an den Rand beim Start. Die eigene Lichtfläche wird begrenzt, damit sie den Screen nicht scrollbar macht. |
| `src/components/berkk/workout-add-button.tsx` | Statischer warmer Verlauf mit kleiner Druckreaktion. Keine dauerhaft wandernde CTA-Lichtfläche. |
| `src/components/berkk/workout-set-feedback.tsx` (neu) | Einmalige Zeilenbewegung und Lichtimpuls nach erfolgreicher Satzspeicherung. |
| `src/constants/workout-motion.ts` | Regler für Start, Randlicht, Druckreaktion und Satzbestätigung unter `WorkoutFocus`. |
| `src/data/workout-feedback.ts` (neu) | Prüft, ob exakt dieser bestätigte Satz in derselben Session erfolgreich lokal gespeichert wurde und inzwischen nicht verändert wurde. |
| `scripts/workout-recording.test.mjs` | Zusätzliche Tests für erfolgreiche Speicherung, Speicherfehler und Korrektur während eines langsamen Schreibvorgangs. |
| `WORKOUT_PHASES.md` (neu) | Diese Anfänger- und Testanleitung. |
| `WORKOUT_RUNNING_DESIGN.md` | Aktuelle Gestaltung und Prüfgrenzen des aktiven Trainings. |
| `DESIGN.md` | Nur den Abschnitt zum laufenden Training aktualisiert. |

Store, AsyncStorage-Schema, Workout-Route, Timer-Hook und Katalog bleiben erhalten. `SetRow` bleibt die gemeinsame bestehende Eingabe; das neue optionale `onConfirmed` wird nur vom aktiven Recorder verwendet. Die bisherigen Tagebuch-Aufrufer funktionieren weiter.

## 2. Wie die Zustände wechseln

Es wird keine zweite Workout-Datenbank und kein künstlicher Trainingsfortschritt eingeführt.

**A – Start:** `session.exercises.length === 0`. Der vorhandene Store hat das Training bereits mit einer echten `startedAt`-Zeit angelegt. Der Screen zeigt den großen Timer und die Aufforderung zur ersten Übung. Die kurze Starttransformation verwendet den vorhandenen gemeinsamen Intro-Takt. Eine wiederhergestellte Session spielt sie nicht neu ab.

**A → B:** Eine tatsächliche Übung wird aus der bestehenden Suche gewählt und mit der bisherigen `addExercise`-Funktion in die Session übernommen. Sobald Übungen vorhanden sind, erscheint der kompakte Timer oberhalb der Liste. Leere Sätze enthalten keine erfundenen Gewichte oder Wiederholungen.

**B – Erfassen:** Die erste unbestätigte Zeile bestimmt den aktuellen Satz. Die Anzahl bestätigter Zeilen und die kleinen Fortschrittssegmente kommen unmittelbar aus `item.sets`. Der Nenner zählt nur tatsächlich angelegte Zeilen; es gibt kein angenommenes Ziel von z. B. drei Sätzen. Antippen einer Satzzeile öffnet die vorhandene `SetRow`-Eingabe. „Nächster Satz“ legt über den Store eine neue leere Zeile an und öffnet sie. Der Übungsname klappt die vorhandene Übung auf/zu; beim Aufklappen wird ihre erste offene Eingabe ausgewählt.

**B → C:** Der Haken verwendet unverändert `confirmSet`: gleiche Pflichtfelder, Dezimalkomma, Validierung und Rücknahme. Nach einer gültigen neuen Bestätigung wartet `waitForSavedSet` auf `flush()`. Nur bei erfolgreicher Speicherung sowie unveränderter Session und Satzzeile startet die kurze Bestätigung. Ein Speicherfehler, ein inzwischen korrigierter Satz oder eine beendete Session erzeugen keine falsche „Gespeichert“-Meldung.

**C – Gespeichert:** Die bestätigte Zeile wird kompakt. „Gespeichert“ erscheint für etwa 1,1 Sekunden; die Zeile setzt sich um 5 Punkte, und einmal läuft ein warmer Lichtimpuls darüber. Die echte bestätigte Anzahl ist bereits aktualisiert. Danach steht an derselben Zeile ruhig „Bestätigt“, und B läuft weiter. Das Feedback ist nur lokaler UI-Zustand und wird nicht gespeichert. Es läuft beim Neuladen nicht erneut.

**Korrektur/Abschluss:** Gespeicherte Zeilen lassen sich weiterhin antippen und bearbeiten. Eine Wertänderung hebt wie bisher die Bestätigung auf. Bestätigung zurücknehmen, Löschschutz, weitere Übungen, Abschlussdialog, Notiz und Schwach/Normal/Stark bleiben erhalten. Bei Speicherfehlern bleibt die Session bestehen. Die Gestaltung setzt die Trainingszeit niemals zurück.

**PR:** Es existiert keine verlässliche PR-Erkennung in den aktuellen Workout-Daten. Dieser Durchgang erfindet daher keine Rekorde und enthält keine Adrenalin-Animation für normale Sätze. Eine spätere stärkere PR-Rückmeldung benötigt zuerst eine echte, definierte Rekordberechnung.

## 3. Wo sind die Animationen?

Die wichtigsten Werte stehen in `src/constants/workout-motion.ts`, unter `WorkoutFocus`:

- `intro.settleAt: 620`: Abschluss der sichtbaren Starttransformation nach etwa 620 ms des gemeinsamen Intro-Takts.
- `intro.lightInset: 52`: Wie weit das warme Licht beim Start zunächst nach innen versetzt ist, bevor es an den Rand zieht.
- `intro.contentOffset: 8`: Kleine Verschiebung der ankommenden Oberfläche.
- `edge.circuitMs: 48000`: Ein sehr langsamer Umlauf am Rand dauert 48 Sekunden.
- `edge.warmStrength: 0.36`, `violetStrength: 0.14`: Stärke der bewegten Randlichter. Die Mitte bleibt dunkel.
- `add.pressMs: 110`, `pressScale: 0.985`: Direkte Druckreaktion der Hinzufügen-Aktion, etwa 110 ms und 98,5 % Größe.
- `add.colors`: Drei feste Farben des Trainings-CTA. Es gibt keine laufende CTA-Animation.
- `savedSet.settleMs: 180`, `offset: 5`: Kurzes Setzen der gespeicherten Zeile.
- `savedSet.sweepMs: 640`: Einmaliger Lichtdurchlauf, etwa 640 ms.
- `savedSet.visibleMs: 1100`: Sichtbarkeit des Wortes „Gespeichert“.
- `savedSet.light`: Transparenter warmer Verlauf des Impulses; die letzte RGBA-Zahl bestimmt die Deckkraft.

`workout-timer-overlay.tsx` liest den vorhandenen Starttakt. `workout-ambient.tsx` setzt Randpositionen um; der bestehende Hook `src/hooks/use-workout-drift.ts` pausiert bei fehlendem Fokus und inaktiver App. `workout-set-feedback.tsx` animiert nur Transform und Deckkraft; der Verlauf selbst bleibt statisch. Die Animationen verändern keine Trainingsdaten.

Reduced Motion macht Randlicht und Zeilenimpuls statisch, entfernt die räumliche Druck-/Startbewegung und behält die verständliche Textbestätigung. Bereits begonnene Animationen werden beendet bzw. abgebrochen; lokale Timer werden beim Entfernen der Oberfläche aufgeräumt.

## 4. Auf dem Handy testen

Bestehenden Expo-Server neu laden und die App wie bisher auf dem Handy öffnen. Falls kein Server läuft:

```powershell
Set-Location -LiteralPath 'C:\Users\aslan\Desktop\Programming learning own projects\gymtry2\gymapp'
npm start
```

1. **A:** Neues Workout starten und noch keine Übung wählen. Datum/Übersicht, kurzer Übergang, kompletter Timer, Erste-Übung-Hinweis und beide unteren Aktionen prüfen. Besonders auf einem kleinen iPhone und mit größerer Systemschrift.
2. **B:** „Übung hinzufügen“, eine tatsächliche Übung wählen. Der Timer wird kompakt. Satzzeile antippen, eigene Werte eingeben. Pflichtfelder und Dezimalkomma testen; ein leerer oder unvollständiger Satz darf nicht als gespeichert bestätigt werden.
3. **C:** Einen gültigen Satz mit dem Haken bestätigen. Es soll genau eine kleine Zeilenbewegung und einen warmen Lichtdurchlauf geben, „Gespeichert“ kurz erscheinen und danach „Bestätigt“. Keine große Feier und kein dauerndes Leuchten in der Mitte.
4. „Nächster Satz“ wählen, danach eine weitere Übung hinzufügen. Durch die Liste scrollen; Timer und Hinzufügen-Aktion sollen erreichbar bleiben. Die native Tastatur soll die aktuellen Werte nicht verdecken. Während ihrer Anzeige wird die sekundäre Beenden-Aktion vorübergehend ausgeblendet; die Hinzufügen-Aktion bleibt erreichbar.
5. Bestätigte Zeile öffnen, Wert korrigieren und neu bestätigen. Bestätigung einmal zurücknehmen. Eine ausgefüllte Zeile entfernen und den vorhandenen Löschschutz prüfen.
6. Mit unfertiger Eingabe wie „65,“ zur Übersicht wechseln, fortsetzen und App neu öffnen. Startzeit, bestätigte Sätze und Entwurf sollen erhalten bleiben. Kein erneuter Start- oder Speicherimpuls beim Wiederöffnen.
7. „Training beenden“ öffnen und „Weitertrainieren“ wählen. Danach erneut beenden, Stimmung/Notiz erfassen und speichern; es soll genau ein historisches Workout entstehen.
8. „Bewegung reduzieren“ einschalten. Rand und CTA sollen ruhig sein, aber erfolgreiche Satzspeicherung bleibt als Text erkennbar. Auch Hintergrund/Displaysperre und Zurückkehr testen.

## Lokale Prüfung

- TypeScript und Expo-Lint erfolgreich.
- 19 Workout-Tests sowie 13 Kalendertests erfolgreich. Zwei neue Tests prüfen echte Speicherung, Speicherfehler und eine Änderung während eines langsamen Schreibvorgangs.
- Hermes-Bundles für iOS und Android erfolgreich unter `.expo/workout-phases-native` erzeugt.
- Browser bei 320 × 568, 375 × 667, 390 × 844 und 1280 × 900 geprüft. Ein Timer über einer Stunde passt auch bei 320 Breite: tatsächliche Testanzeige `1:00:05`, Breite etwa 272 bei 24 seitlichem Abstand.
- Isolierte Browserkontexte: echter Start- und Suchablauf, Werteingabe, einmaliges C/B-Feedback, ungültige Eingabe ohne C, Rücknahme/erneute Bestätigung, Wiederherstellung einschließlich unfertigem `65,`, gleiche Startzeit, Übersicht/Fortsetzen, Abschlussabbruch und genau ein gespeichertes Workout. Keine Seitenfehler; keine eingebauten Demonstrationswerte im App-Code.
- Reduced Motion: Randposition über mehrere Messungen unverändert, CTA ohne laufende Transformation.
- Finale Eingabe-/Speicheransicht: Root nicht scrollbar (`scrollHeight = clientHeight = 667`, `scrollTop = 0`); Datum, Timer, Eingabe und Footer bleiben enthalten.
- Unabhängige visuelle Abschlussprüfung: PASS in allen fünf Bereichen, keine offenen wesentlichen Befunde. Das zuvor abgeschnittene Eingabe-Screenshot wurde nach der Korrektur der Licht-Ebene ersetzt.
- Native Tastatur, tatsächliche Safe Areas, Touch-Verhalten und Bildrate brauchen noch deinen Handytest. Ein Browserlauf oder Bundle-Export ersetzt ihn nicht.

Screenshots: `.playwright-mcp/workout-phases-A-320.png`, `workout-phases-A-375.png`, `workout-phases-B-375.png`, `workout-phases-input-375.png`, `workout-phases-C-375.png`, `workout-phases-B-390.png`, `workout-phases-B-desktop.png`.

Vor weiteren Designänderungen wird diese Version auf dem Handy beurteilt.
