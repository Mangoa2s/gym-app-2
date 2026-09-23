import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

type GlowBlobProps = {
  color: string;
  size: number;
  opacity?: number;
  style: ViewStyle;
};

function GlowBlobSvg({ color, size, opacity = 0.4 }: Omit<GlowBlobProps, 'style'>) {
  const gradientId = `glow-${color.replace('#', '')}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="65%" stopColor={color} stopOpacity={opacity * 0.55} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradientId})`} />
    </Svg>
  );
}

/**
 * Soft ambient glow blob. Approximates the mockup's
 * `border-radius:50%;filter:blur(Npx);opacity:.4` circles with an SVG radial
 * gradient (React Native can't blur an arbitrary View's own content).
 */
export function GlowBlob({ color, size, opacity = 0.4, style }: GlowBlobProps) {
  return (
    <View style={[{ position: 'absolute', width: size, height: size }, style]} pointerEvents="none">
      <GlowBlobSvg color={color} size={size} opacity={opacity} />
    </View>
  );
}

type AnimatedGlowBlobProps = GlowBlobProps & {
  /** Max horizontal/vertical drift in px. */
  driftX?: number;
  driftY?: number;
  /** One drift-and-back cycle, in ms. */
  duration?: number;
  /** Stagger the start so blobs don't move in lockstep. */
  delay?: number;
};

/** Same glow blob, gently drifting/breathing forever — same colors and pattern, just alive. */
export function AnimatedGlowBlob({
  color,
  size,
  opacity = 0.4,
  style,
  driftX = 26,
  driftY = 20,
  duration = 9000,
  delay = 0,
}: AnimatedGlowBlobProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [delay, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-driftX, driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [driftY * 0.4, -driftY]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1.1]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', width: size, height: size }, style, animatedStyle]}
      pointerEvents="none">
      <GlowBlobSvg color={color} size={size} opacity={opacity} />
    </Animated.View>
  );
}
