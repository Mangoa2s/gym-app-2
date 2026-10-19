# BERKK: lokale Testversion der Tagebuch-Bewegung

Noch nicht als endgültiges Design akzeptiert. Keine Commits, kein Merge. Die Aufnahme wurde bei normaler Geschwindigkeit angesehen. Übertragen wurden Fingerführung, weiches Einrasten, fließende Größenänderung und die separate Bestätigung. BERKK behält seine eigenen drei SVG-Geister und seine Farben. Die zusätzlichen Stimmungen der Referenz wurden nicht eingeführt.

## Geänderte Dateien

| Datei | Aufgabe |
| --- | --- |
| `src/components/berkk/feeling-picker.tsx` | Bestehende Geister, Wischgeste, laufende Größen-/Transparenzänderung, Vorschau und Bestätigung. Ersetzt die drei sofort auswählenden Felder. |
| `src/components/berkk/feeling-carousel-state.ts` | Neu: kleine Rechenfunktionen für die nächste mittlere Stimmung und den Widerstand an beiden Enden. |
| `src/constants/diary-motion.ts` | Neu: alle einstellbaren Bewegungswerte an einem Ort. |
| `src/components/berkk/diary-action.tsx` | Neu: gemeinsame kurze Druckreaktion für Auswählen, Entfernen, Eingabefelder und Speicheraktionen. |
| `src/components/berkk/diary-field.tsx` | Neu: Workout-Name und Notiz weich öffnen/schließen; warmer Rand zeigt den Eingabefokus. |
| `src/components/berkk/workout-recorder.tsx` | Verbindet die neuen Elemente mit dem laufenden Training. Scrollt beim Öffnen zum Tagebuch; räumt beim Tippen Platz für die Tastatur ein. „Training speichern“ ruft weiterhin dieselbe `end()`-Funktion auf. |
| `src/components/berkk/workout-journal.tsx` | Nutzt dieselben Elemente beim Bearbeiten gespeicherter Einträge. Datum, Dauer, Sätze, Planung und Schutz ungespeicherter Änderungen bleiben erhalten. |
| `src/components/berkk/workout-save-feedback.tsx` | Neu: kurze Meldung erst nach einem erfolgreichen Schreibvorgang. Bleibt beim anschließenden Screenwechsel sichtbar. |
| `src/app/_layout.tsx` | Bindet diese Meldung oberhalb der einzelnen Screens ein. Kein neuer Navigationsablauf. |
| `scripts/diary-motion.test.mjs` | Neu: prüft Reihenfolge, Widerstand und Richtung der Einrastberechnung. |
| `DIARY_MOTION.md` | Diese Anleitung. |

`src/store/workout-state.ts`, Timer und Datenformat wurden nicht geändert. Es gibt keine neuen App-Abhängigkeiten oder Bilddateien. Prüfskripte, Vorher-Sicherung, Screenshots und Browseraufnahme liegen unter `.playwright-mcp/diary-motion*`.

## Wischen und Einrasten

In `feeling-picker.tsx` steuert ein „Shared Value“ namens `position` die Bewegung. Das ist eine Zahl, die Reanimated für jedes Bild der Animation aktualisieren kann, ohne dafür die gesamte React-Oberfläche neu aufzubauen. `0` ist Schwach, `1` Normal, `2` Stark; `0.5` liegt zwischen zwei Geistern.

```tsx
.onUpdate((event) => {
  position.set(resistedPosition(origin.get() - event.translationX / step));
})
```

`translationX` ist die horizontale Strecke des Fingers. `step` ist der Abstand zwischen zwei Geistern in Pixeln. So folgt die Vorschau unmittelbar der Bewegung. Ganz rechts und links begrenzt `resistedPosition` das Ziehen mit leichtem Widerstand; es erscheinen keine zusätzlichen Stimmungen.

Beim Loslassen berechnet `snapIndex` das Ziel und `withSpring` zieht die Position mit einer kurzen Federbewegung dorthin:

```tsx
position.set(reduced ? target : withSpring(target, {
  ...M.snap,
  velocity: -event.velocityX / step,
  reduceMotion: ReduceMotion.System,
}));
```

`M` ist hier der kurze Name für `DiaryMotion`. `...M.snap` übernimmt die drei Federwerte aus der Einstellungsdatei. Die Finger-Geschwindigkeit fließt in den Übergang ein. Eine neue Geste unterbricht eine noch laufende Federbewegung. Horizontales Ziehen startet nach 8 Pixeln; deutlich vertikales Ziehen wird an die Scroll-Liste abgegeben.

## Größe und Transparenz

`GhostSlot` in derselben Datei zeichnet jeden Geist an seiner aktuellen Position:

```tsx
const distance = Math.abs(index - position.value);
const scale = interpolate(distance, [0, 1, 2],
  [1, M.sideScale, M.farScale], Extrapolation.CLAMP);
```

`distance` ist der Abstand zur Mitte. In der Mitte ist die Größe `1`, also 100 %. Einen Platz daneben sind es 62 %, zwei Plätze daneben 48 %. `interpolate` berechnet alle Zwischenwerte: Die Größe wechselt bereits während des Ziehens. Transparenz funktioniert genauso: Mitte 100 %, Seite 42 %, ganz außen 16 %. Die vorhandenen Gesichter und Silhouetten bleiben erhalten.

Der Name wechselt, sobald der nächste Geist der Mitte am nächsten ist. Nur dieser Namenswechsel aktualisiert React; das Ziehen selbst läuft mit Reanimated. Die bestätigte Stimmung wird warm orange dargestellt.

## Vorschau und tatsächliche Wahl

Wischen oder Tippen auf einen seitlichen Geist ruft nur `settle(index)` auf. Es schreibt keine Stimmung in das Training. Erst die `confirm`-Funktion hinter „Auswählen +“ übernimmt sie:

```tsx
onChange(FEELING_ORDER[index]);
```

Im Recorder führt diese Zeile zur schon vorhandenen Verbindung:

```tsx
<FeelingPicker value={session.feeling}
  onChange={(feeling) => workoutStore.getState().setJournal({ feeling })} />
```

Nach der Bestätigung steht am Button „Ausgewählt ✓“. Der gewählte Geist antwortet einmal passend zur Stimmung: Schwach seufzt (sinkt, Lider fallen fast zu), Normal nickt und blinzelt, Stark hüpft mit glücklichen Augen. Die drei Figuren sind seit dem Geist-Update Varianten des BERKK-Geists, siehe [BERKK_GEIST.md](BERKK_GEIST.md). Es gibt keine Bewegung im Ruhezustand. Du kannst weiterwischen und erneut bestätigen. „Entfernen“ leert die optionale Stimmung ausdrücklich; bloßes Wischen löscht die vorherige Wahl nicht.

## Eingaben, Buttons und Speichern

`diary-field.tsx` öffnet nur die Höhe der Eingabefläche; es skaliert keine Buchstaben oder benachbarten Buttons. `withTiming` bringt `progress` über `M.fieldMs` von `0` auf `1` und beim Schließen zurück. Die natürliche Höhe der Eingabe wird gemessen, damit auch größere Schrift berücksichtigt wird:

```tsx
const unfolding = useAnimatedStyle(() => ({
  height: progress.value * bodyHeight.value,
  opacity: progress.value,
}));
```

Bei `progress === 0` ist die Eingabe zugeklappt, bei `1` vollständig offen. Der Text bleibt beim Zuklappen in seinem bisherigen Besitzer gespeichert. Geschlossene Eingaben sind für Tastatur und Bildschirmleser ausgeblendet. Fokus bedeutet: Die Tastatur schreibt gerade in dieses Feld; der warme Rand macht das sichtbar.

Name und Notiz behalten ihre bestehenden Längenbegrenzungen von 100 bzw. 4000 Zeichen. Die Scrollposition berücksichtigt das fokussierte Feld. Bei geöffneter nativer Tastatur wird der Abschlussbereich vorübergehend ausgeblendet, damit auf kleinen Handys Platz zum Schreiben bleibt. „Fertig“ am Feld schließt die Tastatur; anschließend sind die Speicheraktionen wieder erreichbar. `KeyboardAvoidingView` ist weiterhin aktiv. Im Browser wird verhindert, dass automatisches Scrollen beim Tippen den Eingabefokus entfernt; auf dem Handy bleibt das bisherige Schließen der Tastatur beim Ziehen erhalten. Echtes zeichenweises Tippen wurde zusätzlich geprüft.

`diary-action.tsx` hält die eigentliche Touch-Fläche stabil und verkleinert nur ihre sichtbare Fläche:

```tsx
transform: [{ scale: reduced ? 1 : 1 - pressure.value * (1 - M.pressedScale) }]
```

Bei gedrücktem Button ist `pressure` gleich `1`. Mit `pressedScale: 0.975` wird er also 97,5 % groß. Beim Loslassen geht `pressure` wieder auf `0`; der Button wird wieder 100 % groß. Dazu wird er kurz etwas dunkler. Kein Springen oder dauerhaftes Pulsieren.

Der Recorder zeigt Erfolg nur nach der vorhandenen Speicherfunktion:

```tsx
const saved = await workoutStore.getState().end();
if (saved) { notifySaved(); onFinish(); }
else setFinishing(false);
```

`await` bedeutet: auf das Ergebnis warten. Erst `saved === true` löst die Meldung aus. Navigation und Speichern warten nicht auf eine Erfolgsanimation. Bei einem Fehler bleibt das laufende Training erhalten; die vorhandene Fehlermeldung und Wiederholung bleiben erreichbar. Beim Bearbeiten gespeicherter Workouts gilt dieselbe Reihenfolge.

## Werte selbst ändern

Öffne `src/constants/diary-motion.ts`. Ändere zunächst immer nur einen Wert und lade die App neu.

```ts
snap: { stiffness: 260, damping: 23, mass: 0.7 },
velocityProjectionSeconds: 0.12,
sideScale: 0.62,
sideOpacity: 0.42,
confirmUpMs: 100,
confirmBackMs: 180,
confirmScale: 1.035,
confirmLift: 4,
pressMs: 100,
pressedScale: 0.975,
fieldMs: 200,
savedVisibleMs: 1600,
savedFadeMs: 160,
```

- `stiffness`: Stärke der Feder. Höhere Werte ziehen schneller zur Mitte.
- `damping`: bremst die Feder. Höhere Werte vermindern das Nachfedern; sehr hohe Werte können den Übergang langsamer machen.
- `mass`: gefühlte Masse. Kleinere Werte reagieren leichter/schneller. Eine Feder hat deshalb keine feste Millisekunden-Dauer.
- `velocityProjectionSeconds`: wie stark die Geschwindigkeit des Wischens das Ziel beeinflusst. Kleiner bedeutet: stärker nach der aktuellen Position entscheiden.
- `sideScale` / `farScale`: Größe seitlicher bzw. weiter entfernter Geister. `0.7` bedeutet 70 %.
- `sideOpacity`: Sichtbarkeit seitlicher Geister. `0` unsichtbar, `1` vollständig sichtbar.
- `confirmUpMs` / `confirmBackMs`: Zeit für die einmalige Bestätigungsreaktion. `confirmScale` und `confirmLift` bestimmen Größe und Höhe.
- `pressMs`: Dauer der Druckreaktion; `pressedScale` deren Stärke.
- `fieldMs`: Zeit zum Entfalten, aktuell 200 Millisekunden = 0,2 Sekunden.
- `savedVisibleMs` / `savedFadeMs`: Sichtzeit und Ein-/Ausblendezeit der Speichermeldung.

Farben kommen weiterhin aus `Berkk` in `src/constants/theme.ts`: `Berkk.link` für warmes Orange, `Berkk.ink` für die klare Vorschau, `Berkk.inkSecondary` für zurückhaltenden Text. Eine Änderung dort betrifft auch andere Screens. Nur dieses Karussell färbst du über `fill` in `FeelingGhost`; den Bestätigungsbutton über `styles.primary` in `diary-action.tsx`.

Bei reduzierter Bewegung entfallen Federn, Größenwechsel, Anheben, Entfalten und Einblenden. Wischen bleibt bedienbar, der nächste Geist rastet direkt ein. Name, orange Bestätigung und Häkchen bleiben als klares Feedback.

## Geprüft und auf dem Handy testen

Automatisch geprüft: ESLint, TypeScript, die 17 vorhandenen Trainingstests, 8 Kalendertests und 3 neue Rechentests. Browserprüfung bei 320×568, 390×844 und 1280×844: fließende Zwischenwerte während des Ziehens, Vorschau ohne Datenschreibvorgang, bestätigen/ändern/entfernen, Name/Notiz und Weitertrainieren, tatsächliches Speichern und kurze Meldung. Zusätzlich: vertikales Touch-Scrollen über dem Karussell, reduzierte Bewegung, bestehende Satzwerte, absichtlich fehlgeschlagenes Speichern mit erhaltenem Training und erfolgreicher Wiederholung, Bearbeiten eines gespeicherten Tagebuchs. Keine JavaScript-Fehler in diesen Prüfungen. Native iOS-/Android-Bundles wurden lokal exportiert.

Die Aufnahme `.playwright-mcp/diary-motion/berkk-ghost-carousel.webm` zeigt den tatsächlichen Chrome-Web-Screen. Der kleine Kreis markiert nur für die Aufnahme den simulierten Finger. Es ist keine Aufnahme von einem echten Handy. Ein echter Gerätetest war hier nicht möglich; native Tastatur, Safe Areas, Scrollkonflikte und Bildrate musst du noch beurteilen.

1. Bestehenden Expo-Server weiter benutzen und BERKK auf dem Handy neu laden. Falls er nicht läuft: Terminal im Ordner `gymapp`, `npm run tunnel`, angezeigten QR-Code mit Expo Go öffnen. Es wurden keine nativen Bibliotheken hinzugefügt.
2. Ein Testtraining starten und „Training beenden“ öffnen. Schwach ansehen/bestätigen, langsam nach links zu Normal ziehen. Auf halber Strecke kurz halten: Beide Geister müssen ihre Größe bereits verändert haben. Loslassen und Einrasten beobachten. „Bestätigt“ muss weiterhin Schwach sagen, bis du Normal auswählst.
3. Zu Stark weiterwischen und bestätigen; danach zurück zu Normal. Schnelle Richtungswechsel und die beiden Enden ausprobieren. Senkrecht über dem Karussell scrollen: Das darf keine Stimmung bestätigen.
4. Name und mehrzeilige Notiz öffnen. Prüfen, ob Cursor, warmer Rand und „Fertig“ sichtbar bleiben; auch auf kleinem Display und mit größerer Systemschrift. „Fertig“ schließen, wieder öffnen und prüfen, dass der Text erhalten ist.
5. „Weitertrainieren“ wählen: Timer und Sätze müssen weiter vorhanden sein. Erneut beenden, einen bestätigten Testsatz speichern. „Training gespeichert“ soll einmal kurz erscheinen; danach den Tagebucheintrag auf Name, Notiz, Stimmung und Satz prüfen.
6. iPhone: Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren. Android: in den Bedienungshilfen Animationen entfernen/deaktivieren (Name je nach Gerät). BERKK neu öffnen: keine Feder-/Zoomreaktionen, Auswahl weiterhin verständlich und bedienbar.

## Nur diesen Arbeitsstand zurücknehmen

Die vier zuvor bestehenden Dateien wurden vor der Änderung bytegenau gesichert. Die Sicherung enthält auch den vorherigen lokalen Arbeitsstand anderer BERKK-Aufgaben. Deshalb kein `git reset` verwenden.

Im Terminal aus `gymapp`:

```powershell
& .\.playwright-mcp\diary-motion-backup\restore.ps1
```

Das stellt diese vier Dateien zurück und entfernt ausschließlich die neu hinzugefügten Dateien dieser Tagebuch-Überarbeitung. Trainingsdaten auf dem Handy, Übungsbilder, Home-Button und Randlicht werden nicht gelöscht. Bei späteren Änderungen an einer betroffenen Datei stoppt das Skript vor der ersten Änderung. Möchtest du auch dann zurück, werden mit diesem Schalter zuerst alle betroffenen aktuellen Dateien zusätzlich gesichert:

```powershell
& .\.playwright-mcp\diary-motion-backup\restore.ps1 -PreserveLaterEdits
```

Danach BERKK neu laden. Die beiden Wiederherstellungswege wurden in getrennten Testordnern geprüft; die echte Projektversion wurde dabei nicht zurückgesetzt.
