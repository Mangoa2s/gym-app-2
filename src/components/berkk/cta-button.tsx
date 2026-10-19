import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { BerkkActionSurface } from '@/components/berkk/berkk-action-surface';
import { useWorkoutMotion } from '@/components/berkk/workout-motion-provider';
import { WorkoutMotion as M } from '@/constants/workout-motion';

type CtaButtonProps = {
  onPress: (node: View | null) => void;
  running?: boolean;
};

/** Keep the measured launch origin and the existing shared entrance clock. */
export function CtaButton({ onPress, running = false }: CtaButtonProps) {
  const node = useRef<View>(null);
  const { clock, overlayReady, reduced } = useWorkoutMotion();
  const surface = useAnimatedStyle(() => ({
    opacity: overlayReady.value ? 0 : 1,
    transform: [{ scale: reduced ? 1 : interpolate(clock.value, [0, M.compressEnd, M.duration], [1, M.buttonScale, 1], Extrapolation.CLAMP) }],
  }));
  const label = useAnimatedStyle(() => ({
    opacity: interpolate(clock.value, [0, M.compressEnd, M.duration - 1, M.duration], [1, 0, 0, 1], Extrapolation.CLAMP),
  }));
  return (
    <View ref={node} collapsable={false}>
      <Pressable onPress={() => onPress(node.current)} accessibilityRole="button" accessibilityLabel={running ? 'Zum Training' : 'Workout starten'}>
        <Animated.View style={surface}>
          <BerkkActionSurface variant="start" label={running ? 'Zum Training' : 'Workout starten'} reduced={reduced} labelStyle={label} />
        </Animated.View>
      </Pressable>
    </View>
  );
}
