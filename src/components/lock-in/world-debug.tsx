/**
 * TEMPORARY diagnostics for the Glut-Welt (LockIn.debugWorld). Drawn ABOVE all
 * content so no covering layer can hide it. Includes a heat override slider and
 * buttons that fire the set reactions without logging anything. Remove (or set
 * debugWorld to false) once the world is tuned on device.
 */
import { memo, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Tokens as T } from '@/constants/theme';
import type { WorldBridge } from './world-bridge';

export const WorldDebug = memo(function WorldDebug({ bridge, heat, override, onOverride, onTrigger, top }: {
  bridge: WorldBridge; heat: number; override: number | null; onOverride: (value: number | null) => void;
  onTrigger: (kind: 'same' | 'stronger' | 'pr') => void; top: number;
}) {
  const [line, setLine] = useState('Glut: …');
  const [trackWidth, setTrackWidth] = useState(1);
  useEffect(() => {
    let lastFrames = bridge.debug.frames.value;
    // Twice a second: read the UI-thread counters (reading shared values from JS is cheap).
    const interval = setInterval(() => {
      const frames = bridge.debug.frames.value;
      const fps = (frames - lastFrames) * 2;
      lastFrames = frames;
      setLine(`Glut: ${bridge.debug.mode.value}\n${Platform.OS} · Canvas ${bridge.debug.width.value}×${bridge.debug.height.value} · Karte oben ${Math.round(bridge.cardTop.value)} · Partikel ${bridge.debug.particles.value} · ${fps} fps`);
    }, 500);
    return () => clearInterval(interval);
  }, [bridge]);
  // Drag or tap anywhere on the track to set the heat.
  const slide = useMemo(() => Gesture.Pan().runOnJS(true).minDistance(0)
    .onBegin((event) => onOverride(Math.max(0, Math.min(1, event.x / trackWidth))))
    .onUpdate((event) => onOverride(Math.max(0, Math.min(1, event.x / trackWidth)))), [onOverride, trackWidth]);
  const shown = override ?? heat;
  // Collapsible so the ghost and the glow stay visible while testing.
  const [open, setOpen] = useState(true);
  return <View pointerEvents="box-none" style={[styles.box, { top }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Debug einklappen' : 'Debug aufklappen'} onPress={() => setOpen((value) => !value)}>
      <Text numberOfLines={open ? undefined : 1} style={styles.text}>{open ? '▴ ' : '▾ '}{line}</Text>
    </Pressable>
    {open && <>
    <View style={styles.row}>
      <Text style={styles.label}>Hitze {shown.toFixed(2).replace('.', ',')}{override === null ? ' (echt)' : ' (überschrieben)'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Hitze-Überschreibung aus" onPress={() => onOverride(null)} style={styles.small}><Text style={styles.smallText}>Aus</Text></Pressable>
    </View>
    <GestureDetector gesture={slide}>
      <View accessibilityRole="adjustable" accessibilityLabel={`Hitze überschreiben, ${Math.round(shown * 100)} Prozent`} onLayout={(event) => setTrackWidth(Math.max(1, event.nativeEvent.layout.width))} style={styles.track}>
        <View style={[styles.fill, { width: `${shown * 100}%` }]} />
        <View style={[styles.thumb, { left: `${shown * 100}%` }]} />
      </View>
    </GestureDetector>
    <View style={styles.row}>
      {([['same', 'Satz'], ['stronger', 'Stärker'], ['pr', 'PR']] as const).map(([kind, label]) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`${label} auslösen`} onPress={() => onTrigger(kind)} style={styles.button}>
        <Text style={styles.smallText}>{label} auslösen</Text>
      </Pressable>)}
    </View>
    </>}
  </View>;
});

const styles = StyleSheet.create({
  box: { position: 'absolute', left: T.space.s, right: T.space.s, padding: T.space.s, gap: T.space.xs, borderRadius: T.radius.tile, backgroundColor: T.ghost.bubble, zIndex: 100 },
  text: { fontFamily: T.font.label, fontSize: 11, lineHeight: 15, color: T.ghost.bubbleInk },
  row: { flexDirection: 'row', alignItems: 'center', gap: T.space.xs },
  label: { flex: 1, fontFamily: T.font.label, fontSize: 12, color: T.ghost.bubbleInk },
  track: { height: T.touch, justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: 6, borderRadius: T.radius.bar, backgroundColor: T.color.accent },
  thumb: { position: 'absolute', width: 22, height: 22, marginLeft: -11, borderRadius: T.radius.circle, backgroundColor: T.color.accent, borderWidth: 2, borderColor: T.ghost.bubble },
  small: { minHeight: 32, paddingHorizontal: T.space.s, justifyContent: 'center', borderRadius: T.radius.pill, borderWidth: T.border, borderColor: T.ghost.bubbleInk },
  button: { flex: 1, minHeight: T.touch, alignItems: 'center', justifyContent: 'center', borderRadius: T.radius.pill, backgroundColor: T.color.accentLight },
  smallText: { fontFamily: T.font.label, fontSize: 12, color: T.ghost.bubbleInk },
});
