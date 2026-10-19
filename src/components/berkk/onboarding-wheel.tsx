/* eslint-disable react-hooks/refs -- Animated.event registers listeners; these refs are read only by scroll events. */
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { BerkkFonts } from "@/constants/theme";
import { Onboarding } from "@/constants/onboarding";

const ROW = 60;
/** Independent native scroll pane, windowed without nesting a VirtualizedList in the page. */
export function OnboardingWheel({
  value,
  min,
  max,
  label,
  onChange,
  onMoving,
  onEdit,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  onMoving: (moving: boolean) => void;
  onEdit: () => void;
}) {
  const initial = Math.max(min, Math.min(max, value));
  const scroll = useRef<ScrollView>(null);
  const [center, setCenter] = useState(initial);
  const [position] = useState(() => new Animated.Value((initial - min) * ROW));
  const offset = useRef((initial - min) * ROW),
    down = useRef(false),
    moving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const interacted = useRef(false);
  const from = Math.max(min, center - 8),
    to = Math.min(max, center + 8);
  useEffect(() => {
    scroll.current?.scrollTo({ y: (initial - min) * ROW, animated: false });
    return () => clearTimeout(timer.current);
    // External value changes arrive only after this wheel has settled; unit/manual changes remount it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const markMoving = (next: boolean) => {
    if (moving.current !== next) {
      moving.current = next;
      onMoving(next);
    }
  };
  const nearest = () =>
    Math.max(min, Math.min(max, Math.round(offset.current / ROW) + min));
  const select = (next: number) => {
    clearTimeout(timer.current);
    const n = Math.max(min, Math.min(max, next));
    offset.current = (n - min) * ROW;
    scroll.current?.scrollTo({ y: offset.current, animated: false });
    position.setValue(offset.current);
    setCenter(n);
    onChange(n);
    interacted.current = false;
    markMoving(false);
  };
  const settle = () => select(nearest());
  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(settle, 160);
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: initial }}
      accessibilityHint="Nach oben oder unten streichen. Doppeltippen öffnet die Tastatur."
      accessibilityActions={[
        { name: "increment" },
        { name: "decrement" },
        { name: "activate", label: "Mit Tastatur eingeben" },
      ]}
      onAccessibilityTap={onEdit}
      onAccessibilityAction={({ nativeEvent: { actionName } }) => {
        if (actionName === "increment") select(initial + 1);
        else if (actionName === "decrement") select(initial - 1);
        else onEdit();
      }}
      style={{ height: 210, overflow: "hidden" }}
    >
      <GestureDetector gesture={Gesture.Native().disallowInterruption(true)}>
        <Animated.ScrollView
          ref={scroll}
          nestedScrollEnabled
          style={{ height: 210 }}
          contentContainerStyle={{ paddingVertical: 75 }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            interacted.current = true;
            down.current = true;
            clearTimeout(timer.current);
            markMoving(true);
          }}
          onScrollEndDrag={() => {
            down.current = false;
            schedule();
          }}
          onMomentumScrollBegin={() => clearTimeout(timer.current)}
          onMomentumScrollEnd={() => {
            if (interacted.current) settle();
          }}
          // Animated.event registers a listener; refs are read only when scrolling.
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: position } } }],
            {
              useNativeDriver: Platform.OS !== "web",
              listener: (event: {
                nativeEvent: { contentOffset: { y: number } };
              }) => {
                offset.current = event.nativeEvent.contentOffset.y;
                const n = nearest();
                if (Math.abs(n - center) >= 3) setCenter(n);
                if (interacted.current) {
                  markMoving(true);
                  if (!down.current) schedule();
                }
              },
            },
          )}
        >
          <View style={{ height: (from - min) * ROW }} />
          {Array.from({ length: to - from + 1 }, (_, i) => i + from).map(
            (n) => {
              const y = (n - min) * ROW;
              return (
                <Pressable
                  key={n}
                  accessible={false}
                  onPress={() => {
                    if (!moving.current) {
                      if (nearest() === n) onEdit();
                      else select(n);
                    }
                  }}
                  style={{
                    height: ROW,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Animated.View
                    style={{
                      opacity: position.interpolate({
                        inputRange: [y - 120, y - 60, y, y + 60, y + 120],
                        outputRange: [0.05, 0.2, 1, 0.2, 0.05],
                        extrapolate: "clamp",
                      }),
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: BerkkFonts.bold,
                        color: Onboarding.ink,
                        fontSize: n >= 100 ? 40 : 49,
                        lineHeight: ROW,
                        letterSpacing: -2,
                        includeFontPadding: false,
                      }}
                    >
                      {n}
                    </Text>
                  </Animated.View>
                </Pressable>
              );
            },
          )}
          <View style={{ height: (max - to) * ROW }} />
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
}
