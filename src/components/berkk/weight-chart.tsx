import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { useDetailMotion } from '@/components/berkk/detail-sheet';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { formatWeight, formatWeightDate, type WeightEntry } from '@/store/body-weight-state';

import { weightChartData } from './weight-chart-data';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const [width, setWidth] = useState(300);
  const { progress, chartProgress, reducedMotion } = useDetailMotion();
  const chart = useMemo(() => weightChartData(entries, width, 164), [entries, width]);
  const revealStyle = useAnimatedStyle(() => {
    const amount = reducedMotion ? 1 : interpolate(progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: amount, transform: [{ translateY: (1 - amount) * 10 }] };
  });
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: (chart?.length ?? 0) * (1 - chartProgress.value) }));
  const single = chart?.points.length === 1 ? chart.points[0] : null;

  return (
    <Animated.View testID="weight-chart-region" style={revealStyle} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Text accessibilityRole="header" style={styles.heading}>Gewichtsverlauf</Text>
      {!chart ? (
        <View testID="weight-chart-empty" style={styles.empty}>
          <Text style={styles.emptyTitle}>Noch keine Einträge</Text>
          <Text style={styles.secondary}>Dein Verlauf beginnt mit dem ersten Speichern.</Text>
        </View>
      ) : single ? (
        <View testID="weight-chart-single" accessible accessibilityLabel={`${formatWeightDate(single.date)}, ${formatWeight(single.weight)} Kilogramm`}>
          <Svg width="100%" height={80} aria-hidden><Circle cx={width / 2} cy={40} r={4} fill={Berkk.ink} /></Svg>
          <Text style={styles.singleWeight}>{formatWeight(single.weight)} kg</Text>
          <Text style={[styles.secondary, styles.center]}>{formatWeightDate(single.date)}</Text>
        </View>
      ) : (
        <View testID="weight-chart-series" accessible accessibilityLabel={`Gewichtsverlauf. ${chart.points.map((point) => `${formatWeightDate(point.date)}: ${formatWeight(point.weight)} Kilogramm`).join('. ')}`}>
          <Svg width="100%" height={164} aria-hidden>
            {chart.ticks.map((tick, index) => (
              <ChartGridRow key={index} y={tick.y} label={tick.weight.toFixed(1).replace('.', ',')} left={chart.left} right={chart.right} />
            ))}
            <AnimatedPath testID="weight-chart-line" d={chart.path} fill="none" stroke={Berkk.link} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[chart.length, chart.length]} animatedProps={lineProps} />
          </Svg>
          <View style={styles.dates}>
            <Text style={styles.axis}>{formatWeightDate(chart.points[0].date)}</Text>
            <Text style={styles.axis}>{formatWeightDate(chart.points[chart.points.length - 1].date)}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function ChartGridRow({ y, label, left, right }: { y: number; label: string; left: number; right: number }) {
  return <><Line x1={left} x2={right} y1={y} y2={y} stroke={Berkk.divider} strokeWidth={0.6} /><SvgText x={0} y={y + 4} fill={Berkk.inkMuted} fontSize={11} fontFamily={BerkkFonts.regular}>{label}</SvgText></>;
}

const styles = StyleSheet.create({
  heading: { fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 19, lineHeight: 26, marginBottom: 22 },
  empty: { gap: 6 },
  emptyTitle: { fontFamily: BerkkFonts.medium, color: Berkk.inkSecondary, fontSize: 16 },
  secondary: { fontFamily: BerkkFonts.regular, color: Berkk.inkMuted, fontSize: 14, lineHeight: 21 },
  singleWeight: { fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 18, textAlign: 'center', marginBottom: 4 },
  center: { textAlign: 'center' },
  dates: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 44 },
  axis: { fontFamily: BerkkFonts.regular, color: Berkk.inkMuted, fontSize: 11 },
});
