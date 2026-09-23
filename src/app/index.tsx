import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CtaButton } from '@/components/berkk/cta-button';
import { DayBadge } from '@/components/berkk/day-badge';
import { GlassSurface } from '@/components/berkk/glass-surface';
import { AnimatedGlowBlob } from '@/components/berkk/glow-blob';
import { AddIcon, FilterIcon } from '@/components/berkk/icons';
import { RoundIconButton } from '@/components/berkk/round-icon-button';
import { TrainingHeatmap } from '@/components/berkk/training-heatmap';
import { Berkk, BerkkFonts } from '@/constants/theme';

// Placeholder data — wire up to the workout/body-weight/steps stores once they exist.
const nextWorkout = { day: 1, title: 'Brust + Trizeps', subtitle: 'Samstag' };
const secondWorkout = { day: 2, title: 'Rücken + Bizeps + Beine', subtitle: 'Montag' };
const bodyWeight = { value: '82,4', unit: 'kg', updatedAt: 'vor 31 Min' };
const volume = { value: '12.480', unit: 'kg', label: 'Volumen', sub: 'Letzte 7 Tage' };
const steps = { value: '7.842', label: 'Schritte', sub: 'Ziel 10.000' };

export default function HomeScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: '#121016' }}>
      <LinearGradient
        colors={Berkk.backgroundGradient}
        locations={Berkk.backgroundGradientLocations}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AnimatedGlowBlob
        color={Berkk.glowOrange}
        size={280}
        opacity={0.42}
        style={{ top: -60, left: -70 }}
        duration={10000}
      />
      <AnimatedGlowBlob
        color={Berkk.glowBlue}
        size={260}
        opacity={0.38}
        style={{ top: 300, right: -90 }}
        duration={12000}
        delay={1200}
      />
      <AnimatedGlowBlob
        color={Berkk.glowPurple}
        size={320}
        opacity={0.42}
        style={{ bottom: -70, left: -40 }}
        duration={11000}
        delay={2400}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 140, gap: 13 }}
          showsVerticalScrollIndicator={false}>
          <Header />

          <View className="flex-row gap-[13px]">
            <View className="flex-1">
              <WorkoutCard day={nextWorkout.day} title={nextWorkout.title} subtitle={nextWorkout.subtitle} />
            </View>
            <View className="flex-1">
              <BodyWeightCard />
            </View>
          </View>

          <TrainingCard />

          <StatRow label={volume.label} sub={volume.sub} value={volume.value} unit={volume.unit} />
          <StatRow label={steps.label} sub={steps.sub} value={steps.value} />

          <CtaButton />
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
        <DayBadge number={day} variant="faint" />
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
  return (
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
            {bodyWeight.value}
          </Text>
          <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 15 }}>
            {bodyWeight.unit}
          </Text>
        </View>
        <FilterIcon size={17} color={Berkk.inkMuted} />
      </View>
      <View>
        <Text style={{ fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 }}>
          Körpergewicht
        </Text>
        <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 3 }}>
          {bodyWeight.updatedAt}
        </Text>
      </View>
    </GlassSurface>
  );
}

function TrainingCard() {
  return (
    <GlassSurface radius={26} className="pt-5 px-[22px] pb-[18px]">
      <TrainingHeatmap />
      <View className="flex-row items-center gap-[14px]" style={{ marginTop: 20 }}>
        <DayBadge number={secondWorkout.day} size={44} variant="solid" />
        <View className="flex-1">
          <Text style={{ fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 }}>
            {secondWorkout.title}
          </Text>
          <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 2 }}>
            {secondWorkout.subtitle}
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
