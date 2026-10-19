import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { GlowBlobSvg } from '@/components/berkk/glow-blob';
import { GhostIcon } from '@/components/berkk/icons';

const BOB_DISTANCE = 3;
const BOB_DURATION = 2200;
const GLOW_SCALE = 2.4;

type AnimatedGhostIconProps = {
  size?: number;
  color: string;
  glowColor: string;
};

/** The ghost drifts up and back down a few px and glows a little brighter at the top — kept deliberately subtle. */
export function AnimatedGhostIcon({ size = 26, color, glowColor }: AnimatedGhostIconProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: BOB_DURATION, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [progress]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value * BOB_DISTANCE }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.3,
  }));

  const glowSize = size * GLOW_SCALE;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            left: (size - glowSize) / 2,
            top: (size - glowSize) / 2,
          },
          glowStyle,
        ]}>
        <GlowBlobSvg color={glowColor} size={glowSize} opacity={0.9} />
      </Animated.View>
      <Animated.View style={floatStyle}>
        <GhostIcon size={size} color={color} />
      </Animated.View>
    </View>
  );
}
