export const Onboarding = {
  base: "#171019",
  ink: "#F5EFE6",
  muted: "#B7A6A5",
  orange: "#FF995E",
  emphasis: "#F4B48D",
  line: "rgba(245,239,230,0.13)",
  ease: [0.2, 0.8, 0.2, 1] as const,
  motion: {
    float: 4200,
    blink: 6800,
    scene: 700,
    exit: 140,
    entrance: 550,
    drift: 16000,
    success: 750,
    sheen: 6000,
  },
};
export const goals = [
  ["strength", "Stärker werden", "Mehr Kraft, Satz für Satz."],
  ["muscle", "Muskeln aufbauen", "Deinen Fortschritt sichtbar machen."],
  ["routine", "Dranbleiben", "Training zu deinem Rhythmus machen."],
] as const;
export const experiences = [
  ["new", "Ich starte gerade", "Ich möchte die Grundlagen kennenlernen."],
  ["returning", "Ich steige wieder ein", "Ich möchte wieder Routine finden."],
  [
    "regular",
    "Ich trainiere regelmäßig",
    "Ich möchte mein Training gezielt verfolgen.",
  ],
] as const;
export const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const dayNames = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
export const copy = [
  [
    "Willkommen bei BERKK",
    "Komm in deinen",
    "Rhythmus.",
    "Dein Training festhalten. Fortschritte sehen. Mit einem Begleiter, der mit dir wächst.",
  ],
  [
    "Kurz ausprobieren",
    "Ein Satz.",
    "Alles drin.",
    "Gewicht wählen, Wiederholungen eintragen, abhaken. Probier’s aus.",
  ],
  [
    "Dein Ziel",
    "Was treibt",
    "dich an?",
    "Wähle, was dir beim Training am wichtigsten ist.",
  ],
  [
    "Deine Erfahrung",
    "Wo stehst",
    "du gerade?",
    "Jeder Anfang zählt. Auch ein neuer.",
  ],
  [
    "Deine Woche",
    "Deine Woche.",
    "Dein Rhythmus.",
    "An welchen Tagen passt Training in deinen Alltag?",
  ],
  [
    "Dein Ausgangspunkt",
    "Dein",
    "Ausgangspunkt.",
    "Mit deinem Startgewicht kannst du Veränderungen verfolgen. Die Angabe ist freiwillig.",
  ],
  [
    "Dein Anfang",
    "Dein Rhythmus",
    "steht.",
    "Du bringst die Energie. BERKK hält deinen Fortschritt fest.",
  ],
] as const;
