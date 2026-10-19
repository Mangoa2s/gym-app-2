# Kalender-Reparatur: Anleitung zum iPhone-Test

Projektordner: `C:\Users\aslan\Desktop\Programming learning own projects\gymtry2\gymapp`.

Die Version ist lokal testbar. Es wurde nichts committet oder gemergt. Workout-Daten, AsyncStorage, Streak-Berechnung, Tabs und Routen bleiben unverändert.

## 1. Was war falsch?

Die Tageszellen verwendeten eine Funktion als `Pressable.style`, die unter anderem die Breite `14.285714%` und die Höhe zurückgab. Die installierte NativeWind-/CSS-Interop-Verarbeitung wertet diese Funktion auf dem nativen Gerät nicht aus: Beim Zusammenführen der Styles geht sie verloren. Damit fehlte den antippbaren Tagen ihre Größe. Sie schrumpften auf die Breite ihres kleinen Inhalts; ungefähr 13 davon passten nebeneinander. Die Platzhalter verwendeten dagegen normale Styles und behielten ihre Breite. Das erklärt die unterschiedlich zusammengedrückten Reihen im Screenshot. Im Browser funktioniert dieser Style-Pfad anders; die frühere Browserprüfung hatte den nativen Fehler nicht entdeckt.

Jetzt besteht jede Woche ausdrücklich aus sieben gleich großen Feldern, einschließlich leerer Platzhalter. Die Zellen verwenden normale Style-Objekte statt einer Style-Funktion. Wochentagskopf und Raster teilen denselben seitlichen Abstand. Bei 375 Punkten Bildschirmbreite ist jedes Feld etwa 46,7 Punkte breit und 52 Punkte hoch; der ganze Bereich lässt sich antippen. Tageszahlen sind 12 statt 10 Punkte groß.

## 2. Welche Dateien wurden geändert?

| Datei | Aufgabe |
| --- | --- |
| `src/app/(tabs)/plan.tsx` | Kalenderseite, Auswahl, anfänglicher Sprung zum aktuellen Monat, Monatsliste und Platz über Sheet/Tab-Bar. |
| `src/components/berkk/calendar-month.tsx` — neu | Monatsüberschrift und explizite Wochen mit sieben Feldern; größere Punkte/Zahlen und wiederverwendbare, memoierte Zellen. |
| `src/data/calendar-layout.ts` — neu | Kalenderwochen sowie genaue Höhen und Scrollpositionen für jeden Monat. Berücksichtigt vier, fünf oder sechs Wochen und die Schriftvergrößerung. |
| `src/components/berkk/calendar-day-sheet.tsx` | Tagesfenster, eindeutige Datumsbeschriftung, kurze Animation, Glasfläche, Schließgeste und Details. |
| `src/components/berkk/calendar-ambient.tsx` — neu | Zwei langsam bewegte Hintergrundlichter und Reduced-Motion-/Sichtbarkeitssteuerung. |
| `src/constants/calendar-appearance.ts` | Kalenderfarben, Größen, Lichtstärke, Bewegungsweite und Glas-Regler. |
| `scripts/calendar.test.mjs` | Vier zusätzliche Prüfungen für sieben Felder, Monatshöhen, antippbare Breiten und die konkrete native Style-Ursache. |
| `CALENDAR.md`, `DESIGN.md`, `CALENDAR_NATIVE_FIX.md` | Aktualisierte Beschreibung und diese Testanleitung. |

`src/data/calendar.ts` und die Store-Dateien wurden bei dieser Reparatur nicht geändert. Orange Punkte und Streak kommen weiterhin aus echten abgeschlossenen Workouts mit bestätigten Sätzen; Umrisse aus gespeicherten Plänen. Leere Tage werden nicht zu erfundenen Ruhetagen.

## 3. Datum und Platz für den Kalender

Ein neuer Besuch des Kalender-Tabs wählt heute anhand des lokalen Gerätedatums aus und zeigt den aktuellen Monat. Beim Zurückkommen aus Workout-Details oder Planung bleibt der vorher ausgewählte Tag erhalten.

Scrollen allein ändert die Auswahl nicht. Deshalb darf unten ein Oktober-Tag stehen, während du Dezember anschaust. Die Beschriftung sagt jetzt ausdrücklich `Heute` oder `Auswahl` und zeigt auch das Jahr. Tippe oben auf die Streak-Zeile, um wieder zu heute und zum aktuellen Monat zu gelangen.

Die Monatsliste endet jetzt oberhalb des Tagesfensters. Für Sheet, Tab-Bar, unteren sicheren Abstand und einen zusätzlichen Spalt wird tatsächlich Platz reserviert. Zusätzlich gibt es 20 Punkte Scroll-Padding für die letzten Tage. Beim Öffnen wird das Sheet höher und die Kalenderfläche entsprechend kleiner; der sichtbare Kalender bleibt scrollbar. Schließen, Antippen des Sheet-Kopfes oder Herunterziehen klappt es ein. Die Details im Sheet haben ihren eigenen Scrollbereich.

## 4. Was verursachte die Scroll-Probleme?

Der eindeutig nachgewiesene Größenfehler machte auch die bisherigen Scrollinformationen falsch: Die Liste rechnete mit sieben Spalten und wesentlich höheren Monaten, während die nativen Monate auf ungefähr 13 Spalten zusammengedrückt wurden. Dadurch passten anfängliche Sprungposition und Virtualisierung nicht zur tatsächlichen Oberfläche.

Außerdem enthielt der alte Kalender unnötige animierte Tages-Views und einzelne Licht-SVGs. Das Blur-Ziel schloss die scrollenden Inhalte ein. Diese Kosten sind jetzt entfernt: normale Tages-Views, keine Tages-Glows, Blur ausschließlich des separaten Hintergrunds und memoierte Monate/Zellen. Auswahländerungen betreffen vor allem den alten und den neuen ausgewählten Monat. Monatsschlüssel und Layoutdaten sind stabil.

Die Monatsliste war bereits virtualisiert. Die vorhandenen Einstellungen bleiben erhalten: drei anfängliche Monate, höchstens vier pro Render-Schritt und ein Fenster von fünf Bildschirmhöhen. `getItemLayout` verwendet nun die tatsächliche Wochenzahl und dieselben Maße wie die dargestellten Monate. Es gab keine React-State-Aktualisierung bei jedem Scroll-Schritt; daran wurde nichts vermeintlich optimiert.

Damit sind konkrete Code-Ursachen behoben. Eine gemessene Bildrate auf einem echten iPhone liegt noch nicht vor.

## 5. Wie funktioniert die Bewegung?

`calendar-ambient.tsx` zeichnet zwei weiche SVG-Lichtflächen einmal als Hintergrundelemente. Reanimated bewegt nur ihre Container auf dem UI-Thread. Es werden weder Tageszellen noch ein Blur-Filter pro Animationsbild berechnet. Die Deckkraft bleibt ruhig; die Position driftet sehr langsam hin und zurück. Eine Strecke dauert 48 Sekunden, hin und zurück ungefähr 96 Sekunden.

Bei einem anderen Tab, einer App im Hintergrund oder beim Entfernen des Screens wird die Animation gestoppt. Die Systemeinstellung für reduzierte Bewegung wird beim Start und bei Änderungen berücksichtigt; dann bleiben die Lichter statisch. Das Tagesfenster verwendet separat eine einmalige 180-ms-Animation für Deckkraft und vier Punkte Verschiebung. Seine Höhe wird nicht in jedem Animationsbild neu berechnet.

Zum Anpassen öffnest du `src/constants/calendar-appearance.ts`:

| Wert | Änderung |
| --- | --- |
| `ambient.warmOpacity` / `violetOpacity` | Aktuell 0,10 / 0,09. Zum Beispiel 0,07 / 0,06 für schwächeres Licht. |
| `ambient.driftX` / `driftY` | Aktuell 24 / 18 Punkte. Kleinere Werte bewegen das Licht weniger weit. |
| `ambient.halfCycleMs` | Aktuell 48000. Größer bedeutet langsamer. |
| `sheet.blurIntensity` | Aktuell 18. Nur bei Bedarf ändern; beeinflusst das Glas. |
| `sheet.wash` / `warmWash` | Die letzte Zahl jedes `rgba(...)`-Werts ist die Deckkraft der dunklen Fläche. Höher macht sie dichter, niedriger transparenter. |
| `sheet.topEdge` / `border` | Helligkeit der oberen Kante und des Randes. |
| `sheet.glowOpacity` | Aktuell 0,18. Zum Beispiel 0,12 schwächt das Licht hinter dem Sheet. |

Ändere jeweils nur einen Wert, speichere und lade dieselbe App-Verbindung neu.

## 6. Was wurde geprüft?

- 17 Kalender- und 19 Workout-Tests bestanden; TypeScript und Lint bestanden.
- iOS- und Android-Hermes-Bundles erfolgreich exportiert.
- Browser bei 375 und 430 Punkten: sieben Spalten, sechs Wochen im März 2026, Mittwoch-Start im Juli 2026, Auswahl und bestehende Planungsroute.
- Native Expo-Go-Vorschau im Android-Emulator bei 375 × 667 und 430 × 932 Punkten: Raster, Sheet-Abstand, Scrollen mit geöffnetem und eingeklapptem Sheet, Zukunftsplanung und Rückkehr zur Auswahl.
- Native Hintergrundbewegung, Scrollen bei laufender Bewegung und Abschalten über reduzierte Bewegung geprüft; keine React-Native-/Android-Runtime-Fehler in den dabei erfassten Logs.
- Bilder liegen in `.playwright-mcp/calendar-native-375.png`, `calendar-native-open-375.png`, `calendar-native-430.png` und `calendar-native-live-scroll-430.png`; Bewegungsaufnahme: `.playwright-mcp/calendar-native-motion.mp4`.

Ein physisches iPhone war nicht verbunden. Der Android-Emulator und Browser ersetzen deine Beurteilung von iPhone-Scrollleistung und Glaswirkung nicht.

## 7. So prüfst du es auf deinem iPhone

1. Öffne deine bisherige BERKK-Verbindung in Expo Go und lade sie neu. Lass die App und ihren Speicher installiert. Falls der Entwicklungsserver nicht läuft: Terminal im oben genannten Projektordner öffnen und `npx expo start` ausführen; anschließend den QR-Code verwenden.
2. Öffne den Kalender-Tab. Prüfe: aktueller Monat sichtbar, heute ausgewählt, unten `Heute` mit dem richtigen lokalen Datum. Tippe später auf die Streak-Zeile, um wieder dorthin zu springen.
3. Scrolle zu Juli 2026: Zwei leere Felder vor dem 1., der unter Mittwoch steht. März 2026 hat sechs vollständige Kalenderwochen. Jede Zeile und der Kopf müssen sieben gleich breite Spalten haben.
4. Tippe einen vergangenen Tag an, öffne das Tagesfenster und öffne ein vorhandenes Workout. Gehe zurück: Die Auswahl muss erhalten bleiben. Tippe einen zukünftigen Tag an und öffne die bestehende Planung. Für diese Prüfung musst du keinen neuen Plan speichern.
5. Scrolle mehrere Monate mit eingeklapptem und danach mit geöffnetem Sheet. Prüfe die letzten Tageszahlen, Abstand zur Tab-Bar und Schließen durch Herunterziehen. Beim Scrollen soll das ausgewählte Datum absichtlich stehen bleiben und als `Auswahl` erkennbar sein.
6. Beobachte den Hintergrund 20–30 Sekunden ohne Tippen und scrolle dann erneut. Das Licht soll kaum merklich wandern; Zahlen und Eingaben sollen ruhig bleiben. Wechsle zu einem anderen Tab und zurück.
7. Aktiviere am iPhone `Einstellungen → Bedienungshilfen → Bewegung → Bewegung reduzieren`. Die Lichtflächen müssen jetzt statisch sein. Deaktiviere die Einstellung wieder und prüfe, ob die Bewegung zurückkommt.

Beurteile danach zuerst Lesbarkeit, Scrollgefühl, Sheet-Größe und Lichtwirkung auf deinem Handy. Weitere Designbereiche werden bis zu deinem Urteil nicht überarbeitet.
