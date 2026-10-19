/** '#RRGGBB' → [r, g, b] in 0..1 (what Skia colours need). */
export function rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16) / 255) as [number, number, number];
}

/** '#RRGGBB' + alpha → 'rgba(…)' for React Native styles. */
export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = rgb(hex).map((channel) => Math.round(channel * 255));
  return `rgba(${r},${g},${b},${alpha})`;
}
