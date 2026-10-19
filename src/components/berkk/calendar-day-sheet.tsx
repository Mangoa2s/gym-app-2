import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router/react-navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Animated, BackHandler, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { CalendarAppearance as C } from '@/constants/calendar-appearance';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { formatDay, type calendarDay } from '@/data/calendar';
import { GlowBlob } from './glow-blob';

type Props = {
  date: string;
  today: string;
  reduced: boolean;
  day: ReturnType<typeof calendarDay>;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  bottom: number;
  maxHeight: number;
  collapsedHeight: number;
  blurTarget: RefObject<View | null>;
  children: ReactNode;
};

/** A docked day preview; expanding it keeps the existing tab bar clear. */
export function CalendarDaySheet({ date, today, reduced, day, expanded, onExpand, onCollapse, bottom, maxHeight, collapsedHeight, blurTarget, children }: Props) {
  const focused = useIsFocused();
  const [progress] = useState(() => new Animated.Value(1));
  const suppressTapUntil = useRef(0);
  const dragStarted = useCallback(() => { suppressTapUntil.current = Date.now() + 600; }, []);
  const dragEnded = useCallback((event: { translationY: number; velocityY: number }) => {
    // RN Pressable can deliver a web click after the pan has already collapsed.
    suppressTapUntil.current = Date.now() + 250;
    if (event.translationY > 28 || event.velocityY > 600) onCollapse();
    else if (event.translationY < -28 || event.velocityY < -600) onExpand();
  }, [onCollapse, onExpand]);
  useEffect(() => {
    progress.setValue(reduced ? 1 : 0);
    Animated.timing(progress, { toValue: 1, duration: reduced ? 0 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => progress.stopAnimation();
  }, [date, expanded, progress, reduced]);
  useEffect(() => {
    if (!expanded || !focused) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { onCollapse(); return true; });
    return () => listener.remove();
  }, [expanded, focused, onCollapse]);
  // Gesture Handler registers these event callbacks; it does not call them in render.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => Gesture.Pan().activeOffsetY([-8, 8]).failOffsetX([-20, 20]).runOnJS(true).onStart(dragStarted).onEnd(dragEnded), [dragStarted, dragEnded]);
  const warm = day.status === 'completed';
  return <>
    <Animated.View testID="calendar-day-sheet" onAccessibilityEscape={onCollapse} style={[styles.dock, { bottom, height: expanded ? maxHeight : collapsedHeight, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 4, 0] }) }] }]}>
      <GlowBlob color={warm ? C.sheet.glowWarm : C.sheet.glowNeutral} opacity={C.sheet.glowOpacity} size={C.sheet.glowSize} style={{ top: -130, left: '50%', marginLeft: -C.sheet.glowSize / 2 }} />
      <View style={styles.glass}>
        <BlurView blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" intensity={C.sheet.blurIntensity} tint="dark" pointerEvents="none" style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={warm ? C.sheet.warmWash : C.sheet.wash} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
        <GestureDetector gesture={pan} touchAction="none">
        <View>
          <Pressable testID="calendar-sheet-preview" accessibilityRole="button" accessibilityLabel={`${formatDay(date)}, ${day.label}, ${day.title}. ${expanded ? 'Details einklappen' : 'Tagesdetails öffnen'}`} accessibilityState={{ expanded }} onPress={() => { if (Date.now() >= suppressTapUntil.current) (expanded ? onCollapse : onExpand)(); }} style={[styles.preview, { minHeight: collapsedHeight }]}>
            <View style={styles.handle} />
            <View style={styles.metaRow}>
              <Text numberOfLines={2} maxFontSizeMultiplier={1.4} style={styles.date}>{date === today ? 'Heute' : 'Auswahl'} · {formatDay(date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={styles.status}>{day.label.toLocaleUpperCase('de-DE')}</Text>
            </View>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={styles.title}>{day.title}</Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={styles.summary}>{day.summary}</Text>
          </Pressable>
        </View>
        </GestureDetector>
        {expanded && <ScrollView testID="calendar-sheet-details" showsVerticalScrollIndicator={false} contentContainerStyle={styles.details}>{children}</ScrollView>}
        {expanded && <Pressable accessibilityRole="button" accessibilityLabel="Tagesdetails schließen" onPress={onCollapse} style={styles.close}>
          <Ionicons accessible={false} name="chevron-down" size={16} color={Berkk.ink} /><Text style={styles.closeText}>Schließen</Text>
        </Pressable>}
      </View>
    </Animated.View>
  </>;
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 16, right: 16, maxWidth: 388, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 20 },
  glass: { flex: 1, overflow: 'hidden', borderRadius: C.sheet.radius, borderWidth: 1, borderColor: C.sheet.border, borderTopColor: C.sheet.topEdge },
  preview: { paddingTop: 21, paddingBottom: 13, paddingHorizontal: 16, justifyContent: 'center' },
  handle: { position: 'absolute', top: 7, alignSelf: 'center', width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(244,239,233,0.30)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  date: { flex: 1, fontFamily: BerkkFonts.semibold, color: Berkk.inkSecondary, fontSize: 12, lineHeight: 18 },
  status: { flexShrink: 0, fontFamily: BerkkFonts.bold, fontSize: 10, lineHeight: 16, color: Berkk.inkSecondary },
  title: { fontFamily: BerkkFonts.bold, color: Berkk.ink, fontSize: 18, lineHeight: 23, letterSpacing: -0.4 },
  summary: { fontFamily: BerkkFonts.medium, color: Berkk.inkSecondary, fontSize: 12, lineHeight: 17 },
  details: { paddingHorizontal: 16, paddingBottom: 12 },
  close: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Berkk.glassBorder },
  closeText: { fontFamily: BerkkFonts.medium, fontSize: 12, color: Berkk.inkSecondary },
});
