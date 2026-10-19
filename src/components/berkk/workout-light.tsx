import { memo, useId } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

/** A static light texture. Animate its parent, never its SVG stops or blur. */
export const WorkoutLight = memo(function WorkoutLight({ color, shade = color, strength = 1 }: {
  color: string; shade?: string; strength?: number;
}) {
  const id = `workout-light-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
    <Defs><RadialGradient id={id}>
      <Stop offset="0" stopColor={color} stopOpacity={strength} />
      <Stop offset="0.3" stopColor={shade} stopOpacity={strength * 0.7} />
      <Stop offset="0.65" stopColor={shade} stopOpacity={strength * 0.2} />
      <Stop offset="1" stopColor={shade} stopOpacity={0} />
    </RadialGradient></Defs>
    <Ellipse cx="50" cy="50" rx="50" ry="50" fill={`url(#${id})`} />
  </Svg>;
});
