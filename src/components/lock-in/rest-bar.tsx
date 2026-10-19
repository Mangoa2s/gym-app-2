import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';

export type Rest = { endsAt: number; total: number };

/** "1:52 Pause" with "+15 s" and "Weiter". Closes itself when the time is up. */
export const RestBar = memo(function RestBar({ rest, compact = false, onAdd, onDone }: { rest: Rest; compact?: boolean; onAdd: () => void; onDone: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);
  const left = Math.max(0, Math.ceil((rest.endsAt - now) / 1000));
  useEffect(() => { if (left === 0) onDone(); }, [left, onDone]);
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const share = rest.total > 0 ? Math.min(1, left / rest.total) : 0;
  return <View style={[styles.bar, compact && styles.compactBar]}>
    <View style={styles.row}>
      <Text accessibilityRole="timer" accessibilityLabel={`Pause, noch ${left} Sekunden`} style={styles.time}>{label} <Text style={styles.word}>Pause</Text></Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Pause um ${L.restAddSeconds} Sekunden verlängern`} onPress={onAdd} style={styles.button}><Text style={styles.buttonText}>+{L.restAddSeconds} s</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Pause beenden, weiter" onPress={onDone} style={[styles.button, styles.primary]}><Text style={[styles.buttonText, styles.primaryText]}>Weiter</Text></Pressable>
    </View>
    <View style={styles.track}><View style={[styles.fill, { flex: share }]} /><View style={{ flex: 1 - share }} /></View>
  </View>;
});

const styles = StyleSheet.create({
  bar: { marginHorizontal: T.space.xl, marginBottom: T.space.m, padding: T.space.m, borderRadius: T.radius.tile, backgroundColor: T.color.glass, borderWidth: T.border, borderColor: T.color.glassBorder, gap: T.space.s },
  compactBar: { marginBottom: T.space.s, paddingVertical: T.space.xs, gap: T.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: T.space.s },
  time: { flex: 1, fontFamily: T.font.hero, fontSize: 22, color: T.color.ink, fontVariant: ['tabular-nums'] },
  word: { fontFamily: T.font.body, fontSize: 14, color: T.color.inkSoft },
  button: { minHeight: T.touch, minWidth: T.touch, paddingHorizontal: T.space.m, borderRadius: T.radius.pill, borderWidth: T.border, borderColor: T.color.glassBorder, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: T.font.label, fontSize: 14, color: T.color.ink },
  primary: { backgroundColor: T.color.ink, borderColor: T.color.ink },
  primaryText: { color: T.color.onAccent },
  track: { flexDirection: 'row', height: 4, borderRadius: T.radius.bar, backgroundColor: T.color.track, overflow: 'hidden' },
  fill: { backgroundColor: T.color.accent },
});
