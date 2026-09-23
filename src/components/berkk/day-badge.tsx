import { Text, View } from 'react-native';

import { Berkk, BerkkFonts } from '@/constants/theme';

type DayBadgeProps = {
  number: number;
  size?: number;
  /** "faint" (34% ink, subtle) matches the workout card; "solid" (full ink) matches the training row. */
  variant?: 'faint' | 'solid';
};

/** Thin outlined ring with the session number centered, e.g. workout "1" / "2". */
export function DayBadge({ number, size = 54, variant = 'faint' }: DayBadgeProps) {
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: variant === 'faint' ? Berkk.inkFaint : Berkk.ink,
      }}>
      <Text
        style={{
          fontFamily: BerkkFonts.semibold,
          color: Berkk.ink,
          fontSize: size * 0.32,
          letterSpacing: -0.4,
        }}>
        {number}
      </Text>
    </View>
  );
}
