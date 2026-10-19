# BERKK: Arbeitsstand zur Handyprüfung

Dieser Durchgang verändert die Gestaltung eines laufenden Trainings. Er ist uncommittet und wartet auf dein Feedback. Timer-Hook, Trainings-Store, gespeicherte Daten, Bestätigung und Abschluss bleiben unverändert.

## Auf dem Handy testen

Wenn BERKK bereits offen ist: im Expo-Menü „Reload“ wählen. Ein vollständiges Neuladen hilft, alte Layouts nach dem Hinzufügen neuer Dateien zu vermeiden. Falls der Entwicklungsserver nicht mehr läuft, im Projektordner `gymapp` ausführen:

```powershell
npm start
```

PC und Handy im selben WLAN lassen. Den angezeigten QR-Code wie bisher mit Expo Go oder deinem bestehenden Entwicklungsbuild öffnen. Auf iOS kann die Kamera den QR-Code öffnen; auf Android funktioniert der Scanner in Expo Go. Keine App-Daten löschen oder die App neu installieren, um dieses Layout zu testen.

1. Ohne aktive Sitzung: „Workout starten“. Falls schon ein Training läuft, „Zum Training“ verwenden; deine vorhandene Sitzung bleibt erhalten. Den leeren Zustand bei deinem nächsten regulären Trainingsstart beurteilen.
2. Den leeren Screen etwa eine Minute betrachten: Licht an allen vier Rändern, schwarze Mitte, ruhige Bewegung, stabiles Datum und Timer. Die Bewegung soll leise bleiben.
3. „Übung hinzufügen“ drücken: kurze Reaktion, keine Sprungbewegung. Gewicht und Wiederholungen eingeben und bestätigen. Weitere Sätze und Übungen ergänzen; auch die letzte Übung muss erreichbar bleiben.
4. Tastatur öffnen, zwischen Satzfeldern wechseln und scrollen. Nichts darf unter Tastatur, Aussparung oder Home-Indikator verschwinden.
5. Über „Übersicht“ verlassen und „Zum Training“ öffnen. Zeit und Eingaben müssen erhalten bleiben. Handy kurz sperren und wieder öffnen: die Dauer läuft weiter.
6. „Training beenden“ öffnen, zuerst „Weitertrainieren“ prüfen. Einen echten Abschluss nur durchführen, wenn du dieses Training tatsächlich abschließen möchtest. Die vorhandene Bestätigung erklärt, welche Einträge gespeichert bzw. verworfen werden.
7. iOS: Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren. Android: in den Bedienungshilfen die Einstellung zum Entfernen/Reduzieren von Animationen verwenden; die Bezeichnung hängt vom Gerät ab. Danach BERKK neu laden: beide Lichtbewegungen stehen still.

## Welche Dateien wofür da sind

| Datei | Aufgabe in diesem Durchgang |
| --- | --- |
| `src/components/berkk/workout-timer-overlay.tsx` | Kopf mit lokalem Datum, kompakte Übersicht-Navigation, unveränderter Timer, Gesamtanordnung. |
| `src/components/berkk/workout-ambient.tsx` | Farbe und Form des Lichts an vier Rändern. |
| `src/components/berkk/workout-add-button.tsx` | Neuer eigener Hinzufügen-Button: warmes Licht unter dem Text und Druckreaktion. |
| `src/hooks/use-workout-drift.ts` | Neuer Helfer für langsame Bewegung sowie Pausen bei Hintergrund, Verlassen und reduzierter Bewegung. |
| `src/components/berkk/workout-recorder.tsx` | Bestehende Übungs- und Satzeingabe; bindet den Button ein und gibt der Abschlussaktion Abstand. |
| `src/constants/workout-motion.ts` | Neue Einstellgruppe `WorkoutFocus`; vorhandene Startanimation bleibt getrennt. |
| `WORKOUT_RUNNING_DESIGN.md` | Aktuelle Oberfläche, Prüfergebnisse und Grenzen. |
| `DESIGN.md` | Kurzer Hinweis auf diesen Entwurf innerhalb der vorhandenen BERKK-Gestaltung. |
| `WORKOUT_REFINEMENT.md` | Diese Anleitung. |

„Komponente“ bedeutet hier: eine Funktion, die einen Teil des Screens beschreibt. Ein „Hook“ ist eine Hilfsfunktion, die React-Zustand oder Ereignisse verwenden darf. Die Dateien enden auf `.ts` oder `.tsx`, weil TypeScript zusätzliche Prüfungen über JavaScript legt; `.tsx` erlaubt auch die Schreibweise `<Text>…</Text>` für Oberfläche.

## Randlicht: Formen und Farben

In `workout-ambient.tsx` werden weiche ovale Flächen gezeichnet. SVG ist dabei eine Beschreibung von Formen; es wird kein Foto geladen.

```tsx
<Ellipse cx="130" cy="-86" rx="330" ry="270"
  fill={`url(#warm-${id})`} />
<Ellipse cx="286" cy="984" rx="340" ry="270"
  fill={`url(#warm-${id})`} />
```

Diese beiden Flächen ergänzen oben und unten das seitliche Licht. `cx` und `cy` legen den Mittelpunkt fest; `rx` und `ry` bestimmen, wie weit das Oval horizontal und vertikal reicht. Die Zentren liegen teilweise außerhalb der Zeichenfläche: innen bleibt es dunkel. Die Koordinaten beziehen sich auf die Zeichenfläche `400 × 900`, die sich dem Bildschirm anpasst.

```tsx
<Stop offset="0" stopColor={Berkk.glowOrange}
  stopOpacity={F.edge.warmStrength} />
```

`stopColor` wählt eine vorhandene BERKK-Farbe. `stopOpacity` bestimmt ihre Sichtbarkeit: `0` ist unsichtbar, `1` vollständig sichtbar. Weitere `Stop`-Zeilen lassen die Farbe nach außen auslaufen. `F` ist nur die kurze Import-Bezeichnung für `WorkoutFocus`.

Für eine andere Farbe nur den `stopColor` dieser lokalen Lichtfläche ändern. Ein globaler Farbwert in `theme.ts` beeinflusst auch andere BERKK-Screens. `Berkk.detailGradient[0]` ist die erste Farbe der vorhandenen dunklen warmen Farbgruppe; `Berkk.glowPurple` ist das Violett.

## Bewegung und ihre Geschwindigkeit

In `workout-motion.ts` stehen die veränderbaren Werte:

```ts
edge: {
  halfCycleMs: 24000,
  driftX: 5,
  driftY: 10,
  warmStrength: 0.46,
  violetStrength: 0.17,
},
```

`halfCycleMs` ist die Zeit für einen Weg. `24000` bedeutet 24 Sekunden; hin und zurück dauern 48 Sekunden. Größere Werte machen die Bewegung langsamer. `driftX` und `driftY` bestimmen die kleine maximale Verschiebung in React-Native-Layoutpunkten; diese sind auf dem Handy nicht unbedingt einzelne physische Pixel. Die beiden Stärkewerte machen warmes Licht und Violett sichtbarer oder schwächer. Für `warmStrength` hier ungefähr im Bereich `0.2–0.6` bleiben, weil ein weiterer dunkler Farbstopp mit `1.35` multipliziert wird.

```ts
transform: [
  { translateX: drift.value * F.edge.driftX },
  { translateY: drift.value * F.edge.driftY },
],
```

`transform` verschiebt die fertige Lichtfläche. `drift.value` läuft langsam zwischen `-1` und `1`. Bei `driftY: 10` liegt die Fläche also höchstens 10 Punkte oberhalb oder unterhalb ihrer Ausgangsposition. Text und Eingaben liegen darüber in einer eigenen, festen Ebene.

Der Helfer `use-workout-drift.ts` startet die Wiederholung:

```ts
if (reduced) drift.set(0);
else if (focused && active) {
  // withTiming bewegt den Wert langsam zum Ziel.
  // withRepeat wiederholt den Weg vorwärts und rückwärts.
}
```

`reduced` sagt, ob weniger Bewegung gewünscht ist. `focused` sagt, ob dieser Trainingsscreen ausgewählt ist; `active` sagt, ob die App im Vordergrund ist. `cancelAnimation` stoppt den laufenden Weg. Diese Zahlen werden von der Animationsbibliothek geführt, ohne für jedes Bild den ganzen Screen neu aufzubauen. Animiert wird die Verschiebung, nicht die Größe des Layouts oder die Berechnung der Lichtformen.

## Header und Timer

```ts
const today = useLocalDay();
const dateLabel = formatDay(today, {
  day: 'numeric', month: 'short', year: 'numeric',
});
```

`useLocalDay` ist ein vorhandener Helfer: Er liest das Datum des Geräts und aktualisiert es alle 30 Sekunden sowie beim Wechsel des App-Zustands. `formatDay` schreibt es deutsch mit kurzem Monat. Es gibt keine fest eingetragene Datumszeile und keine Umrechnung auf UTC, also Weltzeit.

```ts
backContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
},
```

`row` setzt Pfeil und „Übersicht“ nebeneinander. `gap: 6` ist ihr Abstand. Die äußere antippbare Fläche ist mindestens 44 hoch. Die bisherigen Befehle `router.back()` bzw. `router.replace('/')` bleiben erhalten und beenden das Training nicht.

```ts
const label = formatElapsed(useWorkoutTimer(session.startedAt));
const fontSize = Math.min(compact ? 30 : 80,
  availableWidth / (units * scale));
```

Der vorhandene Timer berechnet die Dauer aus der gespeicherten Startzeit. Die neue Lichtbewegung zählt keine Trainingssekunden. Die zweite Zeile begrenzt nur die Schriftgröße: leer maximal 80, mit Übungen maximal 30; längere Zeitangaben werden passend verkleinert.

```ts
width: fontSize * scale * (character === ':' ? 0.3 : 0.66)
```

Jede Ziffer bekommt gleich viel Platz. Nur der Doppelpunkt bekommt eine schmalere Zelle. Das verhindert Springen beim Sekundenwechsel; die vorhandene Schrift nutzt zusätzlich `tabular-nums`, also gleich breite Zahlen. `scale` berücksichtigt die System-Schriftvergrößerung bis Faktor 1.2.

## Hinzufügen und Beenden

```ts
add: {
  halfCycleMs: 18000,
  driftX: 22,
  lightOpacity: 0.14,
  pressMs: 110,
  pressScale: 0.985,
},
```

Die Buttonfläche wandert 18 Sekunden in eine Richtung und 18 Sekunden zurück. `lightOpacity` steuert die zusätzliche warme Lichtfläche, `driftX` deren Weg. Plus und Text sind darüber und wandern nicht mit. Für eine ruhigere Bewegung `halfCycleMs` erhöhen oder `driftX` verkleinern.

`pressMs` ist die Zeit der Druckreaktion. `pressScale: 0.985` bedeutet 98,5 % der normalen Größe. Es gibt keinen Rücksprung mit Feder oder Bounce. Bei reduzierter Bewegung bleibt die Größe bei `1`; die kurze Änderung der Deckkraft ist weiter möglich.

```ts
finishEntry: { marginTop: F.footer.actionGap, borderRadius: 12 }
// Die gemeinsame end-Fläche hat minHeight: 48.
paddingBottom: Math.max(insets.bottom, 12) + F.footer.bottomAir
```

`actionGap` ist der Abstand zwischen den Aktionen. `insets.bottom` ist der freie Bereich für den Home-Indikator oder die Systemnavigation. `Math.max` nimmt den größeren Wert: Geräteabstand oder 12. Danach kommen weitere 12 Punkte Luft hinzu. Der Footer liegt außerhalb der scrollbaren Übungsliste. Die bisherigen Schritte zur Bestätigung und zum Speichern wurden beibehalten.

## Was geprüft wurde

TypeScript-Prüfung, Lint und alle 17 Workout-Tests bestanden. Auch die aktuellen Exporte für iOS und Android mit Hermes-Bytecode sind erfolgreich (`.playwright-mcp/locked-in-refinement/native-export`). Browser-QA in getrennten Sitzungen mit synthetischen Daten: 320 × 568, 390 × 844, 1280 × 900; leere und gefüllte Screens; simulierte Safe Areas von 59 oben und 34 unten, kleine Anzeige mit 20 oben sowie asymmetrische 59 links im Querformat. Die Hilfsroute dafür wurde anschließend entfernt.

Erfasst und bestätigt, weitere Sätze/Übungen hinzugefügt, letzte Übung erreicht, Entwurf `65,` wiederhergestellt, Startzeit nach Reload und Fortsetzen erhalten. Timerbreite beim Sekundenwechsel stabil; Stundenformat passt. Abstand zwischen den Aktionen 12, Abschlussfläche 48 hoch. Beide Lichtflächen bewegen sich und stehen bei reduzierter Bewegung still. Druckreaktion reagiert kurz. Abschlussbestätigung und Speichern ausschließlich bestätigter Sätze funktionieren. Keine Browser-Seitenfehler; mechanischer Design-Detektor ohne Befunde.

Auf dem Handy noch beurteilen: Lesbarkeit unter echtem Licht, Qualität und Stärke der Animation, iOS-/Android-Flüssigkeit, tatsächliche Safe Areas, Touch-Gefühl und native Bildschirmtastatur. Ein erfolgreicher nativer Export ist nur eine Prüfung, dass die App übersetzt werden kann, kein Test auf echter Hardware.

Aktuelle Aufnahmen: [Leer](.playwright-mcp/locked-in-refinement/empty-safe-390.png), [Übungen](.playwright-mcp/locked-in-refinement/exercises-safe-390.png), [Kleine Anzeige](.playwright-mcp/locked-in-refinement/exercises-safe-320.png).

## Diesen Durchgang zurücknehmen

Die gezielte Sicherung unter `.playwright-mcp/locked-in-refinement-backup` enthält die Dateien unmittelbar vor diesem Durchgang. `changes.patch` zeigt nur dessen Unterschiede. Der Rückweg setzt keine Trainingsdaten zurück und fasst keine anderen Projektänderungen an.

Im Ordner `gymapp` ausführen:

```powershell
& './.playwright-mcp/locked-in-refinement-backup/restore.ps1'
```

Das Skript prüft vorab alle betroffenen Dateien und bricht ab, wenn seit dem Arbeitsstand weitere Änderungen daran erfolgt sind. Danach stellt es die gesicherten Dateien wieder her und entfernt nur die in diesem Durchgang neu angelegten Quelldateien und diese Anleitung. Die Sicherung und Aufnahmen bleiben liegen. Der Rückweg wurde ohne Zurücksetzen des echten Projekts in einem getrennten Testordner geprüft.
