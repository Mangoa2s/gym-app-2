import { forwardRef, type ReactNode } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { GlassSurface } from '@/components/berkk/glass-surface';
import { Berkk, BerkkFonts } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
};

/** Glass pill input with an uppercase label, matching the mockup's card typography. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, icon, trailing, style, ...inputProps },
  ref
) {
  return (
    <View>
      <Text
        style={{
          fontFamily: BerkkFonts.medium,
          color: Berkk.inkMuted,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
        {label}
      </Text>
      <GlassSurface radius={18} style={{ height: 54 }} className="flex-row items-center px-4">
        {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
        <TextInput
          ref={ref}
          placeholderTextColor={Berkk.inkMuted}
          style={[{ flex: 1, fontFamily: BerkkFonts.regular, color: Berkk.ink, fontSize: 16 }, style]}
          {...inputProps}
        />
        {trailing}
      </GlassSurface>
    </View>
  );
});
