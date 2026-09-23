import { Text, View } from 'react-native';

import { Berkk, BerkkFonts } from '@/constants/theme';

const MONTH_NAMES = ['Jul', 'Aug', 'Sep'];

// Ported verbatim from the `renderVals()` pattern/strong arrays in
// BERKK v5 Nachtglas.dc.html — 5 rows x 7 cols per month, flat index order.
const PATTERN: number[][] = [
  [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0],
  [0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0],
  [0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
];
const STRONG: number[][] = [
  [8, 17, 24, 31],
  [9, 16, 23, 30],
  [7, 15, 22, 29],
];

const DOT_SIZE = 6;
const DOT_GAP = 6;
const COLS = 7;

/** GitHub-style dot grid, one 7-wide cluster per month, hot orange dots glowing. */
export function TrainingHeatmap() {
  return (
    <View className="flex-row justify-between">
      {MONTH_NAMES.map((name, monthIndex) => (
        <View key={name} style={{ width: COLS * DOT_SIZE + (COLS - 1) * DOT_GAP }}>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: BerkkFonts.medium,
              color: Berkk.inkSecondary,
              fontSize: 14,
            }}>
            {name}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: DOT_GAP }}>
            {PATTERN[monthIndex].map((on, i) => {
              const hot = on === 1 && STRONG[monthIndex].includes(i);
              return (
                <View
                  key={i}
                  style={{
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    borderRadius: DOT_SIZE / 2,
                    backgroundColor: on ? (hot ? Berkk.dotHot : Berkk.dotOn) : Berkk.dotOff,
                    shadowColor: hot ? Berkk.dotHot : undefined,
                    shadowOpacity: hot ? 0.6 : 0,
                    shadowRadius: hot ? 4 : 0,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
