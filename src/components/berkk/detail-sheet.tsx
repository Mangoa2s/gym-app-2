import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, clamp, Easing, Extrapolation, interpolate, useAnimatedProps, useAnimatedScrollHandler, useAnimatedStyle,
  useReducedMotion, useSharedValue, withDelay, withRepeat, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Berkk, BerkkFonts } from '@/constants/theme';

type DetailRequest = { title: string; content: ReactNode; fixedContent?: ReactNode; layout?: 'full' };
type DetailActions = { present: (detail: DetailRequest) => void; dismiss: () => void };

const DetailContext = createContext<DetailActions | null>(null);
const RevealContext = createContext<{
  progress: SharedValue<number>;
  countProgress: SharedValue<number>;
  floatProgress: SharedValue<number>;
  sheetProgress: SharedValue<number>;
  chartProgress: SharedValue<number>;
  reducedMotion: boolean;
  sheetHeight: number;
  setHeaderHeight: (height: number) => void;
} | null>(null);

// Tuning values are shared by the sheet and its content; no per-frame React state.
export const DETAIL_SHEET_MOTION = {
  heightRatio: 0.52,
  openMs: 340,
  closeMs: 240,
  initialOpacity: 0.72,
  softBlurIntensity: 12,
  backdropOpacity: 0.48,
  revealMs: 380,
  countDelayMs: 100,
  countMs: 780,
  backgroundBlur: 22,
  dragThresholdPx: 6,
  closeThreshold: 0.45,
  velocityProjectionSeconds: 0.18,
  velocityIdleMs: 120,
  snapStiffness: 260,
  snapDamping: 30,
  floatHalfCycleMs: 2400,
} as const;
const easeOut = Easing.bezier(0.25, 0.8, 0.25, 1);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

/** Install once around the tabs so both the screen and navigation sit behind the sheet. */
export function DetailSheetProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<(DetailRequest & { id: number }) | null>(null);
  const target = useRef<View>(null);
  const sheetTarget = useRef<View>(null);
  const shown = useRef(false);
  const requestedOpen = useRef(false);
  const transition = useRef(0);
  const progress = useSharedValue(0);
  const reveal = useSharedValue(0);
  const countProgress = useSharedValue(0);
  const floatProgress = useSharedValue(0);
  const chartProgress = useSharedValue(0);
  const epoch = useSharedValue(0);
  const canDrag = useSharedValue(false);
  const dragging = useSharedValue(false);
  const lastDragAt = useSharedValue(0);
  const touchOrigin = useSharedValue({ x: 0, y: 0, header: false });
  const scrollOffset = useSharedValue(0);
  const headerHeight = useSharedValue(68);
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const fullLayout = detail?.layout === 'full';
  const sheetHeight = Math.max(1, Math.min(height * (fullLayout ? 0.94 : DETAIL_SHEET_MOTION.heightRatio), height - insets.top - 12));
  const travel = sheetHeight + insets.bottom;
  const setHeaderHeight = useCallback((next: number) => headerHeight.set(next), [headerHeight]);

  const animateOpen = useCallback(() => {
    chartProgress.set(reducedMotion ? 1 : withDelay(300, withTiming(1, { duration: 620, easing: Easing.inOut(Easing.cubic) })));
    progress.set(withTiming(1, { duration: reducedMotion ? 0 : DETAIL_SHEET_MOTION.openMs, easing: easeOut }));
    reveal.set(withTiming(1, { duration: reducedMotion ? 0 : DETAIL_SHEET_MOTION.revealMs, easing: Easing.linear }));
    countProgress.set(reducedMotion ? 1 : withDelay(
      DETAIL_SHEET_MOTION.countDelayMs,
      withTiming(1, { duration: DETAIL_SHEET_MOTION.countMs, easing: Easing.out(Easing.cubic) }),
    ));
    floatProgress.set(reducedMotion ? 0 : withDelay(
      DETAIL_SHEET_MOTION.countDelayMs + DETAIL_SHEET_MOTION.countMs,
      withRepeat(withTiming(1, { duration: DETAIL_SHEET_MOTION.floatHalfCycleMs, easing: Easing.inOut(Easing.sin) }), -1, true),
    ));
  }, [chartProgress, countProgress, floatProgress, progress, reducedMotion, reveal]);

  const present = useCallback((next: DetailRequest) => {
    const id = ++transition.current;
    epoch.set(id);
    canDrag.set(true);
    dragging.set(false);
    requestedOpen.current = true;
    cancelAnimation(progress);
    cancelAnimation(reveal);
    cancelAnimation(countProgress);
    cancelAnimation(floatProgress);
    cancelAnimation(chartProgress);
    chartProgress.set(0);
    // Restart content on EVERY presentation, including a reversed exit.
    reveal.set(0);
    countProgress.set(0);
    floatProgress.set(0);
    scrollOffset.set(0);
    if (!shown.current) progress.set(0);
    setDetail({ ...next, id });
    // A new native modal starts on onShow; an interrupted exit resumes in place.
    if (shown.current) animateOpen();
  }, [animateOpen, canDrag, chartProgress, countProgress, dragging, epoch, floatProgress, progress, reveal, scrollOffset]);

  const finishClose = useCallback((id: number) => {
    // A completion queued on the JS thread must never close a newer presentation.
    if (transition.current !== id || requestedOpen.current) return;
    shown.current = false;
    setDetail(null);
  }, []);

  const close = useCallback((velocity?: number) => {
    if (!requestedOpen.current) return;
    Keyboard.dismiss();
    cancelAnimation(chartProgress);
    requestedOpen.current = false;
    const id = ++transition.current;
    epoch.set(id);
    canDrag.set(false);
    dragging.set(false);
    cancelAnimation(progress);
    cancelAnimation(reveal);
    cancelAnimation(countProgress);
    cancelAnimation(floatProgress);
    reveal.set(withTiming(0, { duration: reducedMotion ? 0 : 150 }));
    const completed = (finished?: boolean) => {
      'worklet';
      if (finished) scheduleOnRN(finishClose, id);
    };
    progress.set(velocity === undefined || reducedMotion
      ? withTiming(0, { duration: reducedMotion ? 0 : DETAIL_SHEET_MOTION.closeMs, easing: Easing.out(Easing.cubic) }, completed)
      : withSpring(0, { stiffness: DETAIL_SHEET_MOTION.snapStiffness, damping: DETAIL_SHEET_MOTION.snapDamping, overshootClamping: true, velocity: -velocity / travel }, completed));
  }, [canDrag, chartProgress, countProgress, dragging, epoch, finishClose, floatProgress, progress, reducedMotion, reveal, travel]);
  const dismiss = useCallback(() => close(), [close]);

  const settle = useCallback((id: number, shouldClose: boolean, velocity: number) => {
    if (transition.current !== id || !requestedOpen.current) return;
    if (shouldClose) close(velocity);
    else progress.set(withSpring(1, {
      stiffness: DETAIL_SHEET_MOTION.snapStiffness,
      damping: DETAIL_SHEET_MOTION.snapDamping,
      overshootClamping: true,
      velocity: -velocity / travel,
    }));
  }, [close, progress, travel]);

  const scrollHandler = useAnimatedScrollHandler({ onScroll: (event) => { scrollOffset.set(event.contentOffset.y); } });
  const moveDrag = useCallback((event: { changeY: number }) => {
    'worklet';
    if (event.changeY !== 0) lastDragAt.set(Date.now());
    if (canDrag.value) progress.set(clamp(progress.value - event.changeY / travel, 0, 1));
  }, [canDrag, lastDragAt, progress, travel]);
  const endDrag = useCallback((event: { velocityY: number }, success: boolean) => {
    'worklet';
    dragging.set(false);
    // A finger held still before release has no remaining fling velocity.
    const velocity = success && Date.now() - lastDragAt.value < DETAIL_SHEET_MOTION.velocityIdleMs ? event.velocityY : 0;
    const projected = (1 - progress.value) + velocity * DETAIL_SHEET_MOTION.velocityProjectionSeconds / travel;
    scheduleOnRN(settle, epoch.value, success && projected > DETAIL_SHEET_MOTION.closeThreshold, velocity);
  }, [dragging, epoch, lastDragAt, progress, settle, travel]);
  const finalizeDrag = useCallback(() => {
    'worklet';
    if (dragging.value) {
      dragging.set(false);
      scheduleOnRN(settle, epoch.value, false, 0);
    }
  }, [dragging, epoch, settle]);
  const nativeScroll = Gesture.Native();
  const pan = Gesture.Pan()
    .manualActivation(true)
    .maxPointers(1)
    .simultaneousWithExternalGesture(...(fullLayout ? [] : [nativeScroll]))
    .onTouchesDown((event) => {
      const touch = event.allTouches[0];
      if (!touch) return;
      const sheetTop = height - sheetHeight + (1 - progress.value) * travel;
      touchOrigin.set({ x: touch.absoluteX, y: touch.absoluteY, header: touch.absoluteY < sheetTop + headerHeight.value });
    })
    .onTouchesMove((event, manager) => {
      if (!canDrag.value) { manager.fail(); return; }
      // Full editors drag ONLY from their toolbar. Wheel and history gestures never dismiss.
      if (fullLayout && !touchOrigin.value.header) { manager.fail(); return; }
      if (dragging.value) return;
      const touch = event.allTouches[0];
      if (!touch) return;
      const dx = touch.absoluteX - touchOrigin.value.x;
      const dy = touch.absoluteY - touchOrigin.value.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DETAIL_SHEET_MOTION.dragThresholdPx) return;
      if (Math.abs(dx) > Math.abs(dy)) { manager.fail(); return; }
      // The header always drags. In content, yield to scrolling unless pulled down at its top.
      if (touchOrigin.value.header || progress.value < 0.999 || (scrollOffset.value <= 0 && dy > 0)) manager.activate();
      else manager.fail();
    })
    .onStart(() => { cancelAnimation(progress); dragging.set(true); })
    .onChange(moveDrag)
    // RNGH registers these worklets; it does not execute their JS completion refs during render.
    // eslint-disable-next-line react-hooks/refs
    .onEnd(endDrag)
    // eslint-disable-next-line react-hooks/refs
    .onFinalize(finalizeDrag);

  const onShow = useCallback(() => {
    shown.current = true;
    if (requestedOpen.current) animateOpen();
  }, [animateOpen]);

  useEffect(() => () => {
    transition.current += 1;
    cancelAnimation(chartProgress);
    cancelAnimation(progress);
    cancelAnimation(reveal);
    cancelAnimation(countProgress);
    cancelAnimation(floatProgress);
  }, [chartProgress, countProgress, floatProgress, progress, reveal]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const blurProps = useAnimatedProps(() => ({ intensity: progress.value * DETAIL_SHEET_MOTION.backgroundBlur }));
  const sheetStyle = useAnimatedStyle(() => ({
    // Direct manipulation still follows the finger with Reduce Motion enabled.
    transform: [{ translateY: (1 - progress.value) * travel }],
    opacity: reducedMotion ? progress.value : interpolate(progress.value, [0, 1], [DETAIL_SHEET_MOTION.initialOpacity, 1]),
  }));
  const softnessStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 0 : 1 - reveal.value }));
  const actions = useMemo(() => ({ present, dismiss }), [present, dismiss]);
  const revealContext = useMemo(() => ({ progress: reveal, countProgress, floatProgress, chartProgress, sheetProgress: progress, reducedMotion, sheetHeight, setHeaderHeight }), [chartProgress, countProgress, floatProgress, progress, reducedMotion, reveal, sheetHeight, setHeaderHeight]);

  return (
    <DetailContext.Provider value={actions}>
      <View style={styles.host}>
        <BlurTargetView
          ref={target}
          style={styles.host}
          pointerEvents={detail ? 'none' : 'auto'}
          aria-hidden={detail !== null}
          accessibilityElementsHidden={detail !== null}
          importantForAccessibility={detail ? 'no-hide-descendants' : 'auto'}>
          {children}
        </BlurTargetView>
        {detail && (
          // Keep blur in the source window: native Modals use a separate window on Android.
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backdropStyle]}>
            <AnimatedBlurView
              testID="detail-background-blur"
              animatedProps={blurProps}
              blurTarget={target}
              blurMethod="dimezisBlurViewSdk31Plus"
              intensity={0}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <Modal
          visible={detail !== null}
          transparent
          animationType="none"
          statusBarTranslucent
          navigationBarTranslucent
          supportedOrientations={['portrait', 'landscape']}
          onShow={onShow}
          onRequestClose={dismiss}>
          <GestureHandlerRootView style={styles.host}>
            <View style={styles.modal} accessibilityViewIsModal onAccessibilityEscape={dismiss}>
              <Animated.View testID="detail-dim" style={[StyleSheet.absoluteFill, styles.dim, backdropStyle]}>
                <Pressable
                  style={styles.host}
                  onPress={dismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Detailansicht schließen"
                  testID="detail-backdrop"
                />
              </Animated.View>
              <GestureDetector gesture={pan} touchAction="pan-y">
                <Animated.View
                  testID="detail-sheet"
                  style={[
                    styles.sheet,
                    fullLayout && styles.fullSheet,
                    { height: sheetHeight, width: Math.min(width - insets.left - insets.right, 640) },
                    sheetStyle,
                  ]}>
                  <BlurTargetView ref={sheetTarget} style={styles.host}>
                    {fullLayout ? (
                      <RevealContext.Provider key={detail?.id} value={revealContext}>
                        {detail?.content}
                      </RevealContext.Provider>
                    ) : <>
                    <LinearGradient
                      colors={Berkk.detailGradient}
                      locations={[0, 0.45, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.85, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      testID="detail-drag-header"
                      style={[styles.header, Platform.OS === 'web' && ({ touchAction: 'none' } as ViewStyle)]}
                      onLayout={(event) => headerHeight.set(event.nativeEvent.layout.height)}>
                      <View pointerEvents="none" style={styles.dragHandle} />
                      <Text accessibilityRole="header" style={styles.title}>{detail?.title}</Text>
                      <Pressable
                        onPress={dismiss}
                        accessibilityRole="button"
                        accessibilityLabel="Schließen"
                        style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                          <Path d="m6 6 10 10M16 6 6 16" stroke={Berkk.ink} strokeWidth={1.8} strokeLinecap="round" />
                        </Svg>
                      </Pressable>
                    </View>
                    {detail?.fixedContent && (
                      <View key={detail.id} style={styles.fixedContent}>
                        <RevealContext.Provider value={revealContext}>
                          {detail.fixedContent}
                        </RevealContext.Provider>
                      </View>
                    )}
                    <GestureDetector gesture={nativeScroll}>
                      <Animated.ScrollView
                        key={detail?.id}
                        testID="detail-scroll"
                        onScroll={scrollHandler}
                        scrollEventThrottle={16}
                        bounces={false}
                        overScrollMode="never"
                        style={styles.host}
                        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 22) + 16 }]}
                        showsVerticalScrollIndicator={false}>
                        <RevealContext.Provider value={revealContext}>
                          {detail?.content}
                        </RevealContext.Provider>
                      </Animated.ScrollView>
                    </GestureDetector>
                    </>}
                  </BlurTargetView>
                  <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, softnessStyle]}>
                    <BlurView
                      blurTarget={sheetTarget}
                      blurMethod="dimezisBlurViewSdk31Plus"
                      intensity={DETAIL_SHEET_MOTION.softBlurIntensity}
                      tint="default"
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            </View>
          </GestureHandlerRootView>
        </Modal>
      </View>
    </DetailContext.Provider>
  );
}

export function useDetailSheet() {
  const context = useContext(DetailContext);
  if (!context) throw new Error('useDetailSheet needs a DetailSheetProvider.');
  return context;
}

export function useDetailMotion() {
  const context = useContext(RevealContext);
  if (!context) throw new Error('useDetailMotion needs to be rendered inside a detail sheet.');
  return context;
}

/** Reports the exact drag-only region for full-screen editors. */
export function DetailDragHeader({ children }: { children: ReactNode }) {
  const { setHeaderHeight } = useDetailMotion();
  return <View testID="detail-drag-header" onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)} style={Platform.OS === 'web' ? { touchAction: 'none' } as ViewStyle : undefined}>{children}</View>;
}

/** Three short reveal beats; no timers that can outlive or restart a closed sheet. */
export function DetailReveal({ order = 0, children }: { order?: 0 | 1 | 2; children: ReactNode }) {
  const context = useContext(RevealContext);
  const style = useAnimatedStyle(() => {
    if (!context || context.reducedMotion) return { opacity: 1, transform: [{ translateY: 0 }] };
    const amount = interpolate(
      context.progress.value,
      [0.125 + order * 0.125, 0.75 + order * 0.125],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: amount, transform: [{ translateY: (1 - amount) * 8 }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  modal: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  dim: { backgroundColor: `rgba(10,8,14,${DETAIL_SHEET_MOTION.backdropOpacity})` },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden', backgroundColor: '#19151F' },
  fullSheet: { backgroundColor: '#09090B', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 24, paddingRight: 16, paddingVertical: 10 },
  dragHandle: { position: 'absolute', top: 3, left: '50%', marginLeft: -16, width: 32, height: 3, borderRadius: 2, backgroundColor: Berkk.inkFaint },
  title: { flex: 1, fontFamily: BerkkFonts.semibold, color: Berkk.ink, fontSize: 21 },
  close: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(244,239,233,0.1)', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  content: { paddingHorizontal: 24, paddingTop: 4, gap: 16 },
  fixedContent: { paddingHorizontal: 24, paddingTop: 4, flexShrink: 0 },
});
