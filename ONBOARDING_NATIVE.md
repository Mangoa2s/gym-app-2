# BERKK-Onboarding: lokale Umsetzung

Stand: 16. Oktober 2026. Testbarer Arbeitsstand zur persönlichen Designabnahme. Keine Veröffentlichung, kein Merge, keine neuen Laufzeitabhängigkeiten.

## Auf dem Handy starten

1. Im Terminal den App-Ordner `gymapp` öffnen.
2. `npm start` ausführen. Falls bereits ein Server auf 8081 läuft, dessen QR-Code verwenden oder den vorgeschlagenen freien Port bestätigen.
3. Handy und Computer mit demselben WLAN verbinden. QR-Code mit Expo Go auf Android bzw. der iPhone-Kamera öffnen. Die installierte Expo-Go-Version muss das SDK 57 dieser App unterstützen.
4. Ohne gespeicherten Onboarding-Abschluss erscheint die Einrichtung vor der vorhandenen Übersicht.
5. Nach dem Abschluss öffnet „In die Übersicht“ die bestehende Route `/(tabs)` mit deinem echten Kalender-, Trainings- und Gewichtsbestand.
6. Für einen weiteren Durchlauf auf der Übersicht ganz nach unten scrollen und **„Onboarding erneut testen“** wählen. Dieser Knopf erscheint ausschließlich im Entwicklungsbetrieb. Er setzt nur den Onboarding-Entwurf zurück; Profil, Gewichtsverlauf, Workouts und Abschlussstatus bleiben bestehen. Gespeicherte Vorlieben werden vorausgewählt.

Bei WLAN-Problemen steht im bestehenden Projekt `npm run tunnel` zur Verfügung. Expo Go kann ein eigenes Entwickler-Menü bzw. eine schwebende Schaltfläche überlagern; beides gehört nicht zum Onboarding.

## Welche Dateien was steuern

| Datei | Aufgabe |
| --- | --- |
| `src/app/onboarding.tsx` | Neue native Route, bindet den Screen ein. |
| `src/components/berkk/onboarding-screen.tsx` | Reihenfolge, Zurück/Weiter/Überspringen, Demo, Auswahlzeilen, Tage, Zusammenfassung, Schutz vor Doppeltippen und Abschluss. Enthält die meisten Abstände und Größen als `StyleSheet`. |
| `src/constants/onboarding.ts` | Texte und Optionen aus der Vorlage, Grundfarben und Bewegungszeiten. |
| `src/components/berkk/onboarding-scene.tsx` | Dauerhaftes Maskottchen, Originalkörper und Augen, Farbverlauf, Schweben, Atmen, Blinzeln, Interesse/Fokus/Freude, Erfolgsreaktion mit Lichtpunkten, Positionswechsel, Atmosphäre. |
| `src/components/berkk/onboarding-weight.tsx` | Gewichtsentwurf, kg/lb, freiwillige Tastatureingabe, Eingabeprüfung. |
| `src/components/berkk/onboarding-wheel.tsx` | Einrastende native Scrollräder mit höchstens 17 gerenderten Zahlen je Rad; eigenständige Scrollbereiche ohne verschachtelte VirtualizedLists. |
| `src/store/onboarding-state.ts` | Testbare Datenlogik: Entwurf, Profil, Abschluss, Laden, geordnete Speicherzugriffe, Fehler und Neustart. |
| `src/store/onboarding.ts` | Verbindet diesen Store mit dem bereits verwendeten AsyncStorage und React. |
| `src/app/_layout.tsx` | Registriert die neue Route. Vorhandene Fonts und Provider bleiben erhalten. |
| `src/app/(tabs)/_layout.tsx` | Wartet auf gespeicherte Angaben und leitet bei fehlendem Abschluss ins Onboarding. |
| `src/app/(tabs)/index.tsx` | Ergänzt ausschließlich den Knopf zum erneuten Testen im Entwicklungsbetrieb. |
| `scripts/onboarding.test.mjs` | Sechs automatisierte Tests für Persistenz, Wiederaufnahme, Neustart, Eingaben und Speicherfehler. |
| `scripts/serve-onboarding-reference.cjs` | Optionaler, rein lesender lokaler Server für den direkten Browservergleich. |

Bestehende Änderungen wurden nicht zurückgesetzt. Der bestehende Gewichts-Store und die Trainingslogik wurden nicht verändert.

## Speicherung und wichtige Grenzen

- Eigener AsyncStorage-Schlüssel `berkk-onboarding`, Version 1. Darin liegen der Entwurf und die bestätigten Trainingsvorlieben. Unbekannte Profil- und Speicherfelder bleiben erhalten.
- Änderungen werden der Reihe nach geschrieben; Wiederaufnahme erhält Schritt, Entscheidungen und Demo-Werte. Das eigentliche Profil wird erst mit dem Abschluss bestätigt.
- Der Probe-Satz schreibt ausschließlich Demo-Felder im Onboarding-Entwurf. Er erzeugt weder Workout noch Rekord noch Trainingsserie.
- Trainingstage sind Vorlieben. Es werden daraus keine Workouts oder Kalenderplanungen erstellt.
- Das Startgewicht ist bis zum ausdrücklichen Übernehmen ein Entwurf. Vorhandenes Gewicht wird vor 82,4 kg verwendet. „Überspringen“ entfernt nur eine etwaige Gewichtsauswahl des Onboardings und schreibt kein Gewicht.
- Erst der endgültige Abschluss übergibt ein ausdrücklich bestätigtes, geändertes Gewicht an den bestehenden Gewichts-Store. Bestehendes unverändertes Gewicht bekommt dadurch keinen neuen Verlaufspunkt. Ein bloßer Wechsel zwischen kg und lb verändert den gespeicherten kg-Wert nicht.
- Tastatur ausschließlich nach bewusstem Antippen. Bei manueller Eingabe erst „OK“ wählen. Der Hauptbutton ist während einer offenen Eingabe und beim Scrollen gesperrt.
- Falls das Laden bestehender Daten scheitert, werden diese nicht überschrieben. Laden/Speichern kann erneut versucht werden.
- Das Profil liegt lokal auf diesem Gerät. Die App hat weiterhin kein echtes Konto-Backend.

## Bewegung und Darstellung

Die Werte stammen aus `dist/style.css` und `ONBOARDING.md`: 4,2 s Schweben/Atmen, 6,8 s Blinzeln, 700 ms Größen-/Positionswechsel, 140 ms Ausgang, 380–550 ms Eingang mit 0/35/65/90 ms Versatz, 750 ms Erfolg, 16 s Hintergrundbewegung je Richtung und 6 s Button-Lichtzyklus. Grundkurve: `cubic-bezier(.2,.8,.2,1)`.

Reanimated übernimmt die Charakter- und Umgebungsbewegung auf nativen Transform-/Deckkraftebenen. Die Zahlenräder nutzen native Scrollphysik und React Natives Animated. Bei reduzierter Bewegung entfallen dekorative Schleifen, Sprung, Skalierung und räumliche Eingänge. App-Hintergrund und fehlender Routenfokus stoppen die Dauerbewegung.

Die Inhalte sind scrollbar, die Hauptaktion bleibt außerhalb des Inhalts. Safe Areas werden berücksichtigt. Auf 375 × 667 müssen längere Schritte und die Zusammenfassung teilweise gescrollt werden, besonders bei größerer Systemschrift. Text darf wachsen; nur die Ziffern der Räder haben feste Größen. Die bewusste Tastatureingabe bleibt als vergrößerbare Alternative verfügbar. Tippflächen sind mindestens 44 pt; sichtbare kleinere Kreise sind Teil größerer Zeilen.

## Prüfung und Nachweise

- Typecheck und Expo-Lint bestanden.
- 41 automatisierte Tests bestanden: sechs neue Onboarding-Tests sowie vorhandene Gewichts-, Workout- und Geisttests.
- Android- und iOS-Hermes-Exporte erfolgreich. Ein Export ist kein iPhone-Gerätetest.
- Browser: vollständiger Ablauf bei 375 × 667, Wiederaufnahme durch Reload, Zurück und Pflichtauswahl, Doppelklickschutz, ungültige/gültige Tastatureingabe, kg/lb ohne Wertdrift, bearbeitete Erfahrung, echter Übersichtswechsel und erneuter Start. Keine Seitenfehler im vollständigen Ablauf.
- Browser: 430 × 932 mit reduzierter Bewegung, alle optionalen Schritte übersprungen, Abschluss und Reload; kein Gewichtsdatensatz, keine erfundenen Workouts. Vorhandenes Gewicht samt Verlauf und Zusatzfeldern bleibt beim Überspringen erhalten.
- Direkter Vergleich mit der mobilen Browserreferenz. Referenz wurde tatsächlich unter `C:/Users/aslan/Downloads/berkk-onboarding` gefunden; ein gleichnamiger Ordner unter dem Projekt war zu Beginn nicht vorhanden.
- Nativ: Expo Go 57.0.9 im Android-Emulator, 750 × 1334 px bei Dichte 320 = 375 × 667 pt; Einstieg, Übergänge, Ziel/Erfahrung, Gewichtsräder, explizite Dezimaltastatur und vollständig sichtbare Eingabe-/OK-Fläche geprüft. Systemschrift 150 % in der Zusammenfassung geprüft; Scrollen und Hauptaktion bleiben verfügbar. Abschluss und anschließender Neustart führten zur echten Übersicht mit dem ausdrücklich eingegebenen Testgewicht 86,3 kg und weiterhin 0 Trainingstagen in Folge. Dabei native SVG-Verlaufswerte, Tastaturlayout und verschachtelte Listen korrigiert. Screenshots liegen lokal unter `.playwright-mcp/onboarding-*.png`.

Erneut ausführbar im App-Ordner:

```powershell
npx tsc --noEmit
npx expo lint
node --test scripts/onboarding.test.mjs scripts/body-weight.test.mjs scripts/workout.test.mjs scripts/workout-recording.test.mjs scripts/ghost.test.mjs
```

## Bewusste Abweichungen und offene Handyabnahme

- Die Vorschau-Abschlussseite entfällt zugunsten deiner vorhandenen App-Übersicht. Die Zusammenfassung enthält zusätzlich eine einzeln bearbeitbare Erfahrungszeile.
- Native Schriftmetriken, Safe Areas, Scrollphysik und Bildschirmgrößen verursachen kleine Abstands- und Umbruchunterschiede.
- Die extrem feine CSS-Körnung und der CSS-Drop-Shadow des Geists werden nicht pixelgenau nachgebildet. Hintergrundlicht, Umlaufbahnen und Buttons sind native Annäherungen; die Figur selbst nutzt den Originalpfad und dieselben Verlaufsfarben.
- Kein Rive-Asset und keine neue Animationsabhängigkeit erforderlich. Die SVG mit „rive“ im Namen ist eine Vektorgrafik, keine Rive-Animationsdatei.
- Kein physisches iPhone/Android-Handy angeschlossen, kein iOS-Simulator unter Windows und keine gemessene Bildrate. Echte iPhone-Tastatur, VoiceOver/TalkBack und subjektives Bewegungsgefühl bleiben Teil deiner Abnahme.
- Der schon vorher vorhandene blaue Expo-Startbildschirm gehört nicht zu dieser Änderung. Die eigentliche Onboarding-Umgebung beginnt danach.

Für die Abnahme bitte einmal mit und einmal ohne Gewicht durchlaufen, alle „Ändern“-Aktionen verwenden, einen Zwischenschritt durch Schließen/Neustarten fortsetzen und große Systemschrift sowie „Bewegung reduzieren“ ausprobieren. Anschließend entscheidest du, ob das Design bleibt.
