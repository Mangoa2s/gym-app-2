# BERKK – eigene Übungsillustrationen

**Geprüfte Abdeckung: 117/117 Katalogübungen; 0 fehlende Zuordnungen.** Eigene Nutzerübungen sind davon ausgenommen und zeigen einen ehrlichen Text statt einer geratenen Pose.

Alle 117 Motive wurden mit dem eingebauten `image_gen`-Werkzeug aus eigenen schriftlichen Positionsbeschreibungen erzeugt. Es wurden keine Hevy-Illustrationen, Fotos oder fremden Bildsammlungen übernommen. Das erste Bankdrückmotiv wurde mit demselben Werkzeug auf dunkle Kleidung korrigiert. Jede endgültige PNG-Datei liegt in diesem Ordner; die App benötigt keine Bild-URL. `manifest.json` enthält für jede ID den tatsächlichen Auftrag, die entscheidende Position, die Datei und den Prüfstatus.

Die Motive wurden einzeln auf dunklem Hintergrund in Kontaktbögen geprüft; Flach-/Schräg-/Negativbank, freie Hanteln, Kabelzüge und Maschinen haben getrennte Darstellungen. Sie helfen beim Erkennen der Übung; eine einzelne Position erklärt keinen vollständigen Bewegungsablauf.

Die Bildzuordnung steht in `src/data/exercise-illustrations.ts`. Der unveränderte Katalog steht in `src/data/exercises.ts`. Der lokale Abdeckungstest ist `node --test scripts/exercise-library.test.mjs`.

Die transparenten PNG-Originale benötigen zusammen **77,3 MiB**. Das ist ein lokaler Designentwurf. Auf dem Handy sind Erkennbarkeit in der kleinen Listenansicht, erstes Laden und schnelles Scrollen noch zu beurteilen; native Bündelprüfung ist kein FPS-Test. Es gibt keine dauernden Bildanimationen.

## Tatsächliche Zuordnung

| Katalog-ID | Übung | Lokale Illustration |
| --- | --- | --- |
| `barbell-bench` | Langhantel-Bankdrücken | [barbell-bench.png](barbell-bench.png) |
| `dumbbell-bench` | Kurzhantel-Bankdrücken | [dumbbell-bench.png](dumbbell-bench.png) |
| `barbell-incline` | Langhantel-Schrägbankdrücken | [barbell-incline.png](barbell-incline.png) |
| `dumbbell-incline` | Kurzhantel-Schrägbankdrücken | [dumbbell-incline.png](dumbbell-incline.png) |
| `barbell-decline` | Langhantel-Negativbankdrücken | [barbell-decline.png](barbell-decline.png) |
| `chest-press` | Brustpresse | [chest-press.png](chest-press.png) |
| `pec-deck` | Butterfly-Maschine | [pec-deck.png](pec-deck.png) |
| `cable-fly` | Kabelzug-Fliegende | [cable-fly.png](cable-fly.png) |
| `dumbbell-fly` | Kurzhantel-Fliegende | [dumbbell-fly.png](dumbbell-fly.png) |
| `push-up` | Liegestütze | [push-up.png](push-up.png) |
| `incline-push-up` | Erhöhte Liegestütze | [incline-push-up.png](incline-push-up.png) |
| `dip` | Dips | [dip.png](dip.png) |
| `assisted-dip` | Dips mit Unterstützung | [assisted-dip.png](assisted-dip.png) |
| `lat-pulldown` | Latzug, breiter Griff | [lat-pulldown.png](lat-pulldown.png) |
| `close-lat-pulldown` | Latzug, enger Griff | [close-lat-pulldown.png](close-lat-pulldown.png) |
| `barbell-row` | Langhantelrudern | [barbell-row.png](barbell-row.png) |
| `dumbbell-row` | Einarmiges Kurzhantelrudern | [dumbbell-row.png](dumbbell-row.png) |
| `cable-row` | Sitzendes Kabelrudern | [cable-row.png](cable-row.png) |
| `machine-row` | Rudermaschine (Kraft) | [machine-row.png](machine-row.png) |
| `chest-supported-row` | Brustgestütztes Kurzhantelrudern | [chest-supported-row.png](chest-supported-row.png) |
| `t-bar-row` | T-Bar-Rudern | [t-bar-row.png](t-bar-row.png) |
| `pull-up` | Klimmzüge, Obergriff | [pull-up.png](pull-up.png) |
| `chin-up` | Klimmzüge, Untergriff | [chin-up.png](chin-up.png) |
| `assisted-pull-up` | Klimmzüge mit Unterstützung | [assisted-pull-up.png](assisted-pull-up.png) |
| `inverted-row` | Umgekehrtes Rudern | [inverted-row.png](inverted-row.png) |
| `straight-arm-pulldown` | Kabelzug-Pullover | [straight-arm-pulldown.png](straight-arm-pulldown.png) |
| `back-extension` | Rückenstrecken | [back-extension.png](back-extension.png) |
| `band-row` | Rudern mit Widerstandsband | [band-row.png](band-row.png) |
| `overhead-press` | Langhantel-Schulterdrücken | [overhead-press.png](overhead-press.png) |
| `dumbbell-shoulder-press` | Kurzhantel-Schulterdrücken | [dumbbell-shoulder-press.png](dumbbell-shoulder-press.png) |
| `machine-shoulder-press` | Schulterpresse | [machine-shoulder-press.png](machine-shoulder-press.png) |
| `arnold-press` | Arnold-Press | [arnold-press.png](arnold-press.png) |
| `lateral-raise` | Kurzhantel-Seitheben | [lateral-raise.png](lateral-raise.png) |
| `cable-lateral-raise` | Kabelzug-Seitheben | [cable-lateral-raise.png](cable-lateral-raise.png) |
| `front-raise` | Kurzhantel-Frontheben | [front-raise.png](front-raise.png) |
| `reverse-fly` | Kurzhantel-Reverse-Flys | [reverse-fly.png](reverse-fly.png) |
| `reverse-pec-deck` | Butterfly Reverse | [reverse-pec-deck.png](reverse-pec-deck.png) |
| `face-pull` | Face Pulls | [face-pull.png](face-pull.png) |
| `band-pull-apart` | Band auseinanderziehen | [band-pull-apart.png](band-pull-apart.png) |
| `shrug` | Kurzhantel-Shrugs | [shrug.png](shrug.png) |
| `barbell-curl` | Langhantel-Bizepscurls | [barbell-curl.png](barbell-curl.png) |
| `ez-curl` | SZ-Curls | [ez-curl.png](ez-curl.png) |
| `dumbbell-curl` | Kurzhantel-Bizepscurls | [dumbbell-curl.png](dumbbell-curl.png) |
| `hammer-curl` | Hammercurls | [hammer-curl.png](hammer-curl.png) |
| `incline-curl` | Schrägbank-Curls | [incline-curl.png](incline-curl.png) |
| `preacher-curl` | Scott-Curls | [preacher-curl.png](preacher-curl.png) |
| `cable-curl` | Kabelzug-Bizepscurls | [cable-curl.png](cable-curl.png) |
| `concentration-curl` | Konzentrationscurls | [concentration-curl.png](concentration-curl.png) |
| `triceps-pushdown` | Trizepsdrücken am Kabel | [triceps-pushdown.png](triceps-pushdown.png) |
| `overhead-triceps` | Überkopf-Trizepsstrecken am Kabel | [overhead-triceps.png](overhead-triceps.png) |
| `dumbbell-triceps` | Kurzhantel-Trizepsstrecken | [dumbbell-triceps.png](dumbbell-triceps.png) |
| `skull-crusher` | Liegendes SZ-Trizepsstrecken | [skull-crusher.png](skull-crusher.png) |
| `close-bench` | Enges Langhantel-Bankdrücken | [close-bench.png](close-bench.png) |
| `triceps-kickback` | Trizeps-Kickbacks | [triceps-kickback.png](triceps-kickback.png) |
| `diamond-push-up` | Diamant-Liegestütze | [diamond-push-up.png](diamond-push-up.png) |
| `wrist-curl` | Handgelenkcurls | [wrist-curl.png](wrist-curl.png) |
| `reverse-wrist-curl` | Umgekehrte Handgelenkcurls | [reverse-wrist-curl.png](reverse-wrist-curl.png) |
| `reverse-curl` | Reverse Curls | [reverse-curl.png](reverse-curl.png) |
| `dead-hang` | Hängen an der Stange | [dead-hang.png](dead-hang.png) |
| `farmer-hold` | Farmer Hold | [farmer-hold.png](farmer-hold.png) |
| `back-squat` | Langhantel-Kniebeugen | [back-squat.png](back-squat.png) |
| `front-squat` | Frontkniebeugen | [front-squat.png](front-squat.png) |
| `goblet-squat` | Goblet Squats | [goblet-squat.png](goblet-squat.png) |
| `bodyweight-squat` | Kniebeugen ohne Gewicht | [bodyweight-squat.png](bodyweight-squat.png) |
| `leg-press` | Beinpresse | [leg-press.png](leg-press.png) |
| `hack-squat` | Hackenschmidt-Kniebeugen | [hack-squat.png](hack-squat.png) |
| `leg-extension` | Beinstrecker | [leg-extension.png](leg-extension.png) |
| `bulgarian-squat` | Bulgarische Kurzhantel-Split-Squats | [bulgarian-squat.png](bulgarian-squat.png) |
| `dumbbell-lunge` | Kurzhantel-Ausfallschritte | [dumbbell-lunge.png](dumbbell-lunge.png) |
| `bodyweight-lunge` | Ausfallschritte ohne Gewicht | [bodyweight-lunge.png](bodyweight-lunge.png) |
| `step-up` | Kurzhantel-Step-ups | [step-up.png](step-up.png) |
| `wall-sit` | Wandsitzen | [wall-sit.png](wall-sit.png) |
| `deadlift` | Klassisches Kreuzheben | [deadlift.png](deadlift.png) |
| `romanian-deadlift` | Rumänisches Kreuzheben | [romanian-deadlift.png](romanian-deadlift.png) |
| `dumbbell-rdl` | Rumänisches Kurzhantel-Kreuzheben | [dumbbell-rdl.png](dumbbell-rdl.png) |
| `sumo-deadlift` | Sumo-Kreuzheben | [sumo-deadlift.png](sumo-deadlift.png) |
| `lying-leg-curl` | Beinbeuger, liegend | [lying-leg-curl.png](lying-leg-curl.png) |
| `seated-leg-curl` | Beinbeuger, sitzend | [seated-leg-curl.png](seated-leg-curl.png) |
| `good-morning` | Good Mornings | [good-morning.png](good-morning.png) |
| `nordic-curl` | Nordic Curls | [nordic-curl.png](nordic-curl.png) |
| `hip-thrust` | Langhantel-Hip-Thrusts | [hip-thrust.png](hip-thrust.png) |
| `machine-hip-thrust` | Hip-Thrust-Maschine | [machine-hip-thrust.png](machine-hip-thrust.png) |
| `glute-bridge` | Beckenheben | [glute-bridge.png](glute-bridge.png) |
| `cable-kickback` | Kabelzug-Glute-Kickbacks | [cable-kickback.png](cable-kickback.png) |
| `abduction` | Abduktorenmaschine | [abduction.png](abduction.png) |
| `adduction` | Adduktorenmaschine | [adduction.png](adduction.png) |
| `band-lateral-walk` | Seitliche Schritte mit Band | [band-lateral-walk.png](band-lateral-walk.png) |
| `standing-calf` | Wadenheben, stehend an der Maschine | [standing-calf.png](standing-calf.png) |
| `seated-calf` | Wadenheben, sitzend | [seated-calf.png](seated-calf.png) |
| `bodyweight-calf` | Wadenheben ohne Gewicht | [bodyweight-calf.png](bodyweight-calf.png) |
| `dumbbell-calf` | Kurzhantel-Wadenheben | [dumbbell-calf.png](dumbbell-calf.png) |
| `crunch` | Crunches | [crunch.png](crunch.png) |
| `sit-up` | Sit-ups | [sit-up.png](sit-up.png) |
| `cable-crunch` | Kabel-Crunches | [cable-crunch.png](cable-crunch.png) |
| `hanging-leg-raise` | Hängendes Beinheben | [hanging-leg-raise.png](hanging-leg-raise.png) |
| `reverse-crunch` | Reverse Crunches | [reverse-crunch.png](reverse-crunch.png) |
| `ab-wheel` | Bauchroller | [ab-wheel.png](ab-wheel.png) |
| `plank` | Unterarmstütz | [plank.png](plank.png) |
| `side-plank` | Seitstütz | [side-plank.png](side-plank.png) |
| `hollow-hold` | Hollow Hold | [hollow-hold.png](hollow-hold.png) |
| `dead-bug` | Dead Bug | [dead-bug.png](dead-bug.png) |
| `pallof-press` | Pallof Press | [pallof-press.png](pallof-press.png) |
| `russian-twist` | Russian Twists | [russian-twist.png](russian-twist.png) |
| `kettlebell-swing` | Kettlebell-Swings | [kettlebell-swing.png](kettlebell-swing.png) |
| `thruster` | Kurzhantel-Thruster | [thruster.png](thruster.png) |
| `clean-press` | Langhantel-Umsetzen und Drücken | [clean-press.png](clean-press.png) |
| `burpee` | Burpees | [burpee.png](burpee.png) |
| `mountain-climber` | Mountain Climbers | [mountain-climber.png](mountain-climber.png) |
| `treadmill` | Laufband | [treadmill.png](treadmill.png) |
| `outdoor-run` | Laufen im Freien | [outdoor-run.png](outdoor-run.png) |
| `walking` | Gehen | [walking.png](walking.png) |
| `bike` | Fahrradergometer | [bike.png](bike.png) |
| `elliptical` | Crosstrainer | [elliptical.png](elliptical.png) |
| `rowing` | Ruderergometer | [rowing.png](rowing.png) |
| `stair-climber` | Treppensteiger | [stair-climber.png](stair-climber.png) |
| `air-bike` | Air Bike | [air-bike.png](air-bike.png) |
| `ski-erg` | Ski-Ergometer | [ski-erg.png](ski-erg.png) |

