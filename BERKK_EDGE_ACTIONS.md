# BERKK: wanderndes Randlicht und Aktionsbuttons – lokaler Testentwurf

Stand: 10. Oktober 2026. Dieser Durchgang ist nicht committet oder gemergt. Die Gestaltung wartet auf deinen Handytest. Die älteren Anleitungen beschreiben die vorherigen Entwürfe.

## 1. Dateien und Aufgaben

- `src/components/berkk/workout-ambient.tsx`: schwaches Grundlicht an vier Seiten und zwei wandernde Lichtflächen. Keine Bedienelemente.
- `src/hooks/use-workout-drift.ts`: Bewegung für Randlicht und Button-Akzente. Pausiert beim Verlassen eines Screens und im App-Hintergrund; schaltet dekorative Bewegung bei reduzierter Bewegung ab.
- `src/components/berkk/berkk-action-surface.tsx` (neu): gemeinsame sichtbare Fläche für beide Buttons – dunkler Untergrund, Symbol, Schrift, warmer Akzent. Die Komponente führt selbst keine Trainingsaktion aus.
- `src/components/berkk/workout-add-button.tsx`: verbindet diese Fläche mit der bestehenden Übungssuche und der kurzen Druckreaktion.
- `src/components/berkk/cta-button.tsx`: verbindet die Home-Variante mit dem bisherigen Start-/Fortsetzen-Aufruf und dessen Startanimation.
- `src/constants/workout-motion.ts`: gemeinsame Einstellungen. Der bestehende Block `WorkoutMotion` mit dem Ablauf der Startanimation bleibt unverändert; `WorkoutFocus` und `BerkkAction` steuern diesen Entwurf.
- `BERKK_EDGE_ACTIONS.md` (neu): diese Anleitung.

Eine **Komponente** ist eine Funktion, die einen Teil der Oberfläche beschreibt. Ein **Hook** ist eine Hilfsfunktion für React, die zum Beispiel Ereignisse und veränderliche Werte verwaltet. TypeScript prüft die JavaScript-Anweisungen zusätzlich; `.tsx` erlaubt auch die Oberflächen-Schreibweise `<View>…</View>`.

Timer, Datum, Satzfelder, Training beenden, Trainingsspeicher, Navigation und der Start-Provider wurden in diesem Durchgang nicht bearbeitet.

## 2. Wanderndes Randlicht

In `workout-ambient.tsx` berechnet `edgePoint(...)` eine Position entlang eines Rechtecks mit weichen Ecken. Die Bahn liegt überwiegend etwas außerhalb des sichtbaren Bildschirms:

```tsx
const p = edgePoint(phase.value, orbitWidth, orbitHeight);
return { transform: [
  { translateX: p.x - F.edge.outset - size / 2 },
  { translateY: p.y - F.edge.outset - size / 2 },
] };
```

`phase.value` beschreibt, wie weit der Umlauf fortgeschritten ist: 0 bedeutet Anfang, 0.5 die Hälfte, 1 einen vollständigen Umlauf. `translateX` verschiebt nur die Lichtfläche waagerecht, `translateY` senkrecht. Timer und Trainingsdaten stehen in einer anderen Ansicht und werden nicht verschoben.

Die zweite Fläche nutzt `phase.value - F.edge.violetLag`: Violett folgt mit Abstand. `EdgeGlow` zeichnet einen radialen Verlauf – innen mehr Farbe, außen transparent. Die Form wird nicht ständig neu gezeichnet; es bewegt sich ihr umgebender Bereich. Ein schwaches, unbewegtes Grundlicht bleibt an allen vier Seiten. Dadurch entsteht kein gleichmäßig heller Rahmen.

In `use-workout-drift.ts` läuft die eigene visuelle Uhr:

```ts
phase.value = (
  phase.value + Math.min(timeSincePreviousFrame ?? 0, 64) / circuitMs
) % 1;
```

Die Zeit seit dem vorherigen Bild wird durch die Umlaufdauer geteilt. `% 1` setzt den Wert nach einem Umlauf wieder an den Anfang, an derselben Position. Die Grenze 64 verhindert einen großen Sprung nach einer langen Unterbrechung. Das ist unabhängig von der gemessenen Trainingszeit. Der vorhandene Timer bleibt an den gespeicherten Trainingsbeginn gebunden.

```ts
frame.setActive(visible && !reduced);
```

Die Randbewegung läuft nur, wenn dieser Screen geöffnet, die App aktiv und reduzierte Bewegung ausgeschaltet ist. Bei reduzierter Bewegung werden feste Lichtpositionen verwendet. Die Einstellung wird über den bestehenden Start-Provider auch bei Systemänderungen aktualisiert.

Reanimated führt diesen kleinen Bildschritt auf iOS und Android in seinem Bereich für die Oberflächendarstellung aus. Das vermeidet React-Neuberechnungen der Satzfelder pro Bild. Die reale Flüssigkeit und Akkubelastung müssen trotzdem auf deinem Handy beurteilt werden. [Reanimated-Dokumentation](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/)

## 3. Beide Buttons

Die gemeinsame Oberfläche erhält eine Variante:

```tsx
<BerkkActionSurface
  variant="add"
  label="Übung hinzufügen"
  reduced={reduced}
/>
```

`variant="start"` verwendet stattdessen ein Startsymbol, die stärkere Lichtfläche und die vorhandene Schibsted-Schrift auf Home. Hinzufügen nutzt das warme Plus und die vorhandene Space-Grotesk-Schrift. Beide haben eine dunkle Fläche und einen schmalen, ruhigen Rand.

Nur der Lichtakzent bewegt sich innerhalb der linken Symbolregion:

```ts
transform: [
  { translateX: drift.value * A.driftX },
  { translateY: drift.value * A.driftY },
]
```

Symbol und Text befinden sich außerhalb dieses bewegten Bereichs. Bei reduzierter Bewegung ist `drift` gleich 0.

Die Druckreaktion in `workout-add-button.tsx` bleibt kurz:

```ts
opacity: 1 - pressure.value * 0.1,
transform: [{
  scale: reduced ? 1 : 1 - pressure.value * (1 - F.add.pressScale),
}],
```

Beim Drücken wird die Fläche etwas dunkler und minimal kleiner; beim Loslassen kehrt sie zurück. Bei reduzierter Bewegung entfällt das Verkleinern. `onPress={onPress}` erhält den bestehenden Aufruf der Übungssuche.

In `cta-button.tsx` bleiben `node.current`, `clock`, `overlayReady` und `onPress(node.current)` erhalten. Der bisherige Startablauf misst weiterhin den Button, startet oder setzt das Training fort und verwendet dieselbe kurze Startreaktion. Nur die sichtbare Fläche wurde ersetzt.

## 4. Selbst einstellen

Öffne `src/constants/workout-motion.ts`. Alle Zeitwerte sind Millisekunden: 1000 = eine Sekunde.

```ts
edge: {
  circuitMs: 48000,
  warmColor: Berkk.glowOrange,
  warmShade: Berkk.detailGradient[0],
  violetColor: Berkk.glowPurple,
  violetShade: Berkk.detailGradient[1],
  warmStrength: 0.58,
  violetStrength: 0.18,
  baseStrength: 0.14,
  // weitere Werte ...
}
```

- **Geschwindigkeit:** `circuitMs: 60000` macht den Umlauf langsamer; `36000` schneller.
- **Helligkeit:** `warmStrength` und `violetStrength` liegen zwischen 0 (unsichtbar) und 1 (volle Deckkraft). Kleine Schritte, etwa 0.58 auf 0.48, reichen. `baseStrength` betrifft das dauerhafte Grundlicht.
- **Farben:** `Berkk.glowOrange` übernimmt die vorhandene BERKK-Farbe. Für ein lokales Experiment kannst du die Zeile beispielsweise durch `warmColor: '#C94B22'` ersetzen. `warmShade` ist der dunklere Auslauf. Dafür musst du nicht die globale Farbpalette aller Screens ändern.
- **Abstand:** `outset` schiebt die Lichtmitte nach außen. Größer bedeutet weniger Licht im Screen. `violetLag` ist der Abstand des violetten Lichts als Anteil eines Umlaufs.

Für beide Buttons gibt es den Block `BerkkAction`:

```ts
halfCycleMs: 6500,
driftX: 14,
driftY: 5,
addStrength: 0.3,
startStrength: 0.52,
```

`halfCycleMs` ist die Zeit für eine Richtung. Hin und zurück dauert hier 13 Sekunden. Höhere Zahlen bewegen das Licht langsamer. `driftX` und `driftY` bestimmen den Weg in Bildschirm-Einheiten. `addStrength` und `startStrength` bestimmen die jeweilige Helligkeit. `warmColor`, `symbolColor`, `addSurface` und `startSurface` steuern die Farben.

Form, Schrift und Abstände stehen am Ende von `berkk-action-surface.tsx` unter `StyleSheet.create`. `borderRadius` rundet die Ecken ab; `minHeight` gibt die Mindesthöhe vor, lässt aber Platz für vergrößerte Schrift. `fontFamily` wählt die bestehende BERKK-Schrift.

Für die Druckreaktion: `WorkoutFocus.add.pressMs: 110` ist die Dauer; `pressScale: 0.985` bedeutet 98.5 Prozent der ursprünglichen Größe. Den älteren Block `WorkoutMotion` musst du für diese Anpassungen nicht ändern.

## 5. Alten Zustand wiederherstellen

Vor den Änderungen wurden die fünf vorhandenen Quelldateien separat gesichert. Auch die neuen Dateien werden beim Rücksetzen berücksichtigt. Das betrifft nur diesen Durchgang, nicht deine früheren Änderungen oder Trainingsdaten.

Im PowerShell-Terminal aus dem Projektordner `gymapp`:

```powershell
& './.playwright-mcp/edge-actions-backup/restore.ps1'
```

Das Skript prüft alle Dateien, bevor es etwas ersetzt. Es stellt die gesicherten Dateien wieder her und entfernt die zwei neuen Projektdateien dieses Durchgangs. Danach die App neu laden. Sicherung, Änderungspatch und Prüfbilder bleiben unter `.playwright-mcp` erhalten.

Falls du inzwischen selbst diese Dateien verändert hast, hält das Skript zunächst an. Dann kannst du deine neueren Anpassungen vor dem Rücksetzen separat aufbewahren:

```powershell
& './.playwright-mcp/edge-actions-backup/restore.ps1' -PreserveLaterEdits
```

Diese Variante kopiert zuerst alle aktuellen betroffenen Dateien in einen datierten Ordner innerhalb der Sicherung. Erst danach wird der alte Zustand wiederhergestellt. Kein `git reset` oder Löschen von App-Daten nötig.

## 6. Auf deinem Handy testen

Wenn BERKK bereits läuft: im Expo-Menü **Reload** wählen. Wenn der Entwicklungsserver aus ist, im Ordner `gymapp`:

```powershell
npm start
```

PC und Handy im selben WLAN, dann den angezeigten QR-Code mit deiner bisherigen Expo-Go-App oder dem vorhandenen Entwicklungsbuild öffnen. Falls WLAN-Verbindung nicht funktioniert, ist im Projekt bereits `npm run tunnel` vorhanden. Keine Neuinstallation oder Datenlöschung erforderlich.

1. **Home:** „Workout starten“ ansehen und antippen. Licht nur neben dem Startsymbol, Text ruhig; die bisherige Startanimation und Navigation sollen sich wie bisher verhalten. Wenn bereits ein Training läuft, „Zum Training“ verwenden. Den leeren Zustand dann beim nächsten regulären neuen Training prüfen.
2. **Leeres Training:** mindestens 50–60 Sekunden betrachten. Orange-Rot muss nacheinander alle vier Seiten erreichen, Violett schwächer folgen. Mitte und Timer bleiben dunkel bzw. gut lesbar. Auch Sekundenwechsel beobachten.
3. **Sätze:** Übung hinzufügen, Gewichte und Wiederholungen eingeben, Satz bestätigen und weitere Sätze/Übungen ergänzen. Währenddessen darf nur Hintergrundlicht wandern. Besonders mit geöffneter Tastatur, langem Scrollbereich und einem kleinen Display prüfen.
4. **Buttons und Bildschirmränder:** Plus/Startsymbol und Schrift müssen klar erkennbar sein; die kurze Druckreaktion darf nicht springen. Hinzufügen und Training beenden müssen bequem erreichbar bleiben; Aussparung und Home-Indikator dürfen nichts verdecken.
5. **Fortsetzen:** Übersicht öffnen, zurück ins Training gehen, Handy sperren/entsperren. Zeit und Eingaben müssen erhalten bleiben. Training beenden öffnen und Weitertrainieren prüfen. Einen Abschluss nur bei einem Training durchführen, das du tatsächlich abschließen willst.
6. **Reduzierte Bewegung:** iPhone unter Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren. Unter Android je nach Hersteller unter Bedienungshilfen → Animationen entfernen/reduzieren. Randlicht und Button-Akzente müssen stillstehen. Einstellung auch bei geöffneter App umschalten und danach zurückstellen.

## 7. Prüfung und Grenzen

Bestanden: TypeScript-Prüfung, Expo-Lint, alle 17 vorhandenen Trainingstests und Bundle-Export für iOS und Android. Browser-Prüfung mit separaten Testdaten: 390 × 844 und 320 × 568, ohne/mit Übungen, simulierte obere/untere iPhone-Sicherheitsabstände, Satzbestätigung, Entwurf nach Neuladen, Übersicht/Fortsetzen, Abschluss mit Speicherung und reduzierte Bewegung. Gemessen über sechs Sekunden: Hintergrund und Button-Licht verändern ihre Position; Position und Breite des Timers bleiben identisch.

Ein echter Gerätetest war hier nicht möglich: Android-Debugging meldet kein verbundenes Gerät. Browser-Prüfung und Bundle-Export belegen weder native Bildrate noch tatsächliches Verhalten der Bildschirmtastatur. Diese Punkte und die Wirkung der Lichtstärke beurteilst du im Handytest. Der Entwurf bleibt bis zu deinem Feedback offen.

Zusätzlich gemessen: ein vollständiger 48-Sekunden-Umlauf erreicht nacheinander links, oben, rechts und unten und kehrt ohne Positionssprung zurück. Die Reduzierung der Bewegung auf Home funktioniert auch beim Umschalten der Systemeinstellung ohne Neuladen. Die Druckreaktion des Hinzufügen-Buttons und das anschließende Öffnen der Übungssuche wurden ebenfalls geprüft; keine Browser-Laufzeitfehler.
