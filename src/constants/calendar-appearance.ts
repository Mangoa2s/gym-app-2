/** Calendar-only tuning. Layout reference: light streak head over a near-black month list (Oct 2026). */
export const CalendarAppearance = {
  /** Near-black plum body behind the months; the light head sits on top of it. */
  background: ['#1B1219', '#130F16', '#120E17', '#1A1424'] as const,
  head: {
    /** Warm cream surface, the BERKK translation of the white reference head. */
    surface: ['#F7EBDD', '#F1DCC6'] as const,
    ink: '#1C1218',
    inkSoft: 'rgba(28,18,24,0.56)',
    accent: '#D9531F',
    radius: 36,
    /** Streak numeral size; small iPhones (height < 700) use the compact value. */
    number: 88,
    compactNumber: 68,
  },
  completed: '#FF7A3C',
  planned: '#FF8A4C',
  /** Empty days: quiet dots; the grid shows no permanent day numbers. */
  empty: 'rgba(244,239,233,0.17)',
  today: '#F4EFE9',
  selectionRing: 'rgba(244,239,233,0.62)',
  /** A past plan without a completed workout stays visible, just quieter. */
  missedOpacity: 0.42,
  weekdayInk: 'rgba(244,239,233,0.42)',
  monthMuted: 'rgba(244,239,233,0.38)',
  cellHeight: 50,
  compactCellHeight: 46,
  /** Air above the title, the month title, then its own weekday row. */
  monthHeaderHeight: 110,
  compactMonthHeaderHeight: 100,
  monthBottomSpace: 40,
  ambient: {
    halfCycleMs: 48000,
    warmColor: '#E66B38',
    violetColor: '#875CA5',
    warmOpacity: 0.07,
    violetOpacity: 0.09,
    size: 480,
    driftX: 24,
    driftY: 18,
  },
  // Match the existing floating navigation, plus a visible gap above it.
  tabClearance: 8 + 68 + 10,
  sheet: {
    blurIntensity: 18,
    wash: ['rgba(40,29,40,0.68)', 'rgba(30,22,34,0.84)'] as const,
    warmWash: ['rgba(60,32,28,0.64)', 'rgba(32,23,31,0.84)'] as const,
    border: 'rgba(244,239,233,0.17)',
    topEdge: 'rgba(255,244,231,0.40)',
    glowNeutral: '#95709E',
    glowWarm: '#F18A53',
    glowOpacity: 0.18,
    glowSize: 360,
    radius: 24,
  },
} as const;
