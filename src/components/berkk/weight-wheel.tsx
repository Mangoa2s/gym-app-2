import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Berkk, BerkkFonts } from '@/constants/theme';

import { wheelIndex } from './weight-picker-state';

type Props = {
  value: number;
  max: number;
  rowHeight: number;
  visibleRows: number;
  viewportHeight?: number;
  label: string;
  disabled: boolean;
  onChange: (value: number) => void;
  onMoving: (moving: boolean) => void;
  onEdit: () => void;
};

/** Native scroll physics plus an exact final offset, also for a slow drag without momentum. */
export function WeightWheel({ value, max, rowHeight, visibleRows, viewportHeight = rowHeight * visibleRows, label, disabled, onChange, onMoving, onEdit }: Props) {
  const list = useRef<FlatList<number>>(null);
  const [position] = useState(() => new Animated.Value(value * rowHeight));
  const offset = useRef(value * rowHeight);
  const fingerDown = useRef(false);
  const moving = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paddingRows = Math.floor(visibleRows / 2);
  const data = useMemo(() => Array.from({ length: max + 1 + paddingRows * 2 }, (_, index) => index - paddingRows), [max, paddingRows]);

  const clearTimer = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = null;
  };
  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);
  // `initialScrollIndex` alone is unreliable on react-native-web; force the exact
  // saved offset once after mount so the wheel never opens on a stale position.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { list.current?.scrollToOffset({ offset: value * rowHeight, animated: false }); }, []);

  const setMoving = (next: boolean) => {
    if (moving.current === next) return;
    moving.current = next;
    onMoving(next);
  };
  const settle = () => {
    clearTimer();
    const selected = wheelIndex(offset.current, rowHeight, max);
    const exactOffset = selected * rowHeight;
    if (Math.abs(offset.current - exactOffset) > 0.5) list.current?.scrollToOffset({ offset: exactOffset, animated: false });
    offset.current = exactOffset;
    position.setValue(exactOffset);
    onChange(selected);
    setMoving(false);
  };
  const scheduleSettle = () => {
    clearTimer();
    settleTimer.current = setTimeout(settle, 160);
  };
  const select = (next: number) => {
    if (disabled) return;
    clearTimer();
    const selected = Math.max(0, Math.min(max, next));
    offset.current = selected * rowHeight;
    list.current?.scrollToOffset({ offset: offset.current, animated: false });
    position.setValue(offset.current);
    onChange(selected);
    setMoving(false);
  };

  return (
    <View
      style={[styles.wheel, { height: viewportHeight, flex: max === 9 ? 1 : 1.4 }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Nach oben oder unten streichen. Doppeltippen öffnet die Tastatur."
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate', label: 'Mit Tastatur eingeben' }]}
      onAccessibilityTap={onEdit}
      onAccessibilityAction={({ nativeEvent }) => {
        if (disabled) return;
        if (nativeEvent.actionName === 'increment') select(value + 1);
        else if (nativeEvent.actionName === 'decrement') select(value - 1);
        else if (nativeEvent.actionName === 'activate') onEdit();
      }}>
      <GestureDetector gesture={Gesture.Native().disallowInterruption(true)}>
      <Animated.FlatList
        ref={list}
        testID={max === 9 ? 'weight-wheel-decimal' : 'weight-wheel-kg'}
        data={data}
        keyExtractor={(item) => String(item)}
        style={{ height: rowHeight * visibleRows, flexGrow: 0, flexShrink: 0, marginTop: -(rowHeight * visibleRows - viewportHeight) / 2 }}
        initialScrollIndex={value}
        getItemLayout={(_, index) => ({ index, length: rowHeight, offset: index * rowHeight })}
        initialNumToRender={visibleRows + 6}
        windowSize={5}
        maxToRenderPerBatch={12}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!disabled}
        snapToInterval={rowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        // Animated.event registers the listener; it does not run it during render.
        // eslint-disable-next-line react-hooks/refs
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: position } } }], {
          useNativeDriver: Platform.OS !== 'web',
          listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
            offset.current = event.nativeEvent.contentOffset.y;
            setMoving(true);
            if (!fingerDown.current) scheduleSettle();
          },
        })}
        onScrollBeginDrag={() => { clearTimer(); fingerDown.current = true; setMoving(true); }}
        onScrollEndDrag={() => { fingerDown.current = false; scheduleSettle(); }}
        onMomentumScrollBegin={clearTimer}
        onMomentumScrollEnd={settle}
        renderItem={({ item }) => {
          if (item < 0 || item > max) return <View style={{ height: rowHeight }} />;
          const center = item * rowHeight;
          const inputRange = [center - rowHeight * 2, center - rowHeight, center, center + rowHeight, center + rowHeight * 2];
          return (
            <Pressable
              accessible={false}
              disabled={disabled}
              onPress={() => {
                if (moving.current) return;
                if (item === wheelIndex(offset.current, rowHeight, max)) onEdit();
                else select(item);
              }}
              style={[styles.row, { height: rowHeight }]}>
              <Animated.View style={{
                opacity: position.interpolate({ inputRange, outputRange: [0.05, 0.3, 1, 0.3, 0.05], extrapolate: 'clamp' }),
              }}>
                <Text allowFontScaling={false} style={[styles.number, { fontSize: rowHeight * (item >= 100 ? 0.62 : 0.8), lineHeight: rowHeight }]}>{max === 9 ? `,${item}` : item}</Text>
              </Animated.View>
            </Pressable>
          );
        }}
      />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { flex: 1, minWidth: 0, overflow: 'hidden' },
  row: { alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: BerkkFonts.black, color: Berkk.ink, fontVariant: ['tabular-nums'], textAlign: 'center', includeFontPadding: false, letterSpacing: -2 },
});
