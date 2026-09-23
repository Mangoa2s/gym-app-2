import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { GlassSurface } from '@/components/berkk/glass-surface';

type RoundIconButtonProps = {
  size?: number;
  onPress?: () => void;
  accessibilityLabel: string;
  children: ReactNode;
};

/** Circular glass button used for the header actions and every card's filter icon. */
export function RoundIconButton({ size = 44, onPress, accessibilityLabel, children }: RoundIconButtonProps) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={accessibilityLabel} hitSlop={6}>
      <GlassSurface
        radius={size / 2}
        style={{ width: size, height: size }}
        className="items-center justify-center flex-1">
        {children}
      </GlassSurface>
    </Pressable>
  );
}
