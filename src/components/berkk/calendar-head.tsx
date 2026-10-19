import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarAppearance as C } from '@/constants/calendar-appearance';
import { BerkkFonts } from '@/constants/theme';
import { CalendarStreakGhost } from './calendar-streak-ghost';

/**
 * The light head: one large daily streak and its label. A flat cream surface with
 * a rounded lower edge, no glow; the near-black month list continues below it.
 * Pressing it returns to today, as before.
 */
export const CalendarHead = memo(function CalendarHead({ streak, todayDone, focused, topInset, compact, onPress }: {
  streak: number; todayDone: boolean; focused: boolean; topInset: number; compact: boolean; onPress: () => void;
}) {
  const status = todayDone ? 'Heute trainiert' : streak ? 'Heute noch offen' : 'Noch keine Serie';
  const numberSize = compact ? C.head.compactNumber : C.head.number;
  return <Pressable testID="calendar-head" accessibilityRole="button" accessibilityLabel={`${streak} Trainingstage in Folge. ${status}. Zum heutigen Tag`} accessibilityHint="Zählt ausschließlich aufeinanderfolgende Tage mit abgeschlossenen Trainingssätzen; Ruhetage werden nicht überbrückt." onPress={onPress} style={[styles.head, { paddingTop: topInset + (compact ? 6 : 14), paddingBottom: compact ? 18 : 26 }]}>
    <LinearGradient pointerEvents="none" colors={C.head.surface} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
    <View style={styles.content}>
      <Text testID="calendar-streak" maxFontSizeMultiplier={1.1} style={[styles.number, { fontSize: numberSize, lineHeight: Math.round(numberSize * 1.08) }]}>{streak}</Text>
      <Text maxFontSizeMultiplier={1.3} style={[styles.label, compact && styles.compactLabel]}>{streak === 1 ? 'Tag in Folge' : 'Tage in Folge'}</Text>
      <View style={styles.statusRow}><View style={[styles.mark, todayDone && styles.markDone]} /><Text maxFontSizeMultiplier={1.3} style={styles.status}>{status}</Text></View>
      <View style={[styles.ghost, { top: compact ? 4 : 10 }]}><CalendarStreakGhost streak={streak} todayDone={todayDone} focused={focused} size={compact ? 46 : 54} halo={false} /></View>
    </View>
  </Pressable>;
});

const styles = StyleSheet.create({
  head: { overflow: 'hidden', borderBottomLeftRadius: C.head.radius, borderBottomRightRadius: C.head.radius },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center', paddingHorizontal: 24 },
  number: { fontFamily: BerkkFonts.black, color: C.head.ink, letterSpacing: -2, fontVariant: ['tabular-nums'], includeFontPadding: false },
  label: { marginTop: 2, fontFamily: BerkkFonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: C.head.inkSoft },
  compactLabel: { fontSize: 19, lineHeight: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  mark: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: C.head.accent },
  markDone: { backgroundColor: C.head.accent },
  status: { fontFamily: BerkkFonts.medium, fontSize: 13, lineHeight: 18, color: C.head.inkSoft },
  ghost: { position: 'absolute', right: 22 },
});
