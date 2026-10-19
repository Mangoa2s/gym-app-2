/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * BERKK "Nachtglas" (night glass) design — ported 1:1 from the approved
 * `BERKK v5 Nachtglas.dc.html` Claude Design mockup. Values below are copied
 * verbatim from that file; treat it as the source of truth, not this file.
 */
export const Berkk = {
  // Running training keeps the working center darker than the home glass.
  workoutBackground: '#09080B',
  // Warm orange-red opening and charcoal/violet base for detail sheets.
  detailGradient: ['#613328', '#30202D', '#19151F'] as const,
  // Screen background: 6-stop diagonal near-black gradient (168deg)
  backgroundGradient: ['#16141A', '#1B1720', '#241A1E', '#2A1C18', '#1A1620', '#121016'] as const,
  backgroundGradientLocations: [0, 0.26, 0.5, 0.7, 0.9, 1] as const,

  // Large blurred ambient glow blobs behind the glass cards
  glowOrange: '#F15A22',
  glowBlue: '#3E6F8C',
  glowPurple: '#7A3FD0',

  // Liquid-glass card surface (backdrop blur + faint white gradient + inset highlight)
  glassGradient: ['rgba(255,247,238,0.16)', 'rgba(255,247,238,0.085)', 'rgba(255,247,238,0.05)'] as const,
  glassHighlight: 'rgba(255,255,255,0.34)',
  glassBorder: 'rgba(255,255,255,0.12)',

  // CTA button: orange -> red-orange -> plum
  ctaGradient: ['rgba(255,166,92,0.92)', 'rgba(241,90,34,0.94)', 'rgba(168,60,140,0.9)'] as const,
  ctaGlassGradient: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)'] as const,

  ink: '#F4EFE9',
  inkSecondary: 'rgba(244,239,233,0.68)',
  inkMuted: 'rgba(244,239,233,0.5)',
  inkFaint: 'rgba(244,239,233,0.34)',
  ctaInk: '#1A0E07',
  divider: 'rgba(244,239,233,0.18)',
  dotOn: 'rgba(244,239,233,0.66)',
  dotOff: 'rgba(244,239,233,0.16)',
  dotHot: '#FF7A3C',
  dotBorder: 'rgba(244,239,233,0.22)',
  navBadge: '#F15A22',

  // Anchor/link accent from the mockup's `a{color:#FF8A4C}a:hover{color:#FFA873}`
  link: '#FF8A4C',
  linkPressed: '#FFA873',

  // Running-workout photo screen: annotation rings and frosted pills.
  annotation: '#E8632B',
  pillWash: 'rgba(255,247,238,0.14)',
  pillBorder: 'rgba(255,255,255,0.2)',
} as const;


// Fonts and design tokens live in a dependency-free file (testable in node); this stays the one entry point.
export { BerkkFonts, Tokens } from './tokens';
