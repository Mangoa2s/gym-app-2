import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { StartIcon } from '@/components/berkk/icons';
import { Berkk, BerkkFonts } from '@/constants/theme';

const RADIUS = 26;

/**
 * Full-width primary action. Ported from the mockup's `startStyle`/`onStart` logic:
 * tapping toggles between the warm gradient "Workout starten" and a glass
 * "Workout läuft" state, with a quick 0.975 press-scale.
 */
export function CtaButton() {
  const [started, setStarted] = useState(false);

  return (
    <Pressable onPress={() => setStarted((s) => !s)} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.975 : 1 }] })}>
      <LinearGradient
        colors={started ? Berkk.ctaGlassGradient : Berkk.ctaGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.35 }}
        className="h-20 flex-row items-center gap-3.5 px-[26px] overflow-hidden"
        style={{ borderRadius: RADIUS }}>
        {started && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
        <StartIcon size={26} color={started ? Berkk.ink : Berkk.ctaInk} />
        <Text
          style={{
            fontFamily: BerkkFonts.black,
            color: started ? Berkk.ink : Berkk.ctaInk,
            fontSize: 22,
            letterSpacing: -0.9,
          }}>
          {started ? 'Workout läuft' : 'Workout starten'}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
