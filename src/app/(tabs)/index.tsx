import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useStore } from 'zustand';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WeightEditor } from '@/components/berkk/weight-editor';
import { DEVELOPMENT_WEIGHT } from '@/components/berkk/weight-picker-state';
import { useDetailSheet } from '@/components/berkk/detail-sheet';
import { CtaButton } from '@/components/berkk/cta-button';
import { DayBadge } from '@/components/berkk/day-badge';
import { EnergyCard } from '@/components/berkk/energy-card';
import { GlassSurface } from '@/components/berkk/glass-surface';
import { GlowBlob } from '@/components/berkk/glow-blob';
import { AddIcon, FilterIcon } from '@/components/berkk/icons';
import { RoundIconButton } from '@/components/berkk/round-icon-button';
import { TrainingHeatmap } from '@/components/berkk/training-heatmap';
import { useWorkoutLauncher } from '@/components/berkk/workout-timer-overlay';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { useBodyWeight } from '@/store/body-weight';
import { formatWeight, formatWeightDate } from '@/store/body-weight-state';
import { workoutStore } from '@/store/workout';
import { completedDays, formatDay, trainingStreak } from '@/data/calendar';
import { useLocalDay } from '@/hooks/use-local-day';
import { onboardingStore } from '@/store/onboarding';

// Placeholder data — wire up to the workout/steps stores once they exist.
const volume = { value: '12.480', unit: 'kg', label: 'Volumen', sub: 'Letzte 7 Tage' };
const steps = { value: '7.842', label: 'Schritte', sub: 'Ziel 10.000' };

export default function HomeScreen() {
  const [energy, setEnergy] = useState(72);
  // Dragging the energy bolt must not scroll the page underneath it.
  const [energyDragging, setEnergyDragging] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const workout = useWorkoutLauncher();
  const today = useLocalDay();
  const plans = useStore(workoutStore, (state) => state.plans);
  const nextWorkout = [...plans].filter((plan) => plan.localDate >= today).sort((a, b) => a.localDate.localeCompare(b.localDate))[0];

  return (
    <View className="flex-1" style={{ backgroundColor: '#121016' }}>
      <LinearGradient
        colors={Berkk.backgroundGradient}
        locations={Berkk.backgroundGradientLocations}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GlowBlob color={Berkk.glowOrange} size={280} opacity={0.42} style={{ top: -60, left: -70 }} />
      <GlowBlob color={Berkk.glowBlue} size={260} opacity={0.38} style={{ top: 300, right: -90 }} />
      <GlowBlob color={Berkk.glowPurple} size={320} opacity={0.42} style={{ bottom: -70, left: -40 }} />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Gesture-handler ScrollView (not NativeWind-patched, hence `style`) so the energy card can block it by ref. */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          scrollEnabled={!energyDragging}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 140, gap: 13 }}
          showsVerticalScrollIndicator={false}>
          <Header />

          <EnergyCard value={energy} onChange={setEnergy} scrollRef={scrollRef} onDraggingChange={setEnergyDragging} />

          <View className="flex-row gap-[13px]">
            <View className="flex-1">
              <Pressable accessibilityRole="button" accessibilityLabel="Trainingsplanung öffnen" onPress={() => router.navigate('/plan')}><WorkoutCard day={nextWorkout ? Number(nextWorkout.localDate.slice(-2)) : 0} title={nextWorkout?.name ?? 'Dein nächstes Workout'} subtitle={nextWorkout ? formatDay(nextWorkout.localDate, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Im Kalender planen'} /></Pressable>
            </View>
            <View className="flex-1">
              <BodyWeightCard />
            </View>
          </View>

          <TrainingCard />

          <StatRow label={volume.label} sub={volume.sub} value={volume.value} unit={volume.unit} />
          <StatRow label={steps.label} sub={steps.sub} value={steps.value} />

          <CtaButton onPress={workout.start} running={workout.resumable} />
          {__DEV__ && <Pressable accessibilityRole="button" onPress={() => { onboardingStore.getState().restart(); router.push('/onboarding'); }} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 12 }}>Onboarding erneut testen</Text></Pressable>}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Header() {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        style={{
          fontFamily: BerkkFonts.black,
          color: Berkk.ink,
          fontSize: 42,
          letterSpacing: -2.1,
          lineHeight: 42,
        }}>
        Workouts
      </Text>
      <View className="flex-row gap-[10px]">
        <RoundIconButton accessibilityLabel="Filter">
          <FilterIcon color={Berkk.ink} />
        </RoundIconButton>
        <RoundIconButton accessibilityLabel="Workout hinzufügen">
          <AddIcon color={Berkk.ink} />
        </RoundIconButton>
      </View>
    </View>
  );
}

function WorkoutCard({ day, title, subtitle }: { day: number; title: string; subtitle: string }) {
  return (
    <GlassSurface radius={26} style={{ height: 184 }} className="p-5 justify-between">
      <View className="flex-row items-start justify-between">
        {day > 0 ? <DayBadge number={day} variant="faint" /> : <AddIcon color={Berkk.inkSecondary} />}
        <FilterIcon size={17} color={Berkk.inkMuted} />
      </View>
      <View>
        <Text style={{ fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 }}>
          {title}
        </Text>
        <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 3 }}>
          {subtitle}
        </Text>
      </View>
    </GlassSurface>
  );
}

function BodyWeightCard() {
  const { present } = useDetailSheet();
  const { currentWeight, entries, hydrated, loadError } = useBodyWeight();
  const value = formatWeight(currentWeight ?? DEVELOPMENT_WEIGHT);
  const latestDate = entries.at(-1)?.date;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Körpergewicht, ${value} kg`}
      accessibilityHint="Öffnet Gewichtseingabe und Verlauf"
      onPress={() => present({ title: 'Körpergewicht', layout: 'full', content: <WeightEditor /> })}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
      <GlassSurface radius={26} style={{ height: 184 }} className="p-5 justify-between">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-baseline gap-[5px]">
            <Text
              style={{
                fontFamily: BerkkFonts.black,
                color: Berkk.ink,
                fontSize: 40,
                letterSpacing: -2,
                lineHeight: 40,
              }}>
              {value}
            </Text>
            <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 15 }}>
              kg
            </Text>
          </View>

        </View>
        <View>
          <Text style={{ fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 }}>
            Körpergewicht
          </Text>
          <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 3 }}>
            {loadError ? 'Laden fehlgeschlagen' : !hydrated ? 'Wird geladen …' : latestDate ? formatWeightDate(latestDate) : 'Noch kein Eintrag'}
          </Text>
        </View>
      </GlassSurface>
    </Pressable>
  );
}

function TrainingCard() {
  const history = useStore(workoutStore, (state) => state.history);
  const today = useLocalDay();
  const streak = trainingStreak(history, today);
  const count = completedDays(history).size;
  return (
    <GlassSurface radius={26} className="pt-5 px-[22px] pb-[18px]">
      <TrainingHeatmap />
      <View className="flex-row items-center gap-[14px]" style={{ marginTop: 20 }}>
        <DayBadge number={streak} size={44} variant="solid" />
        <View className="flex-1">
          <Text style={{ fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 }}>
            {streak === 1 ? '1 Tag in Folge' : `${streak} Tage in Folge`}
          </Text>
          <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 2 }}>
            {count === 1 ? '1 Trainingstag insgesamt' : `${count} Trainingstage insgesamt`}
          </Text>
        </View>
        <FilterIcon size={17} color={Berkk.inkMuted} />
      </View>
    </GlassSurface>
  );
}

function StatRow({ label, sub, value, unit }: { label: string; sub: string; value: string; unit?: string }) {
  return (
    <GlassSurface radius={22} style={{ height: 74 }} className="flex-row items-center px-5">
      <View className="flex-1">
        <Text style={{ fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16, letterSpacing: -0.15 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 2 }}>
          {sub}
        </Text>
      </View>
      <View
        className="flex-row items-baseline gap-[5px]"
        style={{ paddingRight: 18, borderRightWidth: 1, borderRightColor: Berkk.divider }}>
        <Text style={{ fontFamily: BerkkFonts.black, color: Berkk.ink, fontSize: 26, letterSpacing: -1 }}>
          {value}
        </Text>
        {unit && (
          <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14 }}>{unit}</Text>
        )}
      </View>
      <View style={{ marginLeft: 16 }}>
        <FilterIcon size={17} color={Berkk.inkMuted} />
      </View>
    </GlassSurface>
  );
}
