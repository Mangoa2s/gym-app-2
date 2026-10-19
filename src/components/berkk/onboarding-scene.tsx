import { useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { LinearGradient as BackgroundGradient } from "expo-linear-gradient";
import { Onboarding as O } from "@/constants/onboarding";

export type OnboardingMood =
  "idle" | "curious" | "focused" | "happy" | "celebrate";
const BODY =
  "M112 143 C99 94 124 56 168 52 C207 48 220 81 247 82 C277 83 292 48 333 53 C383 60 409 99 398 144 C388 184 379 206 388 250 C397 290 424 315 410 362 C399 402 369 422 335 420 C297 418 279 386 257 385 C234 383 222 418 181 420 C141 422 106 400 101 362 C94 319 116 292 122 250 C130 208 121 178 112 143 Z";
const ease = Easing.bezier(...O.ease);

export function useOnboardingLoop(duration: number, active: boolean) {
  const phase = useSharedValue(0);
  useEffect(() => {
    if (active)
      phase.set(
        withRepeat(
          withTiming(1, { duration, easing: Easing.linear }),
          -1,
          false,
        ),
      );
    else {
      cancelAnimation(phase);
      phase.set(0);
    }
    return () => cancelAnimation(phase);
  }, [active, duration, phase]);
  return phase;
}

export function OnboardingAtmosphere({ active }: { active: boolean }) {
  const phase = useOnboardingLoop(O.motion.drift * 2, active);
  const drift = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.sin(phase.value * Math.PI * 2) * 18 },
      { translateY: Math.sin(phase.value * Math.PI * 2) * 24 },
      { scale: 1 + (1 - Math.cos(phase.value * Math.PI * 2)) * 0.045 },
    ],
  }));
  const uid = useId().replace(/:/g, "");
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BackgroundGradient
        colors={["#35180F", "#211018", "#171019", "#110C17"]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[{ position: "absolute", inset: "-20%" }, drift]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id={`${uid}warm`}
              cx="15%"
              cy="15%"
              rx="70%"
              ry="55%"
            >
              <Stop stopColor="#CC551E" stopOpacity={0.41} />
              <Stop offset="1" stopColor="#CC551E" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id={`${uid}violet`}
              cx="90%"
              cy="90%"
              rx="60%"
              ry="50%"
            >
              <Stop stopColor="#7841A6" stopOpacity={0.36} />
              <Stop offset="1" stopColor="#7841A6" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${uid}warm)`} />
          <Rect width="100%" height="100%" fill={`url(#${uid}violet)`} />
        </Svg>
      </Animated.View>
      <View
        style={{
          position: "absolute",
          top: "25%",
          left: "-35%",
          width: "170%",
          height: 420,
          borderRadius: 500,
          borderTopWidth: 1,
          borderColor: "#FFA66B18",
          transform: [{ rotate: "-15deg" }],
          opacity: 0.7,
        }}
      />
    </View>
  );
}

/** Exact reference paths and gradient; transforms and opacity run on the UI thread. */
export function OnboardingScene({
  step,
  compact,
  width,
  top,
  active,
  reduced,
  mood,
  reaction,
}: {
  step: number;
  compact: boolean;
  width: number;
  top: number;
  active: boolean;
  reduced: boolean;
  mood: OnboardingMood;
  reaction: number;
}) {
  const big = step === 0 || step === 6;
  const scale =
    step === 0
      ? compact
        ? 0.85
        : 1
      : step === 6
        ? compact
          ? 0.52
          : 0.68
        : 0.22;
  const x = big ? 0 : Math.min(width * 0.35, 146);
  const y =
    step === 0 ? (compact ? -20 : 0) : step === 6 ? (compact ? -20 : -5) : 36;
  const sceneScale = useSharedValue(scale),
    sceneX = useSharedValue(x),
    sceneY = useSharedValue(y);
  const orbitOpacity = useSharedValue(big ? 1 : 0);
  const happy = useSharedValue(0),
    focus = useSharedValue(0),
    look = useSharedValue(0),
    celebration = useSharedValue(0);
  const float = useOnboardingLoop(O.motion.float, active);
  const blink = useOnboardingLoop(O.motion.blink, active);
  const orbital = useOnboardingLoop(12000, active);
  useEffect(() => {
    const config = { duration: reduced ? 0 : O.motion.scene, easing: ease };
    sceneScale.set(withTiming(scale, config));
    sceneX.set(withTiming(x, config));
    sceneY.set(withTiming(y, config));
    orbitOpacity.set(withTiming(big ? (step === 6 ? 0.6 : 1) : 0, config));
  }, [
    scale,
    x,
    y,
    big,
    step,
    reduced,
    sceneScale,
    sceneX,
    sceneY,
    orbitOpacity,
  ]);
  useEffect(() => {
    happy.set(
      withTiming(mood === "happy" || mood === "celebrate" ? 1 : 0, {
        duration: reduced ? 0 : 150,
      }),
    );
    focus.set(
      withTiming(mood === "focused" ? 1 : 0, { duration: reduced ? 0 : 180 }),
    );
    look.set(
      withTiming(mood === "curious" ? 12 : 0, {
        duration: reduced ? 0 : 300,
        easing: ease,
      }),
    );
  }, [mood, reduced, happy, focus, look]);
  useEffect(() => {
    if (!active) {
      cancelAnimation(celebration);
      celebration.set(0);
      return;
    }
    if (reaction)
      celebration.set(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: O.motion.success, easing: Easing.linear }),
        ),
      );
  }, [reaction, active, celebration]);
  const scene = useAnimatedStyle(() => ({
    transform: [
      { translateX: sceneX.value },
      { translateY: sceneY.value },
      { scale: sceneScale.value },
    ],
  }));
  const floating = useAnimatedStyle(() => {
    const wave = (1 - Math.cos(float.value * 2 * Math.PI)) / 2;
    const c = celebration.value;
    const jump =
      c < 0.2
        ? (c / 0.2) * 5
        : c < 0.55
          ? 5 - ((c - 0.2) / 0.35) * 33
          : -28 + ((c - 0.55) / 0.45) * 28;
    return {
      transform: [
        { translateY: -wave * 11 + jump },
        {
          rotate: `${active ? -3 + wave * 6 - Math.sin(c * Math.PI) * 8 : 0}deg`,
        },
      ],
    };
  });
  const body = useAnimatedStyle(() => {
    const wave = (1 - Math.cos(float.value * 2 * Math.PI)) / 2;
    const c = celebration.value;
    const sx =
      c < 0.2
        ? 1 + (c / 0.2) * 0.12
        : c < 0.55
          ? 1.12 - ((c - 0.2) / 0.35) * 0.18
          : 0.94 + ((c - 0.55) / 0.45) * 0.06;
    const sy =
      c < 0.2
        ? 1 - (c / 0.2) * 0.15
        : c < 0.55
          ? 0.85 + ((c - 0.2) / 0.35) * 0.24
          : 1.09 - ((c - 0.55) / 0.45) * 0.09;
    return {
      transform: [
        { scaleX: sx * (1 + wave * 0.025) },
        { scaleY: sy * (1 - wave * 0.025) },
      ],
    };
  });
  const face = useAnimatedStyle(() => ({
    transform: [{ translateX: (look.value * 250) / 512 }],
  }));
  const eyes = useAnimatedStyle(() => {
    const t = blink.value;
    const openness =
      t > 0.43 && t < 0.47 ? 0.07 + (Math.abs(t - 0.45) / 0.02) * 0.93 : 1;
    return {
      opacity: 1 - happy.value,
      transform: [{ scaleY: openness * (1 - focus.value * 0.235) }],
    };
  });
  const joy = useAnimatedStyle(() => ({ opacity: happy.value }));
  const brows = useAnimatedStyle(() => ({ opacity: focus.value }));
  const orbits = useAnimatedStyle(() => ({ opacity: orbitOpacity.value }));
  const dot = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - Math.cos(orbital.value * Math.PI * 2)) * 70 },
      { translateY: (1 - Math.cos(orbital.value * Math.PI * 2)) * 30 },
    ],
  }));
  const shadow = useAnimatedStyle(() => ({
    opacity:
      orbitOpacity.value * (0.8 + Math.cos(float.value * Math.PI * 2) * 0.2),
    transform: [{ scale: 0.9 + Math.cos(float.value * Math.PI * 2) * 0.1 }],
  }));
  const uid = useId().replace(/:/g, "");
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          position: "absolute",
          top,
          left: 0,
          width,
          height: 350,
          transformOrigin: "50% 0%",
        },
        scene,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, orbits]}>
        <View
          style={[
            styles.orbit,
            {
              width: 280,
              height: 100,
              left: width / 2 - 140,
              top: 117,
              transform: [{ rotate: "-20deg" }],
            },
          ]}
        >
          <Animated.View style={[styles.dot, dot]} />
        </View>
        <View
          style={[
            styles.orbit,
            {
              width: 330,
              height: 130,
              left: width / 2 - 165,
              top: 102,
              borderColor: "#BC93DF1F",
              transform: [{ rotate: "25deg" }],
            },
          ]}
        />
        <View
          style={[
            styles.orbit,
            {
              width: 310,
              height: 310,
              left: width / 2 - 155,
              top: 15,
              borderColor: "#F5EFE60A",
            },
          ]}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 140,
            height: 20,
            top: 280,
            left: width / 2 - 70,
          },
          shadow,
        ]}
      >
        <Svg width="140" height="20">
          <Defs>
            <RadialGradient id={`${uid}s`}>
              <Stop stopColor="#ED865D" stopOpacity={0.26} />
              <Stop offset="1" stopColor="#ED865D" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="70" cy="10" rx="70" ry="10" fill={`url(#${uid}s)`} />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 250,
            height: 250,
            left: width / 2 - 125,
            top: 38,
          },
          floating,
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transformOrigin: "50% 55.66%" },
            body,
          ]}
        >
          <Svg width="250" height="250" viewBox="0 0 512 512">
            <Defs>
              <LinearGradient
                id={`${uid}body`}
                x1="0.08"
                y1="0.04"
                x2="0.88"
                y2="1"
              >
                <Stop stopColor="#FFECCF" />
                <Stop offset="0.35" stopColor="#FFAE77" />
                <Stop offset="0.68" stopColor="#EF684C" />
                <Stop offset="1" stopColor="#773A78" />
              </LinearGradient>
              <LinearGradient id={`${uid}shine`} x1="0" y1="0" x2="1" y2="1">
                <Stop stopColor="#FFF3E1" stopOpacity={0.7} />
                <Stop offset="0.5" stopColor="#FFF3E1" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={BODY} fill={`url(#${uid}body)`} />
            <Path
              d="M115 141C103 97 125 61 168 57C207 53 220 86 247 87C278 88 293 53 333 58C379 65 404 102 394 142"
              fill="none"
              stroke={`url(#${uid}shine)`}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, face]}>
            <Animated.View
              style={[
                {
                  position: "absolute",
                  left: (195 * 250) / 512,
                  top: (184 * 250) / 512,
                  width: (117 * 250) / 512,
                  height: (68 * 250) / 512,
                },
                eyes,
              ]}
            >
              <Svg width="100%" height="100%" viewBox="0 0 117 68">
                <Ellipse cx="19" cy="34" rx="19" ry="34" fill="#211018" />
                <Ellipse cx="98" cy="34" rx="19" ry="34" fill="#211018" />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, joy]}>
              <Svg width="250" height="250" viewBox="0 0 512 512">
                <Path
                  d="M195 225Q214 191 233 225M274 225Q293 191 312 225M235 270Q254 291 273 270"
                  stroke="#211018"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, brows]}>
              <Svg width="250" height="250" viewBox="0 0 512 512">
                <Path
                  d="m192 176 42 13m40 0 42-13"
                  stroke="#211018"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      {[
        [-90, -70],
        [95, -40],
        [70, 85],
      ].map(([dx, dy], i) => (
        <Spark
          key={i}
          dx={dx}
          dy={dy}
          delay={i * 0.08}
          phase={celebration}
          left={width / 2}
        />
      ))}
    </Animated.View>
  );
}
function Spark({
  dx,
  dy,
  delay,
  phase,
  left,
}: {
  dx: number;
  dy: number;
  delay: number;
  phase: ReturnType<typeof useSharedValue<number>>;
  left: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = Math.max(0, Math.min(1, (phase.value - delay) / (1 - delay)));
    return {
      opacity: Math.sin(t * Math.PI),
      transform: [
        { translateX: dx * t },
        { translateY: dy * t },
        { scale: 1 - t * 0.9 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 170,
          left,
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: O.orange,
        },
        style,
      ]}
    />
  );
}
const styles = StyleSheet.create({
  orbit: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#FFB17B24",
    borderRadius: 200,
  },
  dot: {
    position: "absolute",
    top: 10,
    left: 40,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFB17B",
  },
});
