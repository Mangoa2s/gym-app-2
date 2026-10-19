# BERKK – erster Trainingsprototyp

## Auf dem iPhone ausprobieren

1. Im Ordner `gymapp` ein Terminal öffnen und `npx expo start --go` starten. Wenn Metro bereits läuft, dessen QR-Code verwenden.
2. iPhone und Rechner ins gleiche WLAN bringen. In Expo Go eine zu SDK 57 passende Version verwenden und den QR-Code mit der iPhone-Kamera öffnen.
3. Expo CLI und Expo Go müssen auf dem physischen iPhone mit demselben Expo-Konto angemeldet sein; bei Bedarf am Rechner `npx expo login` ausführen. [Expo-Anleitung](https://docs.expo.dev/get-started/start-developing/).
4. Falls das WLAN die Verbindung blockiert: `npx expo start --go --tunnel` und den neuen QR-Code scannen.

In Home bis „Workout starten“ scrollen. Ein Tap startet den Timer sofort. „Zur Übersicht“ lässt die Session weiterlaufen, „Zum Training“ öffnet sie ohne Startanimation. „Training beenden“ beendet sie. Der nächste Start hat wieder die volle Animation.

### Kurzer Handy-Test

- Einmal starten: Wirkt die Kompression unmittelbar? Bleibt der Weg vom Button zum Timer zusammenhängend? Rastet der Timer ruhig ein?
- Schnell doppeltippen: nur eine Session, kein Zurücksetzen der Zeit.
- Zur Übersicht und zurück: gleiche Zeit, keine erneute Startanimation.
- Während des Starts kurz die App wechseln; danach während des laufenden Timers das Display etwa 20 Sekunden sperren. Nach Rückkehr muss die Zeit stimmen und die Animation abgeschlossen sein.
- Beenden und neu starten: Zeit beginnt erneut bei null, Startmoment wird wieder gezeigt.
- iOS → Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren: kurzer Übergang, keine wandernde Fläche oder Größenanimation, statischer Hintergrund.

Für die nächste Runde besonders beurteilen: Stärke des Startmoments, Größe/Lesbarkeit der Zahlen und ob Orange/Violett während des Trainings ausreichend ruhig bleiben.

## Umsetzung und Stellschrauben

`src/constants/workout-motion.ts` hält Dauer, Zeitabschnitte, Kompression, Größenwechsel, Lichtstärke, Lichtgröße, Timerposition und die Hintergrundzyklen zentral.

- Ein Reanimated-Clock steuert Button, Hintergrundüberblendung, wandernde Fläche, Timer, Licht und Bedienelemente. Die Route `/workout` ist ein transparentes Expo-Router-Modal ohne zusätzliche Navigatoranimation. Der vorhandene Home-Screen samt Tab-Leiste bleibt darunter, bis die Überblendung abgeschlossen ist.
- `measureInWindow` liefert die echte Buttonposition inklusive Scroll- und Safe-Area-Versatz. Ein untransformierter Wrapper wird gemessen; die Kompression ist deshalb nicht doppelt eingerechnet.
- Der zentrale Zustand in `src/store/workout-state.ts` speichert den Startzeitpunkt synchron vor Messung und Navigation. Wiederholte Starts erhalten dieselbe Session. Verbrauchte Startanimationen werden pro Session markiert.
- `use-workout-timer.ts` berechnet die Anzeige aus `Date.now() - startedAt`. Der Refresh-Takt ist kein Zeitzähler. AppState aktualisiert beim Zurückkehren sofort und stoppt Display-Updates im Hintergrund.
- Hintergrund: vorhandene SVG-Lichtflächen, Orange `Berkk.glowOrange`, Violett `Berkk.glowPurple`, vollständige Sinuszyklen von 20 und 24 Sekunden, maximal 18/24 Punkte Bewegung. Die Schleifen pausieren bei fehlendem Fokus oder im Hintergrund.
- Ziffern: echtes `SchibstedGrotesk_900Black`, `Berkk.ink`, tabellarische Zahlen. Ab einer Stunde zeigt der Timer `h:mm:ss`.
- SVG-Verläufe bekommen eindeutige IDs, damit gleichfarbige Home-/Trainingsflächen ihre Deckkraft nicht gegenseitig überschreiben.

Es gab noch kein Trainingstracking. Dieser Prototyp erfasst die laufende Dauer; beim Beenden wird kein Verlauf gespeichert. Die Session bleibt beim Navigieren, App-Wechsel und Sperren erhalten, solange der App-Prozess weiter existiert. Ein vollständiger App-Neustart/Reload verwirft sie. Es wurde kein Haptikpaket ergänzt, da keines installiert war.

## Tatsächlich geprüft

Am 27.09.2026 unter Windows:

- `npx tsc --noEmit`: bestanden.
- `npm run lint`: bestanden. Ein bestehender Hydration-Lintfehler in `use-color-scheme.web.ts` wurde mit `useSyncExternalStore` behoben.
- `npm run test:weight`: 12 bestehende Tests bestanden.
- `npm run test:workout`: 3 neue Tests bestanden (synchroner Doppelstart, Zeitberechnung inklusive längerer Unterbrechung, Rückkehr/Ende/neue Session und veraltete Mess-Callbacks).
- `npx expo export --platform ios --output-dir .expo/workout-ios-check`: iOS-JavaScript/Hermes-Bundle erfolgreich erstellt. Das ist kein Geräte- oder Simulatorlauf.
- Chromium-Web-Vorschau in 390 × 844 und 320 × 640: Start, schneller Doppelklick, Beenden, Neustart, Rückkehr ohne Intro, Timer und erreichbarer Beenden-Button geprüft; keine Browser-Laufzeitfehler.
- Frame-Messung: erste Fläche an x=22/y=624 bei 346 × 80; Kompression, anschließende Bewegung und Timer-Skalierung 1,3 → 1 sichtbar. Bei etwa 769 ms standen die Ziffern auf Skalierung/Deckkraft 1. Dabei wurde ein vorzeitiges Beenden durch React Strict Modes Effect-Replay gefunden und korrigiert.
- Simuliertes Einfrieren der Browser-Seite für 3,2 Sekunden: Timer von 00:58 auf 01:02; laufende Hintergrundbewegung anschließend bestätigt.
- Emuliertes `prefers-reduced-motion`: nach 200 ms Timer sichtbar bei Skalierung 1, keine wandernde Buttonfläche; Hintergrundtransform über 1,2 Sekunden identisch.
- Mechanischer Design-Check der neuen UI: keine Befunde.

Nicht auf echtem iPhone/iOS-Simulator geprüft: native Bildrate, Safe-Area-/Modalübergang auf Hardware, tatsächlicher App-Wechsel, Displaysperre, VoiceOver und iOS-Einstellungswechsel während einer Session. Diese Punkte gehören zum obigen Handy-Test.
