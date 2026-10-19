import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, FadeIn, FadeOut, useAnimatedStyle, useFrameCallback, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BerkkGhost, type GhostExpression } from '@/components/berkk/berkk-ghost';
import type { GhostPulse } from '@/components/berkk/ghost-state';
import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import { feedback } from '@/lib/feedback';
import { flightOver, isThrow, softDrag, stepFlight, type Flight } from '@/lib/throw-sim';
import { emitWorld, type WorldBridge } from './world-bridge';

const PHRASES = ['Hmpf.', 'Hey!', 'Nicht werfen!', 'Ich war gerade bequem.', 'Echt jetzt?'];
const THROW = { ...L.throw };
const HOME_SPRING = { stiffness: 170, damping: 16, mass: 0.9 };

/**
 * The ghost can be pulled (it follows the finger, softly limited, and pushes
 * sparks away) and thrown (it flies, spins, bounces off the screen edges and the
 * top of the tracking card, then floats home). It can be caught mid-flight.
 * Afterwards it is cutely annoyed for 2 s. Purely playful: no data changes.
 */
export const DraggableGhost = memo(function DraggableGhost({ size, pulse, idle, reduced, bridge, screenWidth, topLimit }: {
  size: number; pulse: GhostPulse | null; idle: boolean; reduced: boolean; bridge: WorldBridge; screenWidth: number; topLimit: number;
}) {
  const anchor = useRef<View>(null);
  const [expression, setExpression] = useState<GhostExpression>('normal');
  const [phrase, setPhrase] = useState<string | null>(null);
  const annoyedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flying = useSharedValue(false);
  const flight = useSharedValue<Flight>({ x: 0, y: 0, vx: 0, vy: 0, spin: 0, elapsed: 0 });
  const spin = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const radius = size * 0.42;

  // Measure where the ghost rests, in screen coordinates (the world draws its glow there).
  const measure = useCallback(() => {
    anchor.current?.measureInWindow((x, y, width, height) => {
      bridge.homeX.set(x + width / 2);
      bridge.homeY.set(y + height / 2);
    });
  }, [bridge.homeX, bridge.homeY]);

  const goHome = () => {
    'worklet';
    const settle = (finished?: boolean) => { 'worklet'; if (finished) bridge.moving.value = false; };
    bridge.offX.value = withSpring(0, HOME_SPRING, settle);
    bridge.offY.value = withSpring(0, HOME_SPRING);
    spin.value = spin.value % 360;
    spin.value = withSpring(0, HOME_SPRING);
  };

  const onImpact = useCallback(() => feedback.select(), []);
  const [flightActive, setFlightActive] = useState(false);
  const beginFlight = useCallback(() => { if (annoyedTimer.current) clearTimeout(annoyedTimer.current); setPhrase(null); setExpression('squint'); setFlightActive(true); }, []);
  const caught = useCallback(() => { setFlightActive(false); setExpression('normal'); }, []);
  const landed = useCallback(() => {
    setFlightActive(false);
    setExpression('annoyed');
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    if (annoyedTimer.current) clearTimeout(annoyedTimer.current);
    annoyedTimer.current = setTimeout(() => { setExpression('normal'); setPhrase(null); annoyedTimer.current = null; }, L.throw.annoyedMs);
  }, []);
  useEffect(() => () => { if (annoyedTimer.current) clearTimeout(annoyedTimer.current); }, []);

  // Flight integration runs only while thrown (no idle display-link cost).
  const frame = useFrameCallback((info) => {
    'worklet';
    if (!flying.value) return;
    const dt = Math.min(info.timeSincePreviousFrame ?? 16, 48) / 1000;
    const bounds = {
      minX: radius - bridge.homeX.value, maxX: screenWidth - radius - bridge.homeX.value,
      minY: topLimit + radius - bridge.homeY.value, maxY: bridge.cardTop.value - radius - bridge.homeY.value,
    };
    const next = { ...flight.value };
    const impacts = stepFlight(next, bounds, dt, THROW);
    flight.value = next;
    bridge.offX.value = next.x;
    bridge.offY.value = next.y;
    spin.value = next.spin;
    if (impacts) {
      emitWorld(bridge, { x: bridge.homeX.value + next.x, y: bridge.homeY.value + next.y, count: L.throw.impactSparks, flash: 0 });
      scheduleOnRN(onImpact);
    }
    if (flightOver(next, THROW)) {
      flying.value = false;
      goHome();
      scheduleOnRN(landed);
    }
  }, false);
  useEffect(() => { frame.setActive(flightActive); }, [flightActive, frame]);

  const pan = useMemo(() => Gesture.Pan()
    .onBegin(() => {
      // Catch it mid-flight: stop right where it is.
      if (flying.value) { flying.value = false; scheduleOnRN(caught); }
      cancelAnimation(bridge.offX); cancelAnimation(bridge.offY); cancelAnimation(spin);
      bridge.moving.value = true;
    })
    .onStart(() => {
      startX.value = bridge.offX.value;
      startY.value = bridge.offY.value;
      bridge.dragging.value = true;
    })
    .onUpdate((event) => {
      const [x, y] = softDrag(startX.value + event.translationX, startY.value + event.translationY, THROW.maxDrag);
      bridge.offX.value = x;
      bridge.offY.value = y;
    })
    .onEnd((event) => {
      bridge.dragging.value = false;
      if (!reduced && isThrow(event.velocityX, event.velocityY, THROW)) {
        flight.value = { x: bridge.offX.value, y: bridge.offY.value, vx: event.velocityX, vy: event.velocityY, spin: spin.value, elapsed: 0 };
        flying.value = true;
        scheduleOnRN(beginFlight);
      } else goHome();
    })
    .onFinalize(() => {
      bridge.dragging.value = false;
      if (!flying.value && (bridge.offX.value !== 0 || bridge.offY.value !== 0)) goHome();
      else if (!flying.value) bridge.moving.value = false;
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [beginFlight, caught, reduced]);

  const moved = useAnimatedStyle(() => ({ transform: [{ translateX: bridge.offX.value }, { translateY: bridge.offY.value }, { rotate: `${reduced ? 0 : spin.value}deg` }] }));

  return <View ref={anchor} testID="lockin-ghost" onLayout={measure} collapsable={false} style={{ width: size, height: size }}>
    {phrase && <Animated.View entering={reduced ? undefined : FadeIn.duration(150)} exiting={reduced ? undefined : FadeOut.duration(200)} accessibilityLiveRegion="polite" style={[styles.bubble, { bottom: size + T.space.s }]}>
      <Text numberOfLines={1} style={styles.bubbleText}>{phrase}</Text>
    </Animated.View>}
    <GestureDetector gesture={pan}>
      <Animated.View accessible={false} style={[StyleSheet.absoluteFill, moved]}>
        <BerkkGhost size={size} mood="focused" idle={idle} pulse={pulse} expression={expression} />
      </Animated.View>
    </GestureDetector>
  </View>;
});

const styles = StyleSheet.create({
  bubble: { position: 'absolute', alignSelf: 'center', paddingHorizontal: T.space.m, paddingVertical: T.space.xs, borderRadius: T.radius.pill, backgroundColor: T.ghost.bubble, zIndex: 2 },
  bubbleText: { fontFamily: T.font.label, fontSize: 13, color: T.ghost.bubbleInk },
});
