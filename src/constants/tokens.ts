/**
 * Design tokens and fonts with no React Native or CSS imports, so node tests can
 * read them too. Import them through '@/constants/theme' in app code.
 */

/**
 * Typography exactly as specified in the mockup: Space Grotesk for body/meta text,
 * Schibsted Grotesk (which has genuine 800/900 cuts) for the headline and hero numbers.
 */
export const BerkkFonts = {
  black: 'SchibstedGrotesk_900Black',
  extrabold: 'SchibstedGrotesk_800ExtraBold',
  bold: 'SpaceGrotesk_700Bold',
  semibold: 'SpaceGrotesk_600SemiBold',
  medium: 'SpaceGrotesk_500Medium',
  regular: 'SpaceGrotesk_400Regular',
} as const;

/**
 * Design tokens (Oct 2026). Screens built on tokens read ONLY from here: no hex
 * values in components. To re-theme, replace the values in this object.
 * Text contrast on the darkest background stop: ink ~16:1, inkSoft ~9:1,
 * inkMuted ~5.8:1, accent ~5.3:1, accentLight ~10:1 (all at least 4.5:1).
 */
export const Tokens = {
  color: {
    background: ['#35180F', '#211018', '#171019', '#110C17'] as const,
    ink: '#F5EFE6',
    inkSoft: 'rgba(245,239,230,0.74)',
    inkMuted: 'rgba(245,239,230,0.58)',
    accent: '#E8632B',
    accentLight: '#FDB07C',
    /** Dark text on a filled accent surface. */
    onAccent: '#1A0E07',
    accentWash: 'rgba(232,99,43,0.16)',
    accentBorder: 'rgba(232,99,43,0.55)',
    cardFill: 'rgba(245,239,230,0.045)',
    cardBorder: 'rgba(245,239,230,0.12)',
    track: 'rgba(245,239,230,0.12)',
    idleRing: 'rgba(245,239,230,0.24)',
    pressed: 'rgba(245,239,230,0.08)',
    /** Round glass controls (pause, stop) and chips. */
    glass: 'rgba(245,239,230,0.08)',
    glassBorder: 'rgba(245,239,230,0.18)',
    /**
     * Bottom card: 85 % opaque so the embers shimmer through. Text contrast is
     * verified for the worst case (brightest ember colour fully behind the card)
     * in scripts/world.test.mjs: every card text colour stays ≥ 4.5:1.
     */
    surface: 'rgba(24,16,23,0.85)',
    /** The ghost's marker in VS mode: pale, never competing with the orange "DU". */
    ghostDot: 'rgba(245,239,230,0.5)',
    /** Muscle distribution segments, strongest first; the legend always names them too. */
    muscle: ['#E8632B', '#FDB07C', '#A88BDA', 'rgba(245,239,230,0.42)'] as const,
  },
  /**
   * "Glut-Welt" behind the active training. A shop theme (e.g. "Blaue Flamme")
   * swaps ONLY these values; the simulation never hard-codes a colour.
   */
  world: {
    /** Ember bed: hot centre → core → transparent edge. */
    emberHot: '#FFAA5A',
    emberCore: '#E8632B',
    /** Spark colours: cool (low heat, dim red-orange) → hot (high heat, bright yellow). */
    emberCool: '#B4441E',
    sparkHot: '#FFE08A',
    /** Soft light around the ghost. */
    glow: '#FF8A4C',
    /** Darkening over a frozen, paused world. */
    pauseDim: 'rgba(8,5,10,0.5)',
  },
  /** Ghost palette; colour variants replace these values, the shape and animations stay. */
  ghost: {
    body: ['#FFECCF', '#FFAE77', '#EF684C', '#773A78'] as const,
    eye: '#171019',
    cheek: '#FF8FB1',
    steam: 'rgba(245,239,230,0.75)',
    bubble: '#F5EFE6',
    bubbleInk: '#1A0E07',
  },
  radius: { card: 24, tile: 18, chip: 22, pill: 999, bar: 4, circle: 999 },
  space: { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32 },
  font: { hero: BerkkFonts.black, title: BerkkFonts.bold, label: BerkkFonts.semibold, body: BerkkFonts.medium, meta: BerkkFonts.regular },
  /** Minimum touch target (Apple HIG / WCAG). */
  touch: 44,
  border: 1,
} as const;
