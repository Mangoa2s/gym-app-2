import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { DiaryAction } from './diary-action';
import { useWorkoutMotion } from './workout-motion-provider';
import { DiaryMotion as M } from '@/constants/diary-motion';
import { Berkk, BerkkFonts } from '@/constants/theme';

/** The value stays in its existing owner; unfolding never clears or saves anything. */
export function DiaryField({ label, value, onChangeText, multiline = false, placeholder, onLayout, onFocus }: {
  label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean; placeholder?: string;
  onLayout?: (event: LayoutChangeEvent) => void; onFocus?: () => void;
}) {
  const { reduced } = useWorkoutMotion();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const progress = useSharedValue(0);
  const bodyHeight = useSharedValue(multiline ? 116 : 52);
  const unfolding = useAnimatedStyle(() => ({ height: progress.value * bodyHeight.value, opacity: progress.value }));
  useEffect(() => {
    progress.set(reduced ? (open ? 1 : 0) : withTiming(open ? 1 : 0, { duration: M.fieldMs, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }));
  }, [open, progress, reduced]);
  useEffect(() => () => cancelAnimation(progress), [progress]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const close = () => { input.current?.blur(); Keyboard.dismiss(); setFocused(false); setOpen(false); };
  return <View onLayout={onLayout} style={[styles.field, focused && styles.focused]}>
    {open ?
      <View style={styles.header}><Text style={styles.label}>{label}</Text><DiaryAction label="Fertig" accessibilityLabel={`${label} schließen`} onPress={close} /></View>
    : <DiaryAction label={label} accessibilityLabel={`${label} öffnen`} onPress={() => setOpen(true)} surfaceStyle={styles.closed}>
      <View style={styles.flex}><Text style={styles.label}>{label}{!value ? ' (optional)' : ''}</Text>
        {!!value && <Text numberOfLines={1} style={styles.preview}>{value}</Text>}</View>
      <Ionicons accessible={false} name="create-outline" size={20} color={Berkk.link} />
    </DiaryAction>}
    <Animated.View pointerEvents={open ? 'auto' : 'none'} aria-hidden={!open} accessibilityElementsHidden={!open}
      importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} style={[styles.body, unfolding]}>
      <View onLayout={(event) => bodyHeight.set(event.nativeEvent.layout.height)}>
        <TextInput ref={input} accessibilityLabel={label} value={value} onChangeText={onChangeText} multiline={multiline}
          editable={open} tabIndex={open ? 0 : -1}
          onFocus={() => { setFocused(true); onFocus?.(); }} onBlur={() => setFocused(false)}
          maxLength={multiline ? 4000 : 100} placeholder={placeholder ?? (multiline ? 'Was möchtest du dir merken?' : 'Name deines Workouts')}
          placeholderTextColor={Berkk.inkMuted} returnKeyType={multiline ? 'default' : 'done'}
          style={[styles.input, multiline && styles.note, Platform.OS === 'web' && { outlineStyle: 'solid', outlineWidth: 0 }]}
          onSubmitEditing={multiline ? undefined : close} />
      </View>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  field: { borderRadius: 14, borderWidth: 1, borderColor: Berkk.glassBorder, backgroundColor: Berkk.glassGradient[2], overflow: 'hidden' },
  focused: { borderColor: Berkk.link, backgroundColor: 'rgba(255,138,76,0.055)' },
  flex: { flex: 1, minWidth: 0 }, closed: { minHeight: 56, justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 }, body: { overflow: 'hidden' },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 2 },
  label: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 15, lineHeight: 21, flexShrink: 1 },
  preview: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 13, lineHeight: 19, marginTop: 4 },
  input: { color: Berkk.ink, fontFamily: BerkkFonts.regular, fontSize: 16, lineHeight: 23, minHeight: 52, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  note: { minHeight: 116, textAlignVertical: 'top' },
});
