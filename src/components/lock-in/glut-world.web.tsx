/**
 * Web stand-in for the Glut-Welt: Skia would need a large WebAssembly bundle,
 * so the browser preview shows only a static ember glow (agreed). Same props
 * and the same Tokens.world colours; like the native world it rises from the
 * top edge of the tracking card.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import { withAlpha } from '@/lib/color';
import type { WorldBridge } from './world-bridge';

export const GlutWorld = memo(function GlutWorld({ bridge, heat, paused, floorY }: { bridge: WorldBridge; heat: number; rest: boolean; paused: boolean; reduced: boolean; active: boolean; floorY: number }) {
  const { height } = useWindowDimensions();
  const floor = Math.min(height, floorY);
  const strength = Math.min(1, L.world.bedAlphaBase + L.world.bedAlphaPerHeat * heat);
  const reach = L.world.bedRadius + heat * L.world.bedRadiusHeat;
  useEffect(() => { if (L.debugWorld) bridge.debug.mode.set('Fallback (Web, statisch)'); }, [bridge.debug.mode]);
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}
    onLayout={(event) => { if (L.debugWorld) { bridge.debug.width.set(Math.round(event.nativeEvent.layout.width)); bridge.debug.height.set(Math.round(event.nativeEvent.layout.height)); } }}>
    <LinearGradient colors={[withAlpha(T.world.emberCore, 0), withAlpha(T.world.emberCore, strength * 0.7), withAlpha(T.world.emberHot, strength), withAlpha(T.world.emberCore, 0)]} locations={[0, 0.55, 0.78, 1]}
      style={{ position: 'absolute', left: 0, right: 0, top: floor - reach, height: reach * 1.3 }} />
    {paused && <View style={[StyleSheet.absoluteFill, { backgroundColor: T.world.pauseDim }]} />}
  </View>;
});
