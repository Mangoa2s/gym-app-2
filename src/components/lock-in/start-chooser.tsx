import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import { formatTons, setVolumeKg } from '@/lib/history';
import { templateOpponent } from '@/lib/lock-in';
import type { WorkoutHistory, WorkoutTemplate } from '@/store/workout-state';

/** First choice of a fresh session: free training, or a saved workout in VS mode. */
export const StartChooser = memo(function StartChooser({ templates, history, onChoose }: { templates: WorkoutTemplate[]; history: WorkoutHistory[]; onChoose: (templateId: string | null) => void }) {
  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text accessibilityRole="header" style={styles.heading}>Wie trainierst du heute?</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Freies Training. Übungen unterwegs hinzufügen" onPress={() => onChoose(null)} style={[styles.card, styles.free]}>
      <View style={styles.icon}><Ionicons accessible={false} name="add" size={24} color={T.color.onAccent} /></View>
      <View style={styles.words}>
        <Text style={styles.title}>Freies Training</Text>
        <Text style={styles.meta}>Übungen unterwegs hinzufügen</Text>
      </View>
      <Ionicons accessible={false} name="chevron-forward" size={18} color={T.color.inkMuted} />
    </Pressable>
    <Text style={styles.section}>Gespeicherte Workouts</Text>
    {templates.map((template) => {
      const last = templateOpponent(history, template.id);
      const volume = last?.exercises.reduce((sum, item) => sum + item.sets.reduce((total, entry) => total + setVolumeKg(item.exercise.tracking, entry), 0), 0) ?? 0;
      const meta = `${template.exercises.length} ${template.exercises.length === 1 ? 'Übung' : 'Übungen'}${last ? ` · Letztes Mal ${formatTons(volume)} t` : ''}`;
      return <Pressable key={template.id} accessibilityRole="button" accessibilityLabel={`${template.name}, VS-Modus, ${meta}`} onPress={() => onChoose(template.id)} style={styles.card}>
        <View style={styles.words}>
          <View style={styles.badge}><Text style={styles.badgeText}>VS-MODUS</Text></View>
          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Ionicons accessible={false} name="chevron-forward" size={18} color={T.color.inkMuted} />
      </Pressable>;
    })}
  </ScrollView>;
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: T.space.xl, paddingVertical: T.space.xxl, gap: T.space.m },
  heading: { fontFamily: T.font.hero, fontSize: 28, lineHeight: 34, color: T.color.ink, marginBottom: T.space.s },
  card: { flexDirection: 'row', alignItems: 'center', gap: T.space.m, minHeight: 84, padding: T.space.l, borderRadius: T.radius.card, backgroundColor: T.color.cardFill, borderWidth: T.border, borderColor: T.color.cardBorder },
  free: { borderColor: T.color.accentBorder, backgroundColor: T.color.accentWash },
  icon: { width: T.touch, height: T.touch, borderRadius: T.radius.circle, backgroundColor: T.color.accent, alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, gap: T.space.xxs },
  title: { fontFamily: T.font.title, fontSize: 18, lineHeight: 23, color: T.color.ink },
  meta: { fontFamily: T.font.meta, fontSize: 13, lineHeight: 18, color: T.color.inkSoft },
  section: { fontFamily: T.font.label, fontSize: 12, letterSpacing: 1, color: T.color.inkMuted, marginTop: T.space.m },
  badge: { alignSelf: 'flex-start', paddingHorizontal: T.space.s, paddingVertical: T.space.xxs, borderRadius: T.radius.pill, backgroundColor: T.color.accent, marginBottom: T.space.xs },
  badgeText: { fontFamily: T.font.title, fontSize: 10, letterSpacing: 0.8, color: T.color.onAccent },
});
