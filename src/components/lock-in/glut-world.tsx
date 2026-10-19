/**
 * Glut-Welt (iOS/Android): an ember bed, a glow around the ghost and rising
 * sparks that show the workout's progress as heat. Everything is simulated and
 * drawn on the UI thread into one Skia picture per frame.
 *
 * Battery: ≤ 30 fps while calm (60 only while bursts fly or the ghost moves),
 * ≤ 150 particles, loop fully stopped when paused, unfocused or backgrounded.
 * Reduced motion: one static glow, no particles, no loop.
 * Colours come only from Tokens.world (shop themes swap those values).
 */
import { BlendMode, Canvas, createPicture, Picture, Skia, TileMode, type SkCanvas } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import { rgb } from '@/lib/color';
import { createWorld, spawnBurst, stepWorld, worldBusy, type WorldState } from '@/lib/world-sim';
import type { WorldBridge } from './world-bridge';

type Palette = { hot: number[]; core: number[]; cool: number[]; spark: number[]; glow: number[] };
const PARAMS = { maxParticles: L.world.maxParticles, sparkBase: L.world.sparkBase, sparkPerHeat: L.world.sparkPerHeat, restFactor: L.world.restFactor, heatEase: L.world.heatEase, repelRadius: L.world.repelRadius };

/** Draws one frame. A worklet, but also callable on JS for the static reduced-motion picture. */
function drawWorld(canvas: SkCanvas, state: WorldState, width: number, height: number, floorY: number, ghostX: number, ghostY: number, breath: number, palette: Palette) {
  'worklet';
  const color = (c: number[], alpha: number) => Float32Array.of(c[0], c[1], c[2], Math.max(0, Math.min(1, alpha)));
  const heat = state.heat;
  const full = Skia.XYWHRect(0, 0, width, height);
  const W = L.world;
  // Ember bed glowing upward from the top edge of the tracking card: radius 260 + heat × 420.
  // It also reaches below that edge, where it shimmers through the 85 % card.
  const bed = Skia.Paint();
  const bedAlpha = (W.bedAlphaBase + W.bedAlphaPerHeat * heat) * (1 + breath * 0.12) + state.flash * 0.25;
  bed.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(width / 2, floorY), (W.bedRadius + heat * W.bedRadiusHeat) * (1 + breath * 0.04),
    [color(palette.hot, bedAlpha), color(palette.core, bedAlpha * 0.7), color(palette.core, 0)], [0, 0.45, 1], TileMode.Clamp));
  canvas.drawRect(full, bed);
  // Glow around the ghost: clearly visible from the first second, larger with heat.
  const glow = Skia.Paint();
  const glowAlpha = (W.glowAlphaBase + W.glowAlphaPerHeat * heat) * (1 + breath * 0.15) + state.flash * 0.35;
  glow.setShader(Skia.Shader.MakeRadialGradient(Skia.Point(ghostX, ghostY), W.glowRadius + heat * W.glowRadiusHeat, [color(palette.glow, glowAlpha), color(palette.glow, 0)], [0, 1], TileMode.Clamp));
  glow.setBlendMode(BlendMode.Plus);
  canvas.drawRect(full, glow);
  if (state.flash > 0.02) {
    const flash = Skia.Paint();
    flash.setColor(color(palette.hot, state.flash * 0.22));
    flash.setBlendMode(BlendMode.Plus);
    canvas.drawRect(full, flash);
  }
  // Sparks: cool and dim at low heat, bright and yellow when hot; additive light.
  const paint = Skia.Paint();
  paint.setBlendMode(BlendMode.Plus);
  for (const spark of state.sparks) {
    const t = Math.min(1, heat * 0.85 + (spark.burst ? 0.25 : 0));
    const fade = 1 - spark.age / spark.life;
    const mix = [0, 1, 2].map((i) => palette.cool[i] + (palette.spark[i] - palette.cool[i]) * t);
    paint.setColor(color(mix, fade * (0.45 + 0.55 * t)));
    canvas.drawCircle(spark.x, spark.y, spark.size, paint);
    if (spark.burst) {
      paint.setColor(color(mix, fade * 0.18));
      canvas.drawCircle(spark.x, spark.y, spark.size * 3, paint);
    }
  }
}

export const GlutWorld = memo(function GlutWorld({ bridge, heat, rest, paused, reduced, active, floorY }: {
  bridge: WorldBridge; heat: number; rest: boolean; paused: boolean; reduced: boolean; active: boolean;
  /** Top edge of the tracking card in screen coordinates (for the still picture; the loop reads bridge.cardTop). */
  floorY: number;
}) {
  const { width, height } = useWindowDimensions();
  const appActive = useAppActive();
  const palette = useMemo<Palette>(() => ({ hot: rgb(T.world.emberHot), core: rgb(T.world.emberCore), cool: rgb(T.world.emberCool), spark: rgb(T.world.sparkHot), glow: rgb(T.world.glow) }), []);
  const heatTarget = useSharedValue(heat);
  const resting = useSharedValue(rest);
  const world = useSharedValue<WorldState>(createWorld(heat));
  const picture = useSharedValue(createPicture(() => {}));
  const elapsed = useSharedValue(0);
  useEffect(() => { heatTarget.set(heat); }, [heat, heatTarget]);
  useEffect(() => { resting.set(rest); }, [rest, resting]);

  const frame = useFrameCallback((info) => {
    'worklet';
    elapsed.value += info.timeSincePreviousFrame ?? 16;
    const state = world.value;
    const hot = bridge.moving.value || bridge.events.value.length > 0 || worldBusy(state);
    // Calm world: at most ~30 fps.
    if (!hot && elapsed.value < L.world.idleFrameMs) return;
    const dt = Math.min(elapsed.value, 64) / 1000;
    elapsed.value = 0;
    const ghostX = bridge.homeX.value + bridge.offX.value;
    const ghostY = bridge.homeY.value + bridge.offY.value;
    const next = { ...state, sparks: state.sparks };
    const queued = bridge.events.value;
    if (queued.length) {
      bridge.events.set([]);
      for (const event of queued) spawnBurst(next, event.x, event.y, event.count, event.flash, L.world.maxParticles, Math.random);
    }
    // The card's top edge (measured by onLayout); before it is known, the screen bottom.
    const floorY = Math.min(height, bridge.cardTop.value);
    stepWorld(next, { dt, width, height, floorY, heatTarget: heatTarget.value, rest: resting.value, ghostX, ghostY, repel: bridge.dragging.value, random: Math.random }, PARAMS);
    world.value = next;
    // While resting the glow breathes slowly.
    const breath = resting.value ? Math.sin(next.time * 1.6) : 0;
    picture.value = createPicture((canvas) => drawWorld(canvas, next, width, height, floorY, ghostX, ghostY, breath, palette), Skia.XYWHRect(0, 0, width, height));
    if (L.debugWorld) {
      bridge.debug.frames.set(bridge.debug.frames.value + 1);
      bridge.debug.particles.set(next.sparks.length);
    }
  }, false);

  const running = active && appActive && !paused && !reduced;
  useEffect(() => { frame.setActive(running); return () => frame.setActive(false); }, [frame, running]);
  // TEMPORARY diagnostics: why the world is (not) animating.
  useEffect(() => {
    if (!L.debugWorld) return;
    const skia = typeof Skia?.Paint === 'function' ? 'Skia ok' : 'Skia FEHLT';
    const mode = reduced ? 'reduziert (Bewegung reduzieren an)' : paused ? 'pausiert' : !appActive ? 'gestoppt (App im Hintergrund)' : !active ? 'gestoppt (kein Fokus/Tagebuch)' : 'aktiv';
    bridge.debug.mode.set(`${mode} · ${skia}`);
  }, [active, appActive, bridge.debug.mode, paused, reduced]);

  // Reduced motion: one still frame, no particles.
  const still = useMemo(() => reduced
    ? createPicture((canvas) => drawWorld(canvas, { ...createWorld(heat), heat }, width, height, Math.min(height, floorY), bridge.homeX.value || width / 2, bridge.homeY.value || height * 0.35, 0, palette), Skia.XYWHRect(0, 0, width, height))
    : null, [bridge.homeX, bridge.homeY, floorY, heat, height, palette, reduced, width]);

  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}
    onLayout={(event) => { if (L.debugWorld) { bridge.debug.width.set(Math.round(event.nativeEvent.layout.width)); bridge.debug.height.set(Math.round(event.nativeEvent.layout.height)); } }}>
    <Canvas style={StyleSheet.absoluteFill}>{still ? <Picture picture={still} /> : <Picture picture={picture} />}</Canvas>
    {paused && <View style={[StyleSheet.absoluteFill, { backgroundColor: T.world.pauseDim }]} />}
  </View>;
});

function useAppActive() {
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}
