export const MUSCLE_GROUPS = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Unterarme', 'Quadrizeps', 'Hintere Oberschenkel', 'Gesäß', 'Waden', 'Bauch/Core', 'Ganzkörper', 'Cardio'] as const;
export const EQUIPMENT = ['Langhantel', 'Kurzhantel', 'Kabelzug', 'Maschine', 'Körpergewicht', 'Kettlebell', 'Widerstandsband', 'Cardiogerät'] as const;
export const TRACKING_TYPES = {
  strength: 'Kraft · kg & Wiederholungen',
  bodyweight: 'Körpergewicht · Wiederholungen',
  assisted: 'Unterstützt · Hilfe in kg & Wiederholungen',
  hold: 'Halten · Dauer in Sekunden',
  cardio: 'Cardio · Dauer & Distanz',
} as const;
export type MuscleGroup = typeof MUSCLE_GROUPS[number];
export type Equipment = typeof EQUIPMENT[number];
export type TrackingType = keyof typeof TRACKING_TYPES;
export type Exercise = {
  id: string; name: string; englishName: string; aliases: string[];
  muscle: MuscleGroup; secondaryMuscles: MuscleGroup[]; equipment: Equipment; tracking: TrackingType;
  custom?: boolean;
};

// Stable IDs identify movements; alternate names belong in aliases, never duplicate rows.
type Definition = [id: string, name: string, englishName: string, muscle: MuscleGroup, equipment: Equipment, tracking: TrackingType, aliases?: string, secondary?: MuscleGroup[]];
const definitions: Definition[] = [
  ['barbell-bench', 'Langhantel-Bankdrücken', 'Barbell bench press', 'Brust', 'Langhantel', 'strength', 'bankdrücken benchpress flachbank', ['Trizeps', 'Schultern']],
  ['dumbbell-bench', 'Kurzhantel-Bankdrücken', 'Dumbbell bench press', 'Brust', 'Kurzhantel', 'strength', 'kh bankdrücken', ['Trizeps', 'Schultern']],
  ['barbell-incline', 'Langhantel-Schrägbankdrücken', 'Incline barbell bench press', 'Brust', 'Langhantel', 'strength', 'schrägbank obere brust', ['Schultern', 'Trizeps']],
  ['dumbbell-incline', 'Kurzhantel-Schrägbankdrücken', 'Incline dumbbell bench press', 'Brust', 'Kurzhantel', 'strength', 'kh schrägbank', ['Schultern', 'Trizeps']],
  ['barbell-decline', 'Langhantel-Negativbankdrücken', 'Decline bench press', 'Brust', 'Langhantel', 'strength', 'negativbank', ['Trizeps']],
  ['chest-press', 'Brustpresse', 'Machine chest press', 'Brust', 'Maschine', 'strength', 'chestpress', ['Trizeps']],
  ['pec-deck', 'Butterfly-Maschine', 'Pec deck fly', 'Brust', 'Maschine', 'strength', 'butterfly brust flys'],
  ['cable-fly', 'Kabelzug-Fliegende', 'Cable chest fly', 'Brust', 'Kabelzug', 'strength', 'crossover cable cross fliegende'],
  ['dumbbell-fly', 'Kurzhantel-Fliegende', 'Dumbbell fly', 'Brust', 'Kurzhantel', 'strength', 'flys fliegende'],
  ['push-up', 'Liegestütze', 'Push-up', 'Brust', 'Körpergewicht', 'bodyweight', 'pushup push ups', ['Trizeps', 'Bauch/Core']],
  ['incline-push-up', 'Erhöhte Liegestütze', 'Incline push-up', 'Brust', 'Körpergewicht', 'bodyweight', 'hände erhöht', ['Trizeps']],
  ['dip', 'Dips', 'Parallel bar dip', 'Brust', 'Körpergewicht', 'bodyweight', 'barren brustdips', ['Trizeps']],
  ['assisted-dip', 'Dips mit Unterstützung', 'Assisted dip', 'Brust', 'Maschine', 'assisted', 'unterstützte dips dipmaschine', ['Trizeps']],
  ['lat-pulldown', 'Latzug, breiter Griff', 'Wide grip lat pulldown', 'Rücken', 'Kabelzug', 'strength', 'latziehen lat pull down'],
  ['close-lat-pulldown', 'Latzug, enger Griff', 'Close grip lat pulldown', 'Rücken', 'Kabelzug', 'strength', 'neutralgriff latziehen'],
  ['barbell-row', 'Langhantelrudern', 'Bent over barbell row', 'Rücken', 'Langhantel', 'strength', 'rudern vorgebeugt', ['Bizeps']],
  ['dumbbell-row', 'Einarmiges Kurzhantelrudern', 'Single arm dumbbell row', 'Rücken', 'Kurzhantel', 'strength', 'kh rudern', ['Bizeps']],
  ['cable-row', 'Sitzendes Kabelrudern', 'Seated cable row', 'Rücken', 'Kabelzug', 'strength', 'rudern kabelzug', ['Bizeps']],
  ['machine-row', 'Rudermaschine (Kraft)', 'Machine row', 'Rücken', 'Maschine', 'strength', 'rückenmaschine', ['Bizeps']],
  ['chest-supported-row', 'Brustgestütztes Kurzhantelrudern', 'Chest supported dumbbell row', 'Rücken', 'Kurzhantel', 'strength', 'schrägbank rudern', ['Bizeps']],
  ['t-bar-row', 'T-Bar-Rudern', 'T-bar row', 'Rücken', 'Maschine', 'strength', 'tbar rudern', ['Bizeps']],
  ['pull-up', 'Klimmzüge, Obergriff', 'Pull-up', 'Rücken', 'Körpergewicht', 'bodyweight', 'pullup pull ups klimmzug', ['Bizeps']],
  ['chin-up', 'Klimmzüge, Untergriff', 'Chin-up', 'Rücken', 'Körpergewicht', 'bodyweight', 'chinup chin ups klimmzug', ['Bizeps']],
  ['assisted-pull-up', 'Klimmzüge mit Unterstützung', 'Assisted pull-up', 'Rücken', 'Maschine', 'assisted', 'unterstützter klimmzug gravitron', ['Bizeps']],
  ['inverted-row', 'Umgekehrtes Rudern', 'Inverted row', 'Rücken', 'Körpergewicht', 'bodyweight', 'australian pull ups', ['Bizeps']],
  ['straight-arm-pulldown', 'Kabelzug-Pullover', 'Straight arm pulldown', 'Rücken', 'Kabelzug', 'strength', 'überzüge gestreckte arme'],
  ['back-extension', 'Rückenstrecken', 'Back extension', 'Rücken', 'Körpergewicht', 'bodyweight', 'hyperextension hyperextensions', ['Gesäß', 'Hintere Oberschenkel']],
  ['band-row', 'Rudern mit Widerstandsband', 'Resistance band row', 'Rücken', 'Widerstandsband', 'bodyweight', 'bandrudern'],
  ['overhead-press', 'Langhantel-Schulterdrücken', 'Barbell overhead press', 'Schultern', 'Langhantel', 'strength', 'ohp military press', ['Trizeps']],
  ['dumbbell-shoulder-press', 'Kurzhantel-Schulterdrücken', 'Dumbbell shoulder press', 'Schultern', 'Kurzhantel', 'strength', 'kh schulterpresse', ['Trizeps']],
  ['machine-shoulder-press', 'Schulterpresse', 'Machine shoulder press', 'Schultern', 'Maschine', 'strength', 'schultermaschine', ['Trizeps']],
  ['arnold-press', 'Arnold-Press', 'Arnold press', 'Schultern', 'Kurzhantel', 'strength', 'arnold drücken', ['Trizeps']],
  ['lateral-raise', 'Kurzhantel-Seitheben', 'Dumbbell lateral raise', 'Schultern', 'Kurzhantel', 'strength', 'side raises seitheben'],
  ['cable-lateral-raise', 'Kabelzug-Seitheben', 'Cable lateral raise', 'Schultern', 'Kabelzug', 'strength', 'seitheben kabel'],
  ['front-raise', 'Kurzhantel-Frontheben', 'Dumbbell front raise', 'Schultern', 'Kurzhantel', 'strength', 'frontheben'],
  ['reverse-fly', 'Kurzhantel-Reverse-Flys', 'Dumbbell reverse fly', 'Schultern', 'Kurzhantel', 'strength', 'vorgebeugtes seitheben rear delt', ['Rücken']],
  ['reverse-pec-deck', 'Butterfly Reverse', 'Reverse pec deck', 'Schultern', 'Maschine', 'strength', 'hintere schulter', ['Rücken']],
  ['face-pull', 'Face Pulls', 'Cable face pull', 'Schultern', 'Kabelzug', 'strength', 'gesichtszug', ['Rücken']],
  ['band-pull-apart', 'Band auseinanderziehen', 'Band pull apart', 'Schultern', 'Widerstandsband', 'bodyweight', 'band pullapart', ['Rücken']],
  ['shrug', 'Kurzhantel-Shrugs', 'Dumbbell shrug', 'Rücken', 'Kurzhantel', 'strength', 'schulterheben nacken trapez'],
  ['barbell-curl', 'Langhantel-Bizepscurls', 'Barbell biceps curl', 'Bizeps', 'Langhantel', 'strength', 'lh curls'],
  ['ez-curl', 'SZ-Curls', 'EZ bar curl', 'Bizeps', 'Langhantel', 'strength', 'sz stange bizeps'],
  ['dumbbell-curl', 'Kurzhantel-Bizepscurls', 'Dumbbell biceps curl', 'Bizeps', 'Kurzhantel', 'strength', 'kh curls'],
  ['hammer-curl', 'Hammercurls', 'Hammer curl', 'Bizeps', 'Kurzhantel', 'strength', 'neutralgriff curls', ['Unterarme']],
  ['incline-curl', 'Schrägbank-Curls', 'Incline dumbbell curl', 'Bizeps', 'Kurzhantel', 'strength', 'incline curl'],
  ['preacher-curl', 'Scott-Curls', 'Preacher curl', 'Bizeps', 'Langhantel', 'strength', 'scottbank'],
  ['cable-curl', 'Kabelzug-Bizepscurls', 'Cable biceps curl', 'Bizeps', 'Kabelzug', 'strength', 'cable curls'],
  ['concentration-curl', 'Konzentrationscurls', 'Concentration curl', 'Bizeps', 'Kurzhantel', 'strength'],
  ['triceps-pushdown', 'Trizepsdrücken am Kabel', 'Triceps cable pushdown', 'Trizeps', 'Kabelzug', 'strength', 'seil rope pushdown triceps extension'],
  ['overhead-triceps', 'Überkopf-Trizepsstrecken am Kabel', 'Overhead cable triceps extension', 'Trizeps', 'Kabelzug', 'strength', 'überkopf trizeps'],
  ['dumbbell-triceps', 'Kurzhantel-Trizepsstrecken', 'Dumbbell triceps extension', 'Trizeps', 'Kurzhantel', 'strength', 'french press'],
  ['skull-crusher', 'Liegendes SZ-Trizepsstrecken', 'Skull crusher', 'Trizeps', 'Langhantel', 'strength', 'stirndrücken french press'],
  ['close-bench', 'Enges Langhantel-Bankdrücken', 'Close grip bench press', 'Trizeps', 'Langhantel', 'strength', 'enges bankdrücken', ['Brust']],
  ['triceps-kickback', 'Trizeps-Kickbacks', 'Dumbbell triceps kickback', 'Trizeps', 'Kurzhantel', 'strength'],
  ['diamond-push-up', 'Diamant-Liegestütze', 'Diamond push-up', 'Trizeps', 'Körpergewicht', 'bodyweight', 'enge liegestütze', ['Brust']],
  ['wrist-curl', 'Handgelenkcurls', 'Wrist curl', 'Unterarme', 'Kurzhantel', 'strength', 'unterarm curls'],
  ['reverse-wrist-curl', 'Umgekehrte Handgelenkcurls', 'Reverse wrist curl', 'Unterarme', 'Kurzhantel', 'strength'],
  ['reverse-curl', 'Reverse Curls', 'Reverse barbell curl', 'Unterarme', 'Langhantel', 'strength', 'curls obergriff', ['Bizeps']],
  ['dead-hang', 'Hängen an der Stange', 'Dead hang', 'Unterarme', 'Körpergewicht', 'hold', 'griffkraft hängen', ['Rücken']],
  ['farmer-hold', 'Farmer Hold', 'Farmer hold', 'Unterarme', 'Kurzhantel', 'hold', 'gewichte halten', ['Bauch/Core']],
  ['back-squat', 'Langhantel-Kniebeugen', 'Barbell back squat', 'Quadrizeps', 'Langhantel', 'strength', 'kniebeuge squats', ['Gesäß', 'Bauch/Core']],
  ['front-squat', 'Frontkniebeugen', 'Front squat', 'Quadrizeps', 'Langhantel', 'strength', 'frontbeuge', ['Gesäß']],
  ['goblet-squat', 'Goblet Squats', 'Goblet squat', 'Quadrizeps', 'Kettlebell', 'strength', 'kelchkniebeuge', ['Gesäß']],
  ['bodyweight-squat', 'Kniebeugen ohne Gewicht', 'Bodyweight squat', 'Quadrizeps', 'Körpergewicht', 'bodyweight', 'air squat', ['Gesäß']],
  ['leg-press', 'Beinpresse', 'Leg press', 'Quadrizeps', 'Maschine', 'strength', '45 grad beinpresse', ['Gesäß']],
  ['hack-squat', 'Hackenschmidt-Kniebeugen', 'Hack squat', 'Quadrizeps', 'Maschine', 'strength', 'hackenschmidt hack squat', ['Gesäß']],
  ['leg-extension', 'Beinstrecker', 'Leg extension', 'Quadrizeps', 'Maschine', 'strength', 'beinstrecken'],
  ['bulgarian-squat', 'Bulgarische Kurzhantel-Split-Squats', 'Bulgarian split squat', 'Quadrizeps', 'Kurzhantel', 'strength', 'bulgarian lunges', ['Gesäß']],
  ['dumbbell-lunge', 'Kurzhantel-Ausfallschritte', 'Dumbbell lunge', 'Quadrizeps', 'Kurzhantel', 'strength', 'lunges ausfallschritt', ['Gesäß']],
  ['bodyweight-lunge', 'Ausfallschritte ohne Gewicht', 'Bodyweight lunge', 'Quadrizeps', 'Körpergewicht', 'bodyweight', 'lunges', ['Gesäß']],
  ['step-up', 'Kurzhantel-Step-ups', 'Dumbbell step-up', 'Quadrizeps', 'Kurzhantel', 'strength', 'aufsteigen step ups', ['Gesäß']],
  ['wall-sit', 'Wandsitzen', 'Wall sit', 'Quadrizeps', 'Körpergewicht', 'hold', 'wandsitz wall squat'],
  ['deadlift', 'Klassisches Kreuzheben', 'Conventional deadlift', 'Hintere Oberschenkel', 'Langhantel', 'strength', 'dead lift', ['Gesäß', 'Rücken']],
  ['romanian-deadlift', 'Rumänisches Kreuzheben', 'Romanian deadlift', 'Hintere Oberschenkel', 'Langhantel', 'strength', 'rdl', ['Gesäß', 'Rücken']],
  ['dumbbell-rdl', 'Rumänisches Kurzhantel-Kreuzheben', 'Dumbbell Romanian deadlift', 'Hintere Oberschenkel', 'Kurzhantel', 'strength', 'kh rdl', ['Gesäß']],
  ['sumo-deadlift', 'Sumo-Kreuzheben', 'Sumo deadlift', 'Gesäß', 'Langhantel', 'strength', 'sumo', ['Hintere Oberschenkel', 'Quadrizeps']],
  ['lying-leg-curl', 'Beinbeuger, liegend', 'Lying leg curl', 'Hintere Oberschenkel', 'Maschine', 'strength', 'beincurls hamstring curl'],
  ['seated-leg-curl', 'Beinbeuger, sitzend', 'Seated leg curl', 'Hintere Oberschenkel', 'Maschine', 'strength', 'beincurls hamstring curl'],
  ['good-morning', 'Good Mornings', 'Good morning', 'Hintere Oberschenkel', 'Langhantel', 'strength', 'rumpfbeugen', ['Rücken', 'Gesäß']],
  ['nordic-curl', 'Nordic Curls', 'Nordic hamstring curl', 'Hintere Oberschenkel', 'Körpergewicht', 'bodyweight', 'nordic hamstrings'],
  ['hip-thrust', 'Langhantel-Hip-Thrusts', 'Barbell hip thrust', 'Gesäß', 'Langhantel', 'strength', 'hüftheben hipthrust', ['Hintere Oberschenkel']],
  ['machine-hip-thrust', 'Hip-Thrust-Maschine', 'Machine hip thrust', 'Gesäß', 'Maschine', 'strength', 'glute drive'],
  ['glute-bridge', 'Beckenheben', 'Glute bridge', 'Gesäß', 'Körpergewicht', 'bodyweight', 'glutebridge brücke', ['Hintere Oberschenkel']],
  ['cable-kickback', 'Kabelzug-Glute-Kickbacks', 'Cable glute kickback', 'Gesäß', 'Kabelzug', 'strength', 'po kickback'],
  ['abduction', 'Abduktorenmaschine', 'Hip abduction machine', 'Gesäß', 'Maschine', 'strength', 'abduktion beine öffnen'],
  ['adduction', 'Adduktorenmaschine', 'Hip adduction machine', 'Quadrizeps', 'Maschine', 'strength', 'adduktion innere oberschenkel'],
  ['band-lateral-walk', 'Seitliche Schritte mit Band', 'Lateral band walk', 'Gesäß', 'Widerstandsband', 'bodyweight', 'monster walk seitgänge'],
  ['standing-calf', 'Wadenheben, stehend an der Maschine', 'Standing machine calf raise', 'Waden', 'Maschine', 'strength', 'calves waden'],
  ['seated-calf', 'Wadenheben, sitzend', 'Seated calf raise', 'Waden', 'Maschine', 'strength'],
  ['bodyweight-calf', 'Wadenheben ohne Gewicht', 'Bodyweight calf raise', 'Waden', 'Körpergewicht', 'bodyweight'],
  ['dumbbell-calf', 'Kurzhantel-Wadenheben', 'Dumbbell calf raise', 'Waden', 'Kurzhantel', 'strength'],
  ['crunch', 'Crunches', 'Crunch', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'bauchpressen abs'],
  ['sit-up', 'Sit-ups', 'Sit-up', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'situps rumpfheben'],
  ['cable-crunch', 'Kabel-Crunches', 'Cable crunch', 'Bauch/Core', 'Kabelzug', 'strength', 'kabelzug bauch'],
  ['hanging-leg-raise', 'Hängendes Beinheben', 'Hanging leg raise', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'leg raises'],
  ['reverse-crunch', 'Reverse Crunches', 'Reverse crunch', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'beckenrollen'],
  ['ab-wheel', 'Bauchroller', 'Ab wheel rollout', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'ab roller rollouts'],
  ['plank', 'Unterarmstütz', 'Plank', 'Bauch/Core', 'Körpergewicht', 'hold', 'planks brett unterarmstütze'],
  ['side-plank', 'Seitstütz', 'Side plank', 'Bauch/Core', 'Körpergewicht', 'hold', 'seitlicher unterarmstütz'],
  ['hollow-hold', 'Hollow Hold', 'Hollow body hold', 'Bauch/Core', 'Körpergewicht', 'hold', 'schiffchen'],
  ['dead-bug', 'Dead Bug', 'Dead bug', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'käfer'],
  ['pallof-press', 'Pallof Press', 'Cable Pallof press', 'Bauch/Core', 'Kabelzug', 'strength', 'antirotation'],
  ['russian-twist', 'Russian Twists', 'Russian twist', 'Bauch/Core', 'Körpergewicht', 'bodyweight', 'russische drehung'],
  ['kettlebell-swing', 'Kettlebell-Swings', 'Kettlebell swing', 'Ganzkörper', 'Kettlebell', 'strength', 'kb swing', ['Gesäß', 'Hintere Oberschenkel']],
  ['thruster', 'Kurzhantel-Thruster', 'Dumbbell thruster', 'Ganzkörper', 'Kurzhantel', 'strength', 'squat press', ['Quadrizeps', 'Schultern']],
  ['clean-press', 'Langhantel-Umsetzen und Drücken', 'Barbell clean and press', 'Ganzkörper', 'Langhantel', 'strength', 'clean press'],
  ['burpee', 'Burpees', 'Burpee', 'Ganzkörper', 'Körpergewicht', 'bodyweight', 'liegestützsprung'],
  ['mountain-climber', 'Mountain Climbers', 'Mountain climber', 'Ganzkörper', 'Körpergewicht', 'bodyweight', 'bergsteiger', ['Bauch/Core']],
  ['treadmill', 'Laufband', 'Treadmill running', 'Cardio', 'Cardiogerät', 'cardio', 'joggen laufen running'],
  ['outdoor-run', 'Laufen im Freien', 'Outdoor running', 'Cardio', 'Körpergewicht', 'cardio', 'jogging joggen run'],
  ['walking', 'Gehen', 'Walking', 'Cardio', 'Körpergewicht', 'cardio', 'spazieren walk wandern'],
  ['bike', 'Fahrradergometer', 'Stationary bike', 'Cardio', 'Cardiogerät', 'cardio', 'radfahren cycling indoor bike spinning'],
  ['elliptical', 'Crosstrainer', 'Elliptical trainer', 'Cardio', 'Cardiogerät', 'cardio', 'ellipsentrainer cross trainer'],
  ['rowing', 'Ruderergometer', 'Rowing ergometer', 'Cardio', 'Cardiogerät', 'cardio', 'rudern rowing machine cardio concept2'],
  ['stair-climber', 'Treppensteiger', 'Stair climber', 'Cardio', 'Cardiogerät', 'cardio', 'stairmaster stepper treppensteigen'],
  ['air-bike', 'Air Bike', 'Air bike', 'Cardio', 'Cardiogerät', 'cardio', 'assault bike'],
  ['ski-erg', 'Ski-Ergometer', 'Ski erg', 'Cardio', 'Cardiogerät', 'cardio', 'skierg ski trainer'],
];
export const EXERCISES: Exercise[] = definitions.map(([id, name, englishName, muscle, equipment, tracking, aliases = '', secondaryMuscles = []]) => ({ id, name, englishName, muscle, equipment, tracking, aliases: aliases ? [aliases] : [], secondaryMuscles }));

export function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
export function searchExercises(exercises: Exercise[], query: string, muscle?: MuscleGroup, equipment?: Equipment) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return exercises.filter((exercise) => {
    const text = normalizeSearch([exercise.name, exercise.englishName, ...exercise.aliases].join(' '));
    return (!muscle || exercise.muscle === muscle) && (!equipment || exercise.equipment === equipment) && words.every((word) => text.includes(word));
  });
}
