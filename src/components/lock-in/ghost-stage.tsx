import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { GhostPulse } from '@/components/berkk/ghost-state';
import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import type { Speech } from '@/lib/lock-in';
import { DraggableGhost } from './draggable-ghost';
import { GhostBurst, type Burst } from './ghost-burst';
import type { WorldBridge } from './world-bridge';

/**
 * The ghost in the middle, its line (big + small) and the stronger-streak chip.
 * The stage never shrinks below ghost + one line, so nothing overlaps on small
 * phones; on those the subtitle and chip share one row and lines stay single.
 */
export const GhostStage = memo(function GhostStage({ pulse, burst, speech, streak, size, compact, reduced, active, bridge, screenWidth, topLimit }: {
  pulse: GhostPulse | null; burst: Burst | null; speech: Speech; streak: number; size: number; compact: boolean; reduced: boolean; active: boolean;
  /** Ghost ↔ Glut-Welt connection and the throw bounds (screen width, top edge). */
  bridge: WorldBridge; screenWidth: number; topLimit: number;
}) {
  const chip = streak >= L.streakChipFrom && <View accessible accessibilityLabel={`${streak} Sätze in Folge stärker als letztes Mal`} style={styles.chip}>
    <Text style={styles.chipText}>{streak}× stärker in Folge</Text>
  </View>;
  return <View style={[styles.stage, { minHeight: size + (compact ? L.compactSpeechSpace : L.speechSpace) }, compact && styles.compactStage]}>
    <View style={[styles.ghostSlot, { width: size, height: size }]}>
      <GhostBurst burst={burst} size={size} reduced={reduced} />
      <DraggableGhost size={size} pulse={pulse} idle={active} reduced={reduced} bridge={bridge} screenWidth={screenWidth} topLimit={topLimit} />
    </View>
    <View accessible accessibilityLiveRegion="polite" accessibilityLabel={speech.subtitle ? `${speech.title}. ${speech.subtitle}` : speech.title} style={styles.speech}>
      <Animated.Text key={speech.title} entering={reduced ? undefined : FadeIn.duration(180)} numberOfLines={compact ? 1 : 2} style={[styles.title, compact && styles.compactTitle]}>{speech.title}</Animated.Text>
      {speech.subtitle && <Text numberOfLines={1} style={styles.subtitle}>{speech.subtitle}</Text>}
    </View>
    {chip}
  </View>;
});

const styles = StyleSheet.create({
  stage: { flexGrow: 1, flexShrink: 0, alignItems: 'center', justifyContent: 'center', gap: T.space.m, paddingHorizontal: T.space.xxl },
  compactStage: { gap: T.space.xs },
  // Above the speech line, so a thrown ghost and its bubble are never hidden behind text.
  ghostSlot: { zIndex: 2 },
  compactTitle: { fontSize: 17, lineHeight: 22 },
  speech: { alignItems: 'center', gap: T.space.xxs, maxWidth: 420 },
  title: { fontFamily: T.font.title, fontSize: 20, lineHeight: 26, color: T.color.ink, textAlign: 'center' },
  subtitle: { fontFamily: T.font.meta, fontSize: 14, lineHeight: 20, color: T.color.inkSoft, textAlign: 'center' },
  chip: { paddingHorizontal: T.space.m, paddingVertical: T.space.xs, borderRadius: T.radius.pill, backgroundColor: T.color.accentWash, borderWidth: T.border, borderColor: T.color.accentBorder },
  chipText: { fontFamily: T.font.label, fontSize: 12, color: T.color.accentLight },
});
