import { useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useDetailMotion } from '@/components/berkk/detail-sheet';

/** Display-only counter. The original formatted value is always the exact end state. */
export function DetailNumber({ value, startOffset = 3, style, fit = false }: {
  value: string;
  startOffset?: number;
  style: StyleProp<TextStyle>;
  fit?: boolean;
}) {
  const { countProgress, reducedMotion } = useDetailMotion();
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  const decimals = Math.min(value.split(',')[1]?.length ?? 0, 6);
  const valid = Number.isFinite(parsed) && value.trim().length > 0;
  const start = Math.max(0, parsed - startOffset);
  const [display, setDisplay] = useState(() => reducedMotion || !valid
    ? value : start.toFixed(decimals).replace('.', ','));

  useAnimatedReaction(
    () => reducedMotion || !valid || countProgress.value >= 1
      ? value
      : (start + (parsed - start) * countProgress.value).toFixed(decimals).replace('.', ','),
    (next, previous) => {
      // Only send a changed digit, not every animation frame, to React.
      if (next !== previous) scheduleOnRN(setDisplay, next);
    },
  );

  return (
    <Text testID="detail-number" style={style} numberOfLines={fit ? 1 : undefined} adjustsFontSizeToFit={fit} accessibilityLabel={value} accessibilityLiveRegion="none">
      {display}
    </Text>
  );
}
