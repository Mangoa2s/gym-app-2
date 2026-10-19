import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useWorkoutMotion } from './workout-motion-provider';
import { DiaryMotion as M } from '@/constants/diary-motion';
import { Berkk, BerkkFonts } from '@/constants/theme';

export function DiaryAction({ label, accessibilityLabel, onPress, disabled, primary = false, icon, style, surfaceStyle, children, testID }: {
  label: string; accessibilityLabel?: string; onPress: () => void; disabled?: boolean; primary?: boolean;
  icon?: 'add' | 'checkmark' | 'arrow-forward'; style?: StyleProp<ViewStyle>; surfaceStyle?: StyleProp<ViewStyle>; children?: ReactNode; testID?: string;
}) {
  const { reduced } = useWorkoutMotion();
  const pressure = useSharedValue(0);
  const motion = useAnimatedStyle(() => ({
    opacity: disabled ? 0.55 : 1 - pressure.value * 0.15,
    transform: [{ scale: reduced ? 1 : 1 - pressure.value * (1 - M.pressedScale) }],
  }));
  useEffect(() => () => cancelAnimation(pressure), [pressure]);
  const press = (value: number) => pressure.set(withTiming(value, { duration: M.pressMs, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    onPressIn={() => press(1)} onPressOut={() => press(0)} style={[styles.target, style]}>
    <Animated.View testID={testID} style={[styles.surface, primary && styles.primary, surfaceStyle, motion]}>
      {children ?? <><Text style={[styles.label, primary && styles.primaryLabel]}>{label}</Text>
        {icon && <Ionicons accessible={false} name={icon} size={21} color={primary ? Berkk.ctaInk : Berkk.link} />}</>}
    </Animated.View>
  </Pressable>;
}

const styles = StyleSheet.create({
  target: { minHeight: 48, minWidth: 48 },
  surface: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primary: { backgroundColor: Berkk.link, minHeight: 54, paddingHorizontal: 20 },
  label: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 14, lineHeight: 20 },
  primaryLabel: { color: Berkk.ctaInk, fontFamily: BerkkFonts.bold, fontSize: 16, lineHeight: 22 },
});
