/**
 * Workout history. Modelled on Hevy/Strava history lists (week groups, stat rows)
 * and Apple Fitness' weekly day circles. BERKK twist: a per-workout muscle
 * balance bar and an orange PR strip, the only loud element on the screen.
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useStore } from "zustand";

import { FilterChips } from "@/components/history/filter-chips";
import { WeekCard } from "@/components/history/week-card";
import { WorkoutCard } from "@/components/history/workout-card";
import { WorkoutStorageStatus } from "@/components/berkk/workout-storage-status";
import { useWorkoutLauncher } from "@/components/berkk/workout-timer-overlay";
import { Tokens as T } from "@/constants/theme";
import { useLocalDay } from "@/hooks/use-local-day";
import {
  FILTERS,
  formatTons,
  historyLevel,
  historySections,
  summarizeHistory,
  weekOverview,
  type HistorySection,
  type SplitFilter,
  type WorkoutSummary,
} from "@/lib/history";
import { onboardingStore } from "@/store/onboarding";
import { workoutStore } from "@/store/workout";

/** Floating tab bar (8 + 68) plus breathing room, as in the calendar. */
const TAB_CLEARANCE = 8 + 68 + 10;
/** TODO(progression): until a weekly goal setting exists, the onboarding training days are the goal. */
const DEFAULT_WEEKLY_GOAL = 3;

export default function HistoryScreen() {
  const hydrated = useStore(workoutStore, (state) => state.hydrated);
  return hydrated ? <History /> : <WorkoutStorageStatus />;
}

function History() {
  const history = useStore(workoutStore, (state) => state.history);
  const plannedDays = useStore(
    onboardingStore,
    (state) => state.profile.days?.length ?? 0,
  );
  const today = useLocalDay();
  const insets = useSafeAreaInsets();
  const launcher = useWorkoutLauncher();
  const [filter, setFilter] = useState<SplitFilter>("all");
  const summaries = useMemo(() => summarizeHistory(history), [history]);
  const sections = useMemo(
    () => historySections(summaries, filter, today),
    [summaries, filter, today],
  );
  const week = useMemo(
    () => weekOverview(summaries, today, plannedDays || DEFAULT_WEEKLY_GOAL),
    [summaries, today, plannedDays],
  );
  const level = useMemo(() => historyLevel(summaries), [summaries]);
  const open = useCallback(
    (id: number) =>
      router.push({ pathname: "/history/[id]", params: { id: String(id) } }),
    [],
  );
  const renderItem = useCallback(
    ({ item }: { item: WorkoutSummary }) => (
      <WorkoutCard summary={item} today={today} onOpen={open} />
    ),
    [open, today],
  );
  const renderSectionHeader = useCallback(
    ({ section }: { section: HistorySection }) => (
      <View accessibilityRole="header" style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionMeta}>
          {section.count} {section.count === 1 ? "Training" : "Trainings"} ·{" "}
          {formatTons(section.volumeKg)} t
        </Text>
      </View>
    ),
    [],
  );
  const count = summaries.length;
  const filterLabel = FILTERS.find((item) => item.key === filter)?.label;

  const header = (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.title}>
        Historie
      </Text>
      <Text style={styles.subtitle}>
        {count === 1 ? "1 Training insgesamt" : `${count} Trainings insgesamt`}
      </Text>
      <View style={styles.block}>
        <WeekCard {...week} level={level} />
      </View>
      {count > 0 && (
        <View style={styles.block}>
          <FilterChips value={filter} onChange={setFilter} />
        </View>
      )}
    </View>
  );

  const empty =
    count === 0 ? (
      <View style={styles.empty}>
        <Ionicons
          accessible={false}
          name="barbell-outline"
          size={28}
          color={T.color.accentLight}
        />
        <Text style={styles.emptyTitle}>Noch keine Trainings</Text>
        <Text style={styles.emptyText}>
          Dein erstes abgeschlossenes Training erscheint hier, mit Dauer,
          Volumen, Sätzen und deinen Rekorden.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Workout starten"
          onPress={() => launcher.start(null)}
          style={styles.emptyAction}
        >
          <Text style={styles.emptyActionText}>Workout starten</Text>
        </Pressable>
      </View>
    ) : (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Keine {filterLabel}-Trainings in deiner Historie.
        </Text>
      </View>
    );

  return (
    <LinearGradient
      colors={T.color.background}
      locations={[0, 0.3, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.6, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
        <SectionList
          testID="history-list"
          sections={sections}
          keyExtractor={(item) => String(item.workout.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ItemSeparatorComponent={Separator}
          stickySectionHeadersEnabled={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + TAB_CLEARANCE + T.space.l },
          ]}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: T.space.xl,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  header: { paddingTop: T.space.l },
  title: {
    fontFamily: T.font.hero,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: T.color.ink,
  },
  subtitle: {
    fontFamily: T.font.meta,
    fontSize: 15,
    lineHeight: 21,
    color: T.color.inkSoft,
    marginTop: T.space.xs,
  },
  block: { marginTop: T.space.xl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: T.space.m,
    paddingTop: T.space.xxl,
    paddingBottom: T.space.m,
  },
  sectionTitle: {
    fontFamily: T.font.title,
    fontSize: 17,
    lineHeight: 22,
    color: T.color.ink,
  },
  sectionMeta: {
    fontFamily: T.font.meta,
    fontSize: 13,
    lineHeight: 18,
    color: T.color.inkMuted,
    fontVariant: ["tabular-nums"],
  },
  separator: { height: T.space.m },
  empty: {
    alignItems: "center",
    gap: T.space.s,
    paddingVertical: T.space.xxxl,
    paddingHorizontal: T.space.l,
  },
  emptyTitle: {
    fontFamily: T.font.title,
    fontSize: 18,
    lineHeight: 24,
    color: T.color.ink,
    marginTop: T.space.xs,
  },
  emptyText: {
    fontFamily: T.font.meta,
    fontSize: 14,
    lineHeight: 21,
    color: T.color.inkSoft,
    textAlign: "center",
  },
  emptyAction: {
    marginTop: T.space.m,
    minHeight: T.touch,
    paddingHorizontal: T.space.xxl,
    borderRadius: T.radius.pill,
    backgroundColor: T.color.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionText: {
    fontFamily: T.font.title,
    fontSize: 15,
    color: T.color.onAccent,
  },
});
