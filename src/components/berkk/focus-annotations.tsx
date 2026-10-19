import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { GlassPill } from '@/components/berkk/glass-pill';
import { Berkk, BerkkFonts } from '@/constants/theme';

// Decorative data-point callouts over the photo. Positions are stage fractions.
const MARKS = [
  { label: 'Fokus', ring: [0.56, 0.2], elbow: [0.7, 0.07], side: 'right' },
  { label: 'Tempo', ring: [0.44, 0.54], elbow: [0.32, 0.4], side: 'left' },
  { label: 'Bereit', ring: [0.54, 0.8], elbow: [0.68, 0.93], side: 'right' },
] as const;
const RING = 9;
const TAIL = 18;
const LABEL_HEIGHT = 28;

export function FocusAnnotations({ height }: { height: number }) {
  const [width, setWidth] = useState(0);
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ alignSelf: 'stretch', height }}>
      {width > 0 && <>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          {MARKS.map(({ label, ring, elbow, side }) => {
            const [rx, ry, ex, ey] = [ring[0] * width, ring[1] * height, elbow[0] * width, elbow[1] * height];
            const length = Math.hypot(ex - rx, ey - ry);
            const sx = rx + ((ex - rx) / length) * RING;
            const sy = ry + ((ey - ry) / length) * RING;
            const tx = side === 'right' ? ex + TAIL : ex - TAIL;
            return <G key={label}>
              <Circle cx={rx} cy={ry} r={RING * 1.8} stroke={Berkk.annotation} strokeWidth={1} strokeOpacity={0.3} fill="none" />
              <Circle cx={rx} cy={ry} r={RING} stroke={Berkk.annotation} strokeWidth={1} fill="none" />
              <Circle cx={rx} cy={ry} r={2.5} fill={Berkk.annotation} />
              <Path d={`M${sx} ${sy}L${ex} ${ey}H${tx}`} stroke={Berkk.annotation} strokeWidth={1} strokeOpacity={0.8} fill="none" />
            </G>;
          })}
        </Svg>
        {MARKS.map(({ label, elbow, side }) => {
          const edge = elbow[0] * width + (side === 'right' ? TAIL : -TAIL);
          return <GlassPill key={label} style={[styles.label, { top: elbow[1] * height - LABEL_HEIGHT / 2 }, side === 'right' ? { left: edge } : { right: width - edge }]}>
            <View style={styles.row}><View style={styles.dot} /><Text maxFontSizeMultiplier={1.2} style={styles.text}>{label}</Text></View>
          </GlassPill>;
        })}
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', height: LABEL_HEIGHT, paddingHorizontal: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Berkk.annotation },
  text: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 12, letterSpacing: 0.2 },
});
