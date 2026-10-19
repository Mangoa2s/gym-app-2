# BERKK – Übung hinzufügen: lokaler Testentwurf

Dieser Durchgang verändert die Suchoberfläche und ergänzt eigene lokale Übungsbilder. Er ist nicht committet oder gemergt und wartet auf deinen Handytest. Der Katalog mit seinen 117 IDs, Suchbegriffen und Erfassungstypen sowie die Speicherung der Trainingsdaten bleiben unverändert.

## Dateien und Zuständigkeit

| Datei | Aufgabe |
| --- | --- |
| `src/components/berkk/exercise-search.tsx` | Kompakter Header, Suchfeld, aktive Filter, vollständige Liste, eigene Übungen und bisheriger Auswahlaufruf. |
| `src/components/berkk/exercise-filters.tsx` | Zwei kompakte Filter und ihre aufklappbaren Auswahlfelder. |
| `src/components/berkk/exercise-result-row.tsx` | Bild links, Name/Kategorie mittig, festes Plus rechts; Druck- und Auswahlfeedback. |
| `src/data/exercise-illustrations.ts` | Ausdrückliche Zuordnung von jeder vorhandenen Katalog-ID zu einem lokalen Bild oder einer benannten Lücke. |
| `src/data/recent-exercises.ts` | Bis zu drei zuletzt verwendete Übungen aus gespeicherten, bestätigten Trainingseinträgen. |
| `src/hooks/use-exercise-reduced-motion.ts` | Liest reduzierte Bewegung und reagiert auf Änderungen während die Suche geöffnet ist. |
| `assets/images/exercises/*.png` | Eigene, lokal verfügbare Illustrationen mit transparentem Hintergrund. |
| `assets/images/exercises/manifest.json` | Eintrag für alle 117 Übungen: Position, Bilddatei, Prüfstatus und Generierungsauftrag. |
| `assets/images/exercises/README.md` | Tatsächliche Abdeckung und nachvollziehbare Liste aller Bilddateien. |
| `scripts/exercise-library.test.mjs` | Prüft echte Historie und die Vollständigkeit/Lokalität der Bildzuordnung. |
| `EXERCISE_PICKER_DESIGN.md` | Diese Anleitung. |

Der **unveränderte Katalog** liegt in `src/data/exercises.ts`. Eine **Komponente** beschreibt einen Teil der Oberfläche. Ein **Hook** ist eine React-Hilfsfunktion, die beispielsweise Systemereignisse beobachtet. TypeScript prüft JavaScript zusätzlich; `.tsx` erlaubt auch `<Text>…</Text>` als Oberflächenbeschreibung.

## Wie eine Übung ihr Bild erhält

Jede Übung hat eine feste ID, beispielsweise `barbell-bench`. Die Bildzuordnung benutzt genau diese ID:

```ts
'barbell-bench': {
  source: require('../../assets/images/exercises/barbell-bench.png'),
  description: 'Flat horizontal bench, person lying supine, ...',
},
```

`require(...)` sorgt dafür, dass die Bilddatei in die App aufgenommen wird. Dafür ist keine Internet-Bildadresse nötig. `description` beschreibt die dargestellte Position. Der Helfer `exerciseIllustration(exercise)` sucht die ID in dieser Tabelle.

Ein Eintrag mit `null` bedeutet ausdrücklich: Es gibt noch kein akzeptiertes Bild. Die Zeile zeigt dann „Ohne Bild“, keine unpassende Standardsilhouette. Eigene Übungen zeigen „Eigene Übung“, weil Name und Kategorie allein keine verlässliche Körperposition verraten.

Die Bilder wurden mit dem eingebauten imagegen-Werkzeug aus eigenen schriftlichen Positionsbeschreibungen erzeugt. Es wurden keine Hevy-Bilder oder fremden Bildsammlungen verwendet. Die finalen Aufträge und Prüfinformationen stehen im lokalen Manifest. Bildsprache: faceless Figuren, warmes Grau, dunkle Kleidung und Maschinen, kleine Orange-Akzente. Flach-/Schräg-/Negativbank, unterschiedliche Hanteln und Maschinen sowie Zugrichtungen sind getrennte Motive.

## Suche, Filter und Hinzufügen

In `exercise-search.tsx` steht:

```ts
const results = useMemo(
  () => searchExercises(catalog, query, muscle, equipment),
  [catalog, query, muscle, equipment]
);
```

`catalog` enthält den unveränderten Standardkatalog plus deine gespeicherten eigenen Übungen. `query` ist der eingegebene Suchtext; `muscle` und `equipment` sind die beiden aktiven Filter. `useMemo` berechnet diese Liste erst neu, wenn sich einer dieser Werte ändert.

Die bestehende Funktion `searchExercises` in `src/data/exercises.ts` bleibt erhalten. Sie berücksichtigt deutsche und englische Namen, Suchaliasse und die Kombination beider Filter. Das Suchfeld mit `onChangeText={setQuery}` aktualisiert den Suchtext. Die Filterauswahl setzt `setMuscle(value)` oder `setEquipment(value)`; „Alle“ entspricht keinem gesetzten Filter.

Der Auswahlaufruf bleibt unmittelbar:

```ts
onSelect(exercise);
dismiss();
```

Der Aufrufer im unveränderten `workout-recorder.tsx` übernimmt weiterhin `workoutStore.getState().addExercise(exercise)`. Die Suchoberfläche schreibt selbst keine Sätze und verändert keine Gewichte. Eine bereits enthaltene Übung wird wie bisher geöffnet, statt doppelt angelegt. Auch Nachtrag und Planung verwenden dieselbe Komponente mit ihrem bisherigen Aufrufer.

Ein kurzes Häkchen und „Hinzugefügt“ bzw. „Geöffnet“ begleiten das Schließen. Screenreader bekommen die gleiche Rückmeldung. Es gibt keinen neuen Wartetimer vor der Auswahl.

## Zuletzt verwendet

`recentExercises(history, catalog)` liest ausschließlich die gespeicherte Trainingshistorie. Trainingsentwürfe und Pläne sind keine Eingabe dieser Funktion. Ein Eintrag muss mindestens einen bestätigten Satz enthalten; Wiederholungen derselben ID werden zusammengefasst.

Die Gruppe erscheint nur bei ungefilterter, leerer Suche und vorhandenen echten Einträgen. Ohne Historie gibt es keine Gruppe. Darunter bleibt der komplette Katalog; die zuletzt verwendeten Übungen werden daraus nicht entfernt.

## Kleine Animationen und flüssige Liste

In `exercise-filters.tsx`:

```ts
export const EXERCISE_FILTER_MOTION = { changeMs: 140 };
```

Das Auswahlfeld und der geänderte Filterwert blenden weich ein. Höhere Zahlen verlängern die Änderung; 140 Millisekunden sind 0,14 Sekunden.

In `exercise-result-row.tsx`:

```ts
export const EXERCISE_ROW_MOTION = {
  pressMs: 100,
  pressedScale: 0.985,
};
```

Beim Drücken wird die Zeile kurz etwas dunkler und auf 98,5 Prozent verkleinert. Die Bildposition selbst wird nicht dauerhaft animiert. Bei reduzierter Bewegung entfällt das Verkleinern und die Filter-Einblendung.

Die vorhandene Sheet-Öffnung bleibt die einzige Einführung. Es gibt keine neuen Animationen für alle Zeilen beim Scrollen oder Suchen.

Die Liste verwendet `FlatList`: Sie hält nur einen Ausschnitt der Liste als sichtbare Oberfläche bereit. `initialNumToRender={8}`, `maxToRenderPerBatch={6}` und `windowSize={7}` begrenzen die Arbeit. Es gibt bewusst keine festen Zeilenhöhen, die lange Namen abschneiden würden. Die Bilder werden mit `expo-image`, `contentFit="contain"` und ohne Bildwechsel-Animation geladen. `recyclingKey` sorgt dafür, dass eine wiederverwendete Zeile nicht das Bild einer anderen Übung zeigt.

Der Textbereich hat `flex: 1` und `minWidth: 0`; er nutzt den verfügbaren Platz und darf mehrzeilig werden. Die rechte Aktionsspalte hat eine feste Breite und `flexShrink: 0`: Sie wird nicht unter den Text geschoben. Die ganze Zeile ist antippbar. Auf Displays unter 360 Punkten werden Bild und Abstände etwas kompakter.

## Auf dem Handy testen

Wenn BERKK schon offen ist, im Expo-Menü **Reload** wählen. Falls der Server aus ist, im Projektordner `gymapp`:

```powershell
npm start
```

Mit der bisherigen Expo-Go-App oder dem bestehenden Entwicklungsbuild den QR-Code öffnen. PC und Handy im selben WLAN; bei Bedarf ist `npm run tunnel` bereits vorhanden. Keine App-Daten löschen oder neu installieren.

1. Laufendes Training öffnen, „Übung hinzufügen“. Header, Schließen und Suchfeld sollten direkt erkennbar sein; keine zweite Timerüberschrift.
2. Suche nach `Bankdrücken`, `bench`, `Schrägbank`, `row` und `Unterarmstütz`. Auch eine Suche ohne Treffer prüfen und den Text wieder leeren.
3. Muskelgruppe „Rücken“ plus Equipment „Kabelzug“ wählen. Beide aktiven Werte müssen deutlich erscheinen. Jeden Filter einzeln auf „Alle“ zurücksetzen.
4. Lange Namen prüfen: Langhantel-Schrägbankdrücken, Brustgestütztes Kurzhantelrudern, Bulgarische Kurzhantel-Split-Squats, Wadenheben stehend an der Maschine. Das Plus muss immer rechts bleiben.
5. Unterschiedliche Motive vergleichen: Flach-/Schräg-/Negativbank, Kurzhantel/Langhantel, Kniebeuge, Kabelrudern/Latzug, Beinpresse/Beinbeuger sowie Plank und Cardio.
6. Eine Übung antippen: kurze Druckreaktion, Rückmeldung und Rückkehr ins Training. Satzwerte eingeben und dieselbe Übung erneut auswählen: kein Duplikat, vorhandene Eingaben bleiben erhalten.
7. Eigene Übung erstellen. Sie muss auswählbar und gespeichert bleiben; sie bekommt kein geratenes Standardbild.
8. Mit geöffneter Tastatur suchen, scrollen, ein Ergebnis auswählen und schließen. Auf einem kleinen iPhone oder Android-Gerät sowie mit größerer Systemschrift prüfen. Letzte Listeinträge und Schließen müssen erreichbar bleiben.
9. Bei echter gespeicherter Trainingshistorie „Zuletzt verwendet“ ansehen. Ohne Historie darf die Gruppe nicht auftauchen. Zum Testen keine erfundenen Trainings in deinem eigenen Konto speichern.
10. „Bewegung reduzieren“ bzw. „Animationen entfernen“ in den System-Einstellungen einschalten. Auch bei geöffneter Suche umschalten. Bilder bleiben immer ruhig; die kleinen Filter- und Druckbewegungen entfallen.

## Rücksetzen

Die ursprüngliche Suchdatei ist separat unter `.playwright-mcp/exercise-picker-backup` gesichert. Das dortige Skript stellt nur diesen Durchgang wieder her und entfernt seine neuen Projektdateien, ohne Trainingsdaten oder frühere Designänderungen anzutasten:

```powershell
& './.playwright-mcp/exercise-picker-backup/restore.ps1'
```

Falls du die betroffenen Dateien später selbst geändert hast, zunächst `-PreserveLaterEdits` ergänzen. Diese Variante kopiert den aktuellen Stand vor dem Rücksetzen in einen separaten datierten Ordner.

## Bildabdeckung und Prüfung

**117 von 117 Katalogübungen sind zugeordnet und visuell geprüft; 0 offene Bildlücken.** Alle 117 PNG-Dateien liegen lokal in `assets/images/exercises`. Das Manifest und die README in diesem Ordner führen jeden tatsächlichen Eintrag mit seiner Datei auf. Eigene Übungen zählen nicht als automatisch bebildert.

Die transparenten PNG-Originale benötigen zusammen **77,3 MiB**. Ihre Erkennbarkeit bei 64–76 Punkten Bildgröße und das erste Laden sind Teil deines Handytests; dieser Stand ist noch kein endgültig akzeptierter Release.

Bestanden: Lint, TypeScript, 4 neue Historien-/Zuordnungstests und die bestehenden 17 Workout-Tests. iOS und Android wurden lokal mit allen Bilddateien gebündelt. Die Layoutprüfung meldet keine Befunde. Browserprüfungen auf 320, 390 und 1280 Pixel bestätigen Suche, kombinierte Filter, sofortige Auswahl, eigene Übungen und das Öffnen vorhandener Übungen ohne Duplikat. Gespeicherte Satzwerte bleiben erhalten. Zuletzt verwendete Übungen wurden mit einem tatsächlich abgeschlossenen Testtraining geprüft; ohne Historie erscheint die Gruppe nicht.

Simulierte Safe Areas mit 20/0 und 59/34 Punkten sowie eine verkürzte Ansicht mit 480 Pixel Höhe wurden geprüft. Die letzte Übung und ihr lokales Bild sind nach schnellem Scrollen erreichbar. Eine gehaltene Zeile verkleinert sich bei normaler Bewegung; nach live eingeschalteter reduzierter Bewegung bleibt ihre Größe stabil. Browserfehler: keine. Das Rücksetzskript wurde in zwei getrennten Testordnern geprüft, einschließlich Sicherung späterer Änderungen. Belege liegen unter `.playwright-mcp/exercise-picker`.

Browserprüfungen finden mit isolierten Testdaten statt. Sie ersetzen keine Prüfung der nativen Tastatur und Scroll-Flüssigkeit auf deinem Handy. Ein echtes Testgerät ist hier weiterhin nicht verbunden.
