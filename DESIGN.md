---
name: BERKK Nachtglas
description: Warm dark glass, strong numerals, and a focused training diary.
colors:
  detail-warm: "#613328"
  detail-middle: "#30202D"
  detail-base: "#19151F"
  ink: "#F4EFE9"
  ink-secondary: "rgba(244,239,233,0.68)"
  cta-ink: "#1A0E07"
  calendar-completed: "#FF7A3C"
  selected-day: "rgba(244,239,233,0.6)"
  link: "#FF8A4C"
  glass-wash: "rgba(255,247,238,0.05)"
  glass-border: "rgba(255,255,255,0.12)"
  divider: "rgba(244,239,233,0.18)"
typography:
  display:
    fontFamily: "SchibstedGrotesk_900Black"
    fontSize: "48px"
    lineHeight: "56px"
    letterSpacing: "-1.4px"
  title:
    fontFamily: "SpaceGrotesk_600SemiBold"
    fontSize: "18px"
  body:
    fontFamily: "SpaceGrotesk_400Regular"
    fontSize: "13px"
    lineHeight: "20px"
  label:
    fontFamily: "SpaceGrotesk_500Medium"
    fontSize: "13px"
rounded:
  field: "12px"
  feeling: "14px"
  save: "16px"
  home-card: "26px"
  navigation: "30px"
  calendar-sheet: "24px"
spacing:
  small: "8px"
  medium: "16px"
  page: "24px"
components:
  journal-save:
    textColor: "{colors.cta-ink}"
    rounded: "{rounded.save}"
    padding: "0 20px"
  journal-input:
    backgroundColor: "{colors.glass-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 14px"
  calendar-selected:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    size: "25px"
  recent-exercise:
    backgroundColor: "{colors.glass-wash}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.field}"
---

# Design System: BERKK Nachtglas

### Onboarding · freigegebene Browservorlage

Die neue native Route `/onboarding` übernimmt ausschließlich für die Einrichtung die freigegebene BERKK-Vorlage: Basis `#171019`, Atmosphäre `#35180F` → `#211018` → `#110C17`, Creme `#F5EFE6`, Sekundärtext `#B7A6A5`, Akzent `#FF995E`, Überschriftenakzent `#F4B48D` und helle Hauptaktion `#FFD0A2` → `#F69A66` → `#EC8067` mit dunkler Schrift `#30180E`. Weitere transparente Auswahl-/Lichtfarben stammen direkt aus der Referenz. Die Farbhinweise des mechanischen Detektors sind hier bewusst übernommene Referenzfarben. Diese Palette ersetzt keine bestehende App-Oberfläche. Implementierung, Bewegungswerte, Datenregeln, Prüfung und verbleibende Abweichungen: [ONBOARDING_NATIVE.md](ONBOARDING_NATIVE.md).

## Overview

**Creative North Star: "Nachtglas"**

BERKK uses warm orange-red light over charcoal and violet, translucent surfaces, and heavy numerical typography. This is the existing identity named in `src/constants/theme.ts`; the calendar extends it. Space Grotesk carries reading and controls, while Schibsted Grotesk gives dates and headline numbers their weight.

Der Kalender ist ein ruhiges Trainingstagebuch mit tatsächlichen Trainingstagen. Referenz (15. Oktober 2026): ein großes helles Kopfteil mit der Tages-Streak über einem fast schwarzen Monatsbereich; jeder Monat mit großer Überschrift („Okt 15“ = Monat und gewählter Tag) und eigener Wochentagszeile; Wochen aus reinen Statuspunkten ohne dauerhafte Tageszahlen; das dunkle Glasfenster für den gewählten Tag bleibt oberhalb der vier Tabs. Die „week streak“-Logik der Referenz wurde nicht übernommen. Ein frischer Kalenderbesuch zeigt den aktuellen Monat mit heute als Auswahl. Beim Scrollen bleibt der gewählte Tag erhalten; das Tagesfenster kennzeichnet ihn als „Heute“ oder „Auswahl“ und nennt das Jahr. Die bestehenden `/journal`-Abläufe öffnen Details und Planungen. Kalender und Gefühlsfiguren bleiben auf Kalender und Trainingstagebuch beschränkt; die Startseite behält ihr bestehendes Glaskartensystem.

**Key Characteristics:**
- Warm dark gradients and pale ink.
- Heavy hero numerals with compact supporting text.
- Glass home surfaces and restrained diary rows.
- Orange completion and action cues, with a pale calendar selection ring.

Evidence: `src/constants/theme.ts`, `src/constants/calendar-appearance.ts`, `src/data/calendar-layout.ts`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/plan.tsx`, and `src/components/berkk/{calendar-month,calendar-ambient,calendar-day-sheet,glass-surface,detail-sheet,bottom-tab-bar,workout-journal,feeling-picker}.tsx`. Das aktuelle Kalenderbild und die Umsetzung begründen diese Erweiterung. Der Kalender wurde im Browser sowie nativ in Expo Go auf einem Android-Emulator bei 375 × 667 und 430 × 932 geprüft. Typecheck, Lint, 17 Kalender- und 19 Workout-Tests sowie iOS-/Android-Hermes-Exporte bestanden. Ein physischer iPhone-Test und eine gemessene iPhone-Bildrate liegen nicht vor. Prüfnachweise und Grenzen: [CALENDAR.md](CALENDAR.md) und [CALENDAR_NATIVE_FIX.md](CALENDAR_NATIVE_FIX.md).

## Colors

### Primary

`link` marks actions, planned-day outlines, and selected feelings. `calendar-completed` fills completed-day dots and the small streak accent. `selected-day` is the pale border color of the calendar selection ring; the ring has a transparent center. The save action reuses `Berkk.ctaGradient`, progressing from orange through red-orange to plum; its exact stops remain in the theme.

### Neutral

`detail-warm`, `detail-middle`, and `detail-base` form the journal background. The calendar owns a near-black plum four-stop background (`#1B1219`, `#130F16`, `#120E17`, `#1A1424`) at locations 0, 0.35, 0.7, and 1. Its head is a flat warm cream surface (`#F7EBDD` → `#F1DCC6`, bottom radius 36) with dark plum ink (`#1C1218`, soft 0.56) and an orange-red accent (`#D9531F`); no glow on the head. Month titles use cream, the selected day in the title and the weekday letters use muted cream (0.38 / 0.42). Empty calendar dots use ink at 0.17 opacity. `cta-ink` provides dark text on bright fills. `glass-wash`, `glass-border`, and `divider` separate fields and rows without adding opaque cards.

Home retains its six-stop `Berkk.backgroundGradient`, ambient orange/blue/purple glows, and glass gradients. Do not replace those with the calendar's four-stop gradient.

**The Calendar State Rule.** Leere Tage: dunkler Punkt (9px). Abgeschlossen: orange gefüllt (16px). Geplant: orangefarbener Ring (16px); eine vergangene Planung ohne Abschluss bleibt sichtbar, aber gedämpft (Deckkraft 0.42). Heute: cremefarbener Punkt (12px); an einem abgeschlossenen Tag ein cremefarbener Rand um den orangen Punkt, an einem geplanten Tag ein cremefarbenes Zentrum im orangen Ring. Auswahl: unabhängiger heller Ring (36px) plus die Tageszahl in der Monatsüberschrift. Ein abgeschlossener Tag mit zusätzlicher Planung behält einen kleinen Planungsmarker. Es gibt keine eigene Ruhetag-Darstellung, weil keine Ruhetag-Daten existieren. Überlagerte Zustände und zugängliche Datums-/Statusbeschriftungen bleiben erhalten. Tagespunkte haben keine eigenen Lichtsaum- oder Animationsebenen.

## Typography

Use the loaded `BerkkFonts` faces rather than the generic starter `Fonts` stack. The black face is Schibsted Grotesk 900; body, labels, and controls use Space Grotesk 400–700. The frontmatter records observed calendar roles, not a replacement scale for all screens.

Die Kalender-Streak im Kopfteil verwendet Schibsted Grotesk Black mit tabellarischen Ziffern (88px, auf Displays unter 700 Punkten Höhe 68px; maximaler Schriftfaktor 1.1). Die Beschriftung „Tage in Folge“ ist Space Grotesk Bold (22px, kompakt 19px), der Status Medium (13px). Monatsüberschriften verwenden Schibsted Grotesk Black (36px), ein abweichendes Jahr Bold (18px), Wochentage Bold (13px). Im Raster stehen keine Tageszahlen. Im Tagesfenster sind Titel Bold (18px), Zusammenfassung Medium (12px), Datum Semibold (12px) und Status Bold (10px). Journal titles use the black face at 32px; editable fields use regular 16px text.

## Layout

Das Kopfteil reicht randlos bis unter die Statusleiste; sein Inhalt und der Monatsbereich sind zentriert und maximal 420 Punkte breit. Monate haben einen seitlichen Abstand von bis zu 24 Punkten; auf schmalen Displays sinkt er bis auf 6, damit Tagesflächen mindestens 44 Punkte breit bleiben. Jede Woche enthält genau sieben gleich breite Plätze ab Montag, einschließlich leerer Plätze am Monatsanfang und -ende. Die Tagesflächen verwenden feste Stile statt `Pressable`-Style-Funktionen: der installierte native NativeWind-Pfad verlor dort zuvor die Zellgröße. Wochen sind 50 Punkte hoch (unter 700 Punkten Displayhöhe 46), Monatsköpfe mit Luft, Titel und Wochentagszeile 110 (kompakt 100), und zwischen Monaten liegen 40 Punkte. Größere Systemschrift vergrößert nur den Monatskopf (bis Faktor 1.4 um bis zu 13.6 Punkte), weil Zellen keinen Text enthalten. Monatshöhe und Listenoffsets folgen derselben Berechnung in `calendar-layout.ts`.

Eine vertikale `FlatList` zeigt tatsächliche Monate mit zwei anfänglichen Einträgen, zwei je Renderdurchgang und Fenstergröße fünf. Zellbeschriftungen für Screenreader entstehen ohne `Intl` (`spokenDay`), weil `toLocaleDateString` je Zelle beim Nachladen von Monaten auf Hermes teuer war. Ein frischer Kalenderbesuch wählt heute und scrollt an den Anfang des aktuellen Monats; passt die Woche von heute dort nicht über das Tagesfenster, scrollt er nur so weit, bis sie sichtbar ist (`dayScrollOffset`). Die Rückkehr aus Tagesdetails bewahrt die Auswahl.

Das Tagesfenster sitzt mit 16 Punkten Seitenabstand und maximal 388 Punkten Breite über den Tabs. Der untere Abstand ist die untere Safe Area plus 86 Punkte. Eingeklappt beträgt seine Höhe `120 + max(0, min(fontScale, 1.4) - 1) * 62`. Die maximale Höhe ist `max(collapsedHeight, min(height * 0.5, pageHeight - headerHeight - bottom - 12 - 96))`; Seiten- und Kopfhöhe werden im Layout gemessen. Ein reservierter Bereich im normalen Layout entspricht der aktuellen Fensterhöhe plus unterem Abstand plus 12 Punkten. Dadurch wird die sichtbare Monatsliste beim Öffnen kleiner und bleibt oberhalb des Fensters scrollbar. Die Liste endet mit weiteren 20 Punkten Abstand. Geöffnete Details scrollen unabhängig im Fenster; Tabs und Kalender bleiben bedienbar.

Journal pages are centered at up to 640px, with 24px content padding and a fixed save footer. Keep the existing floating glass navigation: 22px side insets, 68px height, and bottom safe-area inset plus 8px.

## Elevation & Depth

Home glass combines backdrop blur, a three-stop translucent wash, a bright top edge, and a soft black shadow. Kalendertiefe entsteht durch den eigenen Hintergrundverlauf, zwei weiche Hintergrundlichter und das angedockte Tagesfenster. Das Fenster kombiniert dunkle Unschärfe (Intensität 18), einen transparenten Verlauf mit zwei Farbstufen, eine feine Kante mit hellerer Oberkante und weichen schwarzen Schatten. Sein statisches Licht (360px, Deckkraft 0.18) ist neutral violett (`#95709E`) oder bei abgeschlossenen Tagen warm orange (`#F18A53`); auch die Glasfarbe wird dann wärmer. Der `BlurTargetView` umfasst nur den Hintergrund, sodass Kalenderzahlen und Punkte nicht in die Glasfläche hineingeblurt werden. Diary entries use dividing lines. Journal fields retain a faint glass fill. Existing detail sheets dim and blur the underlying screen and use the same warm-to-violet family.

Tagespunkte und Auswahlringe bleiben statisch. Bei Auswahl oder Öffnen/Schließen zeigt das Fenster einmalig eine native Animation (180ms, Deckkraft 0.92 → 1 und Versatz 4 → 0, kubisches Ease-out); seine Höhe wechselt direkt. Die beiden statischen Hintergrund-SVGs (480px) bewegen nur ihre umgebenden Flächen über Reanimated auf dem UI-Thread, mit Wegen von 24/18 Punkten und 48 Sekunden je Richtung (96 Sekunden je Hin-und-zurück-Zyklus). Warmes Licht verwendet Deckkraft 0.07, violettes 0.09. Unschärfe wird nicht animiert. Die Bewegung pausiert ohne Fokus und im Hintergrund und endet beim Entfernen der Ansicht. „Bewegung reduzieren“ wird auch während der Nutzung beobachtet: Hintergrundlicht bleibt statisch, die kurze Fensteranimation entfällt. Keep other detail-sheet motion in its existing shared implementation.

## Shapes

Calendar status dots and selection rings are circular; the grid carries no date numerals. The calendar head has a 36px lower radius. The docked day sheet uses a 24px radius and clips its glass layers. Journal fields and recent-exercise chips use the field radius; feeling options and save buttons use their own slightly larger radii. Home cards retain their existing 22px or 26px curves, and the floating navigation retains its pill-like corners. These are distinct component roles, not one universal radius.

## Components

- **Calendar days:** each real date is a labeled button (German spoken date and status) with selected state. Keep completion, planning, missed-plan, today and selection states distinguishable without numerals. Pressing a date updates the docked preview, the day in the month title, and collapses expanded details.
- **Training streak:** the large dark number in the light head counts consecutive days with completed training sets. Planned workouts and rest days do not count or bridge gaps; programmed rest-day support is not implemented. The BERKK ghost sits at the head's right edge without a halo. Pressing the head returns to today and the current month.
- **Docked day sheet:** die Vorschau zeigt „Heute“ oder „Auswahl“, Datum mit Jahr, Status, Titel und Zusammenfassung. Antippen oder am Kopf hochziehen öffnet Details. Erneutes Antippen der Vorschau, Herunterziehen, „Schließen“ oder Android-Zurück klappt sie ein. Es gibt keinen bildschirmfüllenden Schließhintergrund; Kalender und Tabs bleiben erreichbar, und Scrollen verändert die Auswahl nicht.
- **Day entries:** within the expanded sheet, show name, duration, exercise/set counts, and optional feeling. Rows open saved `/journal` history or plan details; empty states lead directly to recording or planning. Today can start or resume a workout, record training, or plan; future dates offer planning and past dates offer recording. Use appropriate German singular and plural labels.
- **Journal save:** the shared warm CTA gradient, dark bold 17px label, minimum height 56px, and right arrow. Pressed and saving states reduce opacity to 0.65.
- **Journal fields:** faint fill, thin glass border, minimum height 52px, and visible labels. Private notes are multiline with minimum height 110px. Preserve the visible native/browser focus behavior; no custom universal focus treatment is established.
- **Recent exercises:** compact chips with minimum height 44px. Prior sets remain editable suggestions and require explicit confirmation.
- **Feeling selection:** original SVG figures for Schwach, Normal, and Stark use distinct silhouettes and faces. Options have radio semantics, a warm selected border and figure, and an optional value; tapping the selected option clears it. The 64px figures belong to this diary control; summaries use smaller variants. They are not a general BERKK mascot.
- **Navigation and glass cards:** reuse `BottomTabBar` and `GlassSurface`. Selected navigation icons use primary ink; other icons use secondary ink. Calendar rows do not need enclosing statistic cards.

## Do's and Don'ts

- Do preserve the existing Nachtglas palette and loaded Grotesk fonts.
- Do keep calendar and journal patterns scoped to their surfaces.
- Do preserve text labels, status markers, and reduced-motion behavior.
- Do show only actual completed training as completion in calendar and home.
- Don't turn the diary figures into a general mascot.
- Don't wrap each calendar day or diary entry in a statistic card.
- Don't imply that private notes are visible to other people.
- Don't treat browser captures or successful bundling as native-device verification.

### Laufendes Training · Randlicht

Ausschließlich `/workout`, testbarer Arbeitsstand vom 13. Oktober 2026, wartet auf Handyfeedback. Die angehängte dunkle Stress-Timer-Referenz bestimmt die Lichttiefe. BERKK bleibt bei orange-rotem Randlicht, sehr dunkler Arbeitsmitte, dezentem Violett und Creme. Keine fremden Stress-Bedienelemente. Details: [WORKOUT_RUNNING_DESIGN.md](WORKOUT_RUNNING_DESIGN.md); Anfängeranleitung: [WORKOUT_HANDYTEST.md](WORKOUT_HANDYTEST.md).

Links oben: Datumskapsel mit `rgba(20,16,19,0.76)` als lokaler dunkler Glasfläche, feiner Creme-Kante (0.17), Radius 24, Space Grotesk Medium 12/18. Sie zeigt das reale lokale Datum aus `useLocalDay()`/`formatDay()`. Rechts: der BERKK-Geist (`BerkkGhost`, 34) im Zustand „Fokussiert“, reale Zahl mit × aus `trainingStreak(workoutStore.history, today)`. Bei 0 steht „Keine Serie“, ohne Leuchten und ohne Serien-Gruß; die Reaktionen auf Trainingsbeginn und gespeicherte Sätze bleiben. Die strengen Regeln der bereits bestehenden täglichen Streak bleiben erhalten. Charakter, Zustände und Auslöser: [BERKK_GEIST.md](BERKK_GEIST.md).

Der Timer steht frei im oberen Bereich: Schibsted Grotesk Black, Creme, tabellarische Ziffern, bis 112 ohne Übungen und 40 mit Übungen. Zeichenanzahl, Doppelpunkte, sichere Breitenreserve und Schriftfaktor bis 1.2 bestimmen die Größe; auch Stundenanzeigen passen auf 320 Breite. Die sichtbaren Texte „Trainingszeit“ und „Füge deine erste Übung hinzu“ entfallen. Die Uhr liegt außerhalb der ScrollView und bleibt sichtbar; nur ihre eigene Komponente tickt. Tatsächliche Übungen und Sätze behalten ihre bestehenden Felder und Speicherabläufe.

Vier asymmetrische statische Randflächen und drei bewegte warme radiale Lichttexturen geben dem Hintergrund Tiefe. Die Texturen umlaufen den abgerundeten Rand unabhängig in 38, 53 und 67 Sekunden und ändern ihre Deckkraft leicht. Ein statischer, sehr schwacher violetter Bereich und eine feste dunkle Mittenmaske halten Inhalte lesbar. Nur begrenzte Elternflächen bewegen sich per Reanimated auf dem nativen UI-Thread; keine pixelweise Animation und kein Blur pro Frame. Der frische Start nutzt den vorhandenen 1100-ms-Takt für einen kräftigeren Randumlauf und versetzt Datum, Timer und Streak um 100/180/260 ms. Fortsetzen und Reload wiederholen die Einführung nicht.

Die Hauptaktion ist eine dunkel beleuchtete Oberfläche (`#54251C`, `#291714`, `#1A1213`, vertikal), keine Orange-Violett-Leiste. Warme Kante (Orange 0.6), separater Plusbereich, Creme-Text, mindestens 70 Höhe, Radius 20. Ein äußeres warmes Licht und innerer Lichtfleck bewegen sich über 7,3 Sekunden je Richtung; Drücken setzt unmittelbar eine 70-ms-Skalierung auf 0.975 und einen kurzen Lichtimpuls ein. Die Übungsauswahl öffnet ohne Wartezeit. Der Geist atmet unabhängig davon ruhig (2,6 Sekunden je Richtung) und blinzelt etwa alle 6 Sekunden. „Training beenden“ hat 48 Tipp-Höhe und 20 Abstand zur Hauptaktion; die untere Safe Area (mindestens 12) erhält zusätzlich 20 Luft.

Kopf, Timer und Footer liegen im normalen Fluss; maximal 600 Inhaltsbreite und 24 Seitenabstand. Die leere Mitte erzwingt keine Mindesthöhe. Bestehende KeyboardAvoidingView-/Footer-Logik hält Eingaben und Hinzufügen erreichbar. Eine getrennte, geclippte Hintergrundebene fängt keine Berührungen ab. Dauerbewegung pausiert ohne Fokus und in inaktiver App. Reduced Motion entfernt Umlauf, Schweben, Skalierung und Versatz; statisches Licht und kurze Deckkraft-Rückmeldung bleiben.

Nach erfolgreichem `flush()` derselben Sitzung und des unveränderten bestätigten Satzes bleibt das vorhandene lokale „Gespeichert“-Feedback erhalten: 1,1 Sekunden Text, 180-ms-Setzen, einmaliger 640-ms-Lichtstreifen. Fehler und zwischenzeitliche Korrekturen lösen kein Erfolgsfeedback aus. Reduced Motion behält nur den Text. Der gelesene Stand enthält keine PR-Erkennung oder Adrenalin-Animation; diese Änderung ergänzt keine neue Workout-Funktion.

Geprüft: Typecheck, Lint, 19 Workout- und 17 Kalender-Tests, iOS-/Android-Hermes-Exporte und isolierter Browserlauf einschließlich Streak 0/10, Eingaben, Speichern, Reload, Stundenanzeige, langer Liste, Reduced Motion und Fortsetzen. Browsergrößen: 320 × 568, 375 × 667, 390 × 844 und 1280 × 900. Keine Seitenfehler. Physisches Handy war nicht verbunden; native Tastatur, echte Safe Areas und Bildrate bleiben für die Handyabnahme offen. Aktuelle Aufnahmen und Grenzen stehen im Screen-Dokument; historische Screenshots sind keine Referenz für diesen Stand.
