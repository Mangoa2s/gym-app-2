# BERKK-Geist

Stand 15. Oktober 2026, wartet auf deine Handyabnahme. Keine Commits.

Der Geist aus `assets/characters/berkk-geist.svg` ist jetzt ein wiederkehrender Charakter mit Gefühlen. Grundform, die zwei ovalen Augen und der warme Farbverlauf bleiben unverändert. Gefühle entstehen nur durch **Haltung** (sinken, strecken, neigen), **Augen** (Lider, Blickrichtung, Größe, glückliche Bögen) und **Timing**. Es gibt keinen Mund, keine Arme, kein Konfetti und kein Video.

## Recherche: was wirklich verwendet wurde

**Mobbin** (nur Standbilder, keine Animationen; Timing ist daraus abgeleitet, nicht gemessen):

- Duolingo „Lesson complete“, z. B. [Way to go](https://mobbin.com/screens/92705902-10f2-4dd7-b46f-21fe7732cfff), [Learning legend](https://mobbin.com/screens/a5edfc91-474c-4ff6-b1b2-e418bfe5a383), [0 Fehler](https://mobbin.com/screens/8086bc1d-dede-4e4f-bc90-181f53bd642f): Das Gefühl sitzt fast komplett in den Augen und in der Körperneigung. Die Figur reagiert einmal und tritt dann hinter Zahlen und Button zurück.
- Duolingo Streak, z. B. [6 day streak](https://mobbin.com/screens/f6675d16-c6b5-4847-aa9f-fb66a2d61e88) und die Widgets [Come back soon](https://mobbin.com/screens/3ed7f990-7eea-4cfa-bc35-af1ee8ecee40) / [Please practice](https://mobbin.com/screens/292dabe3-384b-4a45-81d8-85d998bbf852): Die Zahl ist der Held, die Figur steht daneben. Dieselbe Figur zeigt den Serien-Zustand nur über Varianten ihres Ausdrucks.
- [Ahead – Stimmungsgeist](https://mobbin.com/screens/fbd4651c-96a1-459d-8d7c-2b3022fb4718), [Tiimo](https://mobbin.com/screens/8d8d04c5-46a3-4aac-a6aa-e7d4871d8390), [Noom](https://mobbin.com/screens/5533e8a8-c82e-4f01-b068-38a19faf2746): **eine** Figur, deren Gesicht sich je Stimmung ändert, statt drei verschiedener Figuren.

**Higgsfield / Seedance 2.5:** vier Bewegungsstudien mit deinem Geist als Startbild (480p-Entwurf, 4 s, ohne Ton, je 12 Credits, zusammen 48). Ehrliches Ergebnis: kaum brauchbar. „Fokus“ schloss die Augen zu Bögen, „Erfolg“ und „Schwach“ bewegten sich kaum, und „Stark“ wurde flach und breit gedrückt. Übernommen wurden zwei Erkenntnisse: **Augenbögen wirken zufrieden** (deshalb nur für Freude, nicht für Fokus) und **flach gedrückt wirkt erschöpft** (deshalb für Schwach, und Stark wird umgekehrt gestreckt). Die Videos sind nicht in der App.

**Eigene Entscheidungen** (keine Kopie von Duo oder anderen Apps): flach abgeschnittene Augenlider als Fokus-Ausdruck; „Schwach“ als Erschöpfung statt Traurigkeit (hängende Lider nach außen, sinken); „Stark“ als Strecken nach oben; die Erfolgsreaktion als Erwartung → Sprung → Landung; warmes Licht ausschließlich bei einer echten Serie; eine Rückmeldung zur Serie nur, wenn sie durch das Speichern wirklich gewachsen ist.

## Technik

SVG (`react-native-svg`) plus Reanimated, beide schon installiert. Damit gibt es keine neue Abhängigkeit, und es läuft in Expo Go. Rive (`rive-react-native`) bräuchte einen eigenen Development-Build, und es gibt noch keine `.riv`-Datei mit State Machine. Für die heutigen Zustände reicht SVG plus Reanimated; Rive bleibt eine Option für später.

Der Körper ist eine **statische** SVG. Bewegt werden nur wenige kleine Ebenen auf dem UI-Thread: der Körper, zwei Augen, die Augenbögen und das Licht. Es gibt keine Animation von SVG-Pfaden, keinen Blur und keinen React-Neuaufbau pro Bild.

## Zustände und Auslöser

| Zustand | Aussehen | Auslöser |
|---|---|---|
| Ruhig | atmet sanft, blinzelt ab und zu | Kalender, Serie > 0 und heute noch nicht trainiert |
| Fokussiert | Lider halb, Blick nach unten zur Liste, ruhiger Atem | während des Trainings (Kopfzeile neben `3×`) |
| Start | kurz zusammenziehen, Augen weit auf, kleiner Hüpfer, dann Fokus | frisch gestartetes Training, ca. 0,6 s nach dem Öffnen. Fortsetzen und Neuladen bleiben ruhig |
| Erfolg | Erwartung (ducken) → Sprung mit glücklichen Augenbögen → Landung | Satz bestätigt **und dauerhaft gespeichert**; außerdem die Meldung „Training gespeichert“ |
| Serie | warmes Licht schwillt einmal an, stolzes Strecken, glückliche Augen | echte Serie > 0: einmal beim frischen Trainingsstart; im Kalender beim ersten Öffnen und nur, wenn die Serie wirklich gewachsen ist; nach dem Speichern nur, wenn die Serie dadurch gestiegen ist („Serie: 4× in Folge“) |
| Schwach | gesunken, breiter, schwere hängende Lider | Befinden „Schwach“; beim Bestätigen ein langsamer Seufzer |
| Normal | Grundhaltung | Befinden „Normal“; beim Bestätigen Nicken und Blinzeln |
| Stark | höher, gestreckt, weite Augen nach oben | Befinden „Stark“ und Kalender, wenn heute trainiert wurde; beim Bestätigen ein Hüpfer mit glücklichen Augen |

Die Zahl `×` bleibt normaler App-Text. Bei Serie 0 gibt es kein Licht und keinen Serien-Gruß. Im Tagebuch gibt es weiterhin keine Dauerbewegung.

**Bewegung reduzieren:** kein Atmen, kein Blinzeln, keine Sprünge. Bei Freude wechseln nur kurz die Augen (0,7 s), bei der Serie leuchtet das Licht kurz auf, und der Text bleibt die Hauptrückmeldung. **Hintergrund:** Atmen und Blinzeln stoppen, wenn die App inaktiv ist oder der Screen keinen Fokus hat.

## Dateien, einfach erklärt

| Datei | Was sie tut |
|---|---|
| `assets/characters/berkk-geist.svg` | Deine Original-SVG als Quelle. |
| `src/components/berkk/ghost-state.ts` | Reine Logik ohne Animation: die Posen-Tabelle `GHOST_POSES` (wie sitzt jeder Zustand), wann Licht und Gruß erlaubt sind, und `finishFeedback(vorher, nachher)` für die Meldung nach dem Speichern. Gut zu testen. |
| `src/constants/ghost-motion.ts` | Alle Zeiten und Stärken (ms, Skalierung). Hier drehst du, wenn etwas zu schnell, zu langsam oder zu stark ist. |
| `src/components/berkk/berkk-ghost.tsx` | Die zentrale Komponente `<BerkkGhost size mood pulse idle glow muted />`. `mood` ist die Haltung, `pulse` spielt eine Reaktion einmal ab und kehrt zurück. |
| `src/components/berkk/workout-streak.tsx` | Kopfzeile im Training: Geist statt Symbol. |
| `src/components/berkk/workout-timer-overlay.tsx` | Löst Start, Serien-Gruß und Erfolg aus. |
| `src/components/berkk/workout-recorder.tsx` | Meldet „Satz gespeichert“; vergleicht beim Abschluss die Serie vorher und nachher. |
| `src/components/berkk/workout-save-feedback.tsx` | Die Meldung „Training gespeichert“ mit reagierendem Geist und optionaler Serienzeile. |
| `src/components/berkk/workout-journal.tsx` | Nachgetragene Trainings bekommen dieselbe echte Serien-Prüfung; Planungen nur ein Nicken. |
| `src/components/berkk/feeling-picker.tsx` | Befinden zeigt jetzt deinen Geist in drei Haltungen; die Bestätigung löst die passende Reaktion aus. |
| `src/components/berkk/calendar-streak-ghost.tsx`, `src/components/berkk/calendar-head.tsx` | Geist rechts im hellen Kalender-Kopfteil. Dort ohne warmes Licht (`halo={false}`), weil es auf Creme wie ein Fleck wirkt; der Serien-Gruß zeigt sich über Haltung und glückliche Augen. |
| `src/constants/diary-motion.ts`, `src/constants/workout-motion.ts` | Alte Bestätigungswerte entfernt; Pause vor dem Serien-Gruß ergänzt. |
| `scripts/ghost.test.mjs` | 4 Tests, inklusive eines echten Durchlaufs: gestern trainiert → heute speichern → „Serie: 2×“; ein zweites Training am selben Tag feiert keine Serie. |

So liest sich eine Reaktion im Code (`berkk-ghost.tsx`, Funktion `react`):

```ts
v.lift.set(withSequence(t(p.lift + 3, S.squashMs), t(p.lift + S.lift, S.jumpMs), t(p.lift, S.landMs), back(p.lift)));
```

`withSequence` spielt Schritte nacheinander: erst 3 Einheiten nach unten (ducken = Erwartung), dann nach oben (Sprung), dann zurück (Landung), zum Schluss federnd in die Haltung der aktuellen Stimmung (`back`). `p` ist die Pose der aktuellen Stimmung, darum endet jede Reaktion wieder dort.

## Auf dem Handy testen

App starten wie gewohnt mit `npm run tunnel:cf` im Ordner `gymapp`, dann den QR-Code scannen.

1. **Start + Fokus:** Ein laufendes Training ggf. abschließen, dann „Workout starten“. Oben rechts zieht sich der Geist kurz zusammen, macht große Augen und einen kleinen Hüpfer und schaut danach mit halben Lidern nach unten. Bei deiner echten Serie > 0 leuchtet er etwa 1 s später einmal warm auf.
2. **Erfolg:** Übung hinzufügen, Werte eingeben, Häkchen. Sobald „Gespeichert“ erscheint, duckt sich der Geist, springt und hat kurz glückliche Augenbögen.
3. **Ruhe im Training:** 20 Sekunden zuschauen. Er atmet kaum sichtbar und blinzelt selten. Kurz in den Hintergrund und zurück: kein Sprung, kein Hängen.
4. **Befinden:** „Training beenden“. Im Karussell nach links und rechts wischen: Schwach (gesunken, schwere Lider), Normal, Stark (gestreckt, Blick nach oben). Jeweils „Auswählen“: Seufzer, Nicken, Hüpfer.
5. **Abschluss + Serie:** „Training speichern“. Oben erscheint „Training gespeichert“. Nur wenn heute vorher noch nicht trainiert wurde und deine Serie dadurch steigt, steht darunter „Serie: N× in Folge“ und der Geist leuchtet. Ein zweites Training am selben Tag zeigt nur die Freude ohne Serienzeile.
6. **Kalender:** Kalender-Tab. Rechts neben der Zahl grüßt der Geist deine Serie einmal; nach einem heutigen Training steht er „stark“. Ein weiterer Tab-Wechsel grüßt nicht erneut.
7. **Bewegung reduzieren:** iPhone Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren. Schritte 1, 2 und 4 wiederholen: keine Sprünge, kein Atmen, nur kurz glückliche Augen und die Texte.

Hinweis: Auf dem Handy siehst du deine echte Serie. Lege keine Fake-Trainings an, nur um eine Serie zu testen; die Browser-Prüfung unten hat das mit getrennten Testdaten erledigt.

## Geprüft und offen

Geprüft: Typecheck, Lint, alle 59 Tests (davon 4 neu), iOS- und Android-Hermes-Bundles, Browserlauf mit getrennten Testdaten (Serie 0 und 3 → 4) bei 375 × 667 und 320 × 568: Kalender-Gruß, Fokus-Lider, Erfolg nach „Gespeichert“, Befinden-Varianten und Bestätigung, Abschluss-Meldung „Serie: 4× in Folge“, Bewegung reduzieren, kein seitliches Scrollen, keine Konsolenfehler. Screenshots: `../.playwright-mcp/ghost-check/`.

Offen (nur auf einem echten Gerät prüfbar): Bildrate und Akku bei laufendem Training, ob die Augen-Lider mit `overflow: hidden` auf iOS sauber clippen, ob 34 pt in der Kopfzeile für Gefühle groß genug wirken, die Lesbarkeit der Augenbögen auf deinem Display, Verhalten beim Sperren und Entsperren, und ob dir zwei Geister gleichzeitig (Kopfzeile + Befinden beim Beenden) gefallen.
