import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

// LinearGradient isn't one of NativeWind's auto-patched core components,
// so `className` needs to be explicitly mapped to its `style` prop.
cssInterop(LinearGradient, { className: 'style' });
