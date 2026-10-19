import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import { useActiveElapsed } from '@/hooks/use-workout-timer';
import { formatTons } from '@/lib/history';
import { leaderOf, sessionTotals, vsProgress, type Leader } from '@/lib/lock-in';
import type { WorkoutHistory, WorkoutSession } from '@/store/workout-state';

/** Free training: "Heute x,x t · n Sätze". */
export const FreeLine = memo(function FreeLine({ session }: { session: WorkoutSession }) {
  const { volumeKg, sets } = sessionTotals(session);
  return <View accessible accessibilityLabel={`Heute ${formatTons(volumeKg)} Tonnen, ${sets} ${sets === 1 ? 'Satz' : 'Sätze'}`} style={styles.free}>
    <Text style={styles.freeText}>Heute <Text style={styles.strong}>{formatTons(volumeKg)} t</Text> · <Text style={styles.strong}>{sets}</Text> {sets === 1 ? 'Satz' : 'Sätze'}</Text>
  </View>;
});

/**
 * VS mode: Start → Ziel (last time's volume). DU moves with confirmed sets, the
 * GEIST with last time's completedAt timeline. Lead changes are reported once.
 */
export const VsLine = memo(function VsLine({ session, opponent, compact = false, onLeadChange }: { session: WorkoutSession; opponent: WorkoutHistory; compact?: boolean; onLeadChange: (leader: Leader) => void }) {
  const activeMs = useActiveElapsed(session.startedAt, session.pausedMs, session.pausedAt, 1000);
  const race = vsProgress(session, opponent, activeMs);
  const leader = leaderOf(race.youValue, race.ghostValue);
  const previous = useRef<Leader>(leader);
  useEffect(() => {
    if (leader !== previous.current && leader !== 'tie') onLeadChange(leader);
    previous.current = leader;
  }, [leader, onLeadChange]);
  const goal = race.byVolume ? `${formatTons(race.goal)} t` : `${race.goal} ${race.goal === 1 ? 'Satz' : 'Sätze'}`;
  const you = race.byVolume ? `${formatTons(race.youValue)} t` : `${race.youValue} Sätze`;
  return <View accessible accessibilityLabel={`VS-Modus. Du: ${you}. Ziel vom letzten Mal: ${goal}.${race.timed ? ` Geist: ${Math.round(race.ghost * 100)} Prozent.` : ''}`} style={[styles.vs, compact && styles.compactVs]}>
    <View style={styles.labels}><Text style={styles.edge}>Start</Text><Text style={styles.edge}>Ziel · {goal}</Text></View>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${race.you * 100}%` }]} />
      {race.timed && <Marker share={race.ghost} label="GEIST" ghost />}
      <Marker share={race.you} label="DU" />
    </View>
  </View>;
});

function Marker({ share, label, ghost = false }: { share: number; label: string; ghost?: boolean }) {
  return <View style={[styles.marker, { left: `${share * 100}%` }]}>
    <View style={[styles.dot, ghost ? styles.ghostDot : styles.youDot]} />
    <Text style={[styles.markerLabel, ghost && styles.ghostLabel, ghost ? styles.below : styles.above]}>{label}</Text>
  </View>;
}

const DOT = 12;
const styles = StyleSheet.create({
  free: { alignItems: 'center', paddingVertical: T.space.s },
  freeText: { fontFamily: T.font.body, fontSize: 14, color: T.color.inkSoft },
  strong: { fontFamily: T.font.label, color: T.color.ink },
  vs: { paddingHorizontal: T.space.xxl, paddingTop: T.space.s, paddingBottom: T.space.xl },
  compactVs: { paddingTop: T.space.xxs, paddingBottom: T.space.l },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: T.space.l },
  edge: { fontFamily: T.font.meta, fontSize: 11, color: T.color.inkMuted },
  track: { height: 4, borderRadius: T.radius.bar, backgroundColor: T.color.track },
  fill: { height: 4, borderRadius: T.radius.bar, backgroundColor: T.color.accentBorder },
  marker: { position: 'absolute', top: -(DOT - 4) / 2, width: DOT, marginLeft: -DOT / 2, alignItems: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: T.radius.circle },
  youDot: { backgroundColor: T.color.accent, borderWidth: 2, borderColor: T.color.ink },
  ghostDot: { backgroundColor: T.color.ghostDot },
  markerLabel: { position: 'absolute', width: 48, textAlign: 'center', fontFamily: T.font.label, fontSize: 10, letterSpacing: 0.6, color: T.color.accentLight },
  ghostLabel: { color: T.color.inkMuted },
  above: { bottom: DOT + 2 },
  below: { top: DOT + 2 },
});
