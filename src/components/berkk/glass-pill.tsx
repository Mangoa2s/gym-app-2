import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Berkk } from '@/constants/theme';

/** Frosted pill for text that sits directly on the workout photo. */
export function GlassPill({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, style]}>
      <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.wash]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: Berkk.pillBorder, borderTopColor: Berkk.glassHighlight, paddingHorizontal: 14, justifyContent: 'center' },
  wash: { backgroundColor: Berkk.pillWash },
});
