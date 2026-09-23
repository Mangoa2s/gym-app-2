import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Berkk } from '@/constants/theme';

type GlassSurfaceProps = {
  radius: number;
  style?: ViewStyle;
  className?: string;
  children?: ReactNode;
};

/**
 * "Nachtglas" liquid-glass surface: a blurred, saturated backdrop with a faint
 * white gradient wash and a bright top edge to fake CSS's inset highlight —
 * ported from the `glass()` helper in the approved BERKK v5 Nachtglas mockup.
 */
export function GlassSurface({ radius, style, className, children }: GlassSurfaceProps) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 8,
        },
        style,
      ]}>
      <View style={{ borderRadius: radius, overflow: 'hidden', flex: 1 }}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={Berkk.glassGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          className={className}
          style={{
            flex: 1,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: Berkk.glassBorder,
            borderTopColor: Berkk.glassHighlight,
          }}>
          {children}
        </View>
      </View>
    </View>
  );
}
