import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useExerciseReducedMotion } from "@/hooks/use-exercise-reduced-motion";
import { BerkkFonts as F } from "@/constants/theme";
import {
  copy,
  dayNames,
  experiences,
  goals,
  Onboarding as O,
  weekdays,
} from "@/constants/onboarding";
import { useOnboarding } from "@/store/onboarding";
import { useBodyWeight } from "@/store/body-weight";
import {
  validStartWeight,
  type Experience,
  type Goal,
} from "@/store/onboarding-state";
import {
  OnboardingAtmosphere,
  OnboardingScene,
  useOnboardingLoop,
  type OnboardingMood,
} from "./onboarding-scene";
import { OnboardingWeight } from "./onboarding-weight";
import { ArrowLeftIcon } from "./icons";

export function OnboardingScreen() {
  const store = useOnboarding(),
    weight = useBodyWeight();
  const d = store.draft,
    step = d.step;
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets(),
    reduced = useExerciseReducedMotion(),
    focused = useIsFocused();
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mood, setMood] = useState<OnboardingMood>("idle"),
    [reaction, setReaction] = useState(0);
  const [draftKg, setDraftKg] = useState(
    d.weightKg ?? weight.currentWeight ?? 82.4,
  );
  const [weightBlocked, setWeightBlocked] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const locked = useRef(false),
    timers = useRef<ReturnType<typeof setTimeout>[]>([]),
    moodTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const initializedWeight = useRef(false),
    scroll = useRef<ScrollView>(null);
  const transition = useSharedValue(1),
    direction = useSharedValue(1);
  const compact = height < 740,
    active = foreground && focused && !reduced;
  const contentStyle = useAnimatedStyle(() => ({
    opacity: transition.value,
    transform: [
      {
        translateX: reduced ? 0 : (1 - transition.value) * 14 * direction.value,
      },
    ],
  }));
  const setBlocked = useCallback(
    (blocked: boolean) => setWeightBlocked(blocked),
    [],
  );
  useEffect(() => {
    if (weight.hydrated && !initializedWeight.current) {
      initializedWeight.current = true;
      setDraftKg(d.weightKg ?? weight.currentWeight ?? 82.4);
    }
  }, [weight.hydrated, weight.currentWeight, d.weightKg]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) =>
      setForeground(s === "active"),
    );
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardShown(true);
      timers.current.push(
        setTimeout(() => scroll.current?.scrollToEnd({ animated: false }), 80),
      );
    });
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardShown(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(moodTimer.current);
    },
    [],
  );
  const react = (next: OnboardingMood, ms = 1800) => {
    clearTimeout(moodTimer.current);
    setMood(next);
    if (ms) moodTimer.current = setTimeout(() => setMood("idle"), ms);
  };
  const go = (next: number, patch = {}) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    Keyboard.dismiss();
    const reverse = next < step;
    direction.set(reverse ? -1 : 1);
    transition.set(withTiming(0, { duration: reduced ? 0 : O.motion.exit }));
    const change = () => {
      clearTimeout(moodTimer.current);
      setMood(next === 6 ? "happy" : "idle");
      store.update({ ...patch, step: next });
      scroll.current?.scrollTo({ y: 0, animated: false });
      transition.set(
        withTiming(1, {
          duration: reduced ? 0 : 380,
          easing: Easing.bezier(...O.ease),
        }),
      );
      timers.current.push(
        setTimeout(
          () => {
            locked.current = false;
            setBusy(false);
          },
          reduced ? 0 : 300,
        ),
      );
    };
    timers.current.push(setTimeout(change, reduced ? 0 : O.motion.exit));
  };
  const back = () => {
    if (step > 0) go(d.returnTo ?? step - 1, { returnTo: null });
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!focused) return false;
      if (step > 0) back();
      return true;
    });
    return () => sub.remove();
  });
  const skip = () =>
    go(d.returnTo ?? step + 1, {
      returnTo: null,
      ...(step === 5 ? { weightKg: null, weightConfirmed: false } : {}),
    });
  const finish = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      // Existing values are prefilled; only an explicit weight confirmation can change them.
      if (
        d.weightConfirmed &&
        d.weightKg !== null &&
        d.weightKg !== weight.currentWeight
      ) {
        if (!weight.hydrated || weight.loadError)
          throw new Error(
            "Gewichtsdaten konnten nicht geladen werden. Bitte erneut versuchen.",
          );
        await weight.saveWeight(d.weightKg);
      }
      await store.complete();
      router.replace("/(tabs)");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message === "Onboarding storage failed"
            ? "Deine Angaben konnten nicht gespeichert werden. Bitte erneut versuchen."
            : e.message
          : "Speichern fehlgeschlagen. Bitte erneut versuchen.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const next = () => {
    if (step === 6) {
      void finish();
      return;
    }
    if (step === 5) {
      if (weightBlocked) {
        setError(
          "Bestätige deine Eingabe zuerst mit OK und warte, bis die Räder stehen.",
        );
        return;
      }
      if (!validStartWeight(draftKg)) {
        setError("Bitte wähle einen Wert zwischen 20 und 350 kg.");
        return;
      }
    }
    go(d.returnTo ?? step + 1, {
      returnTo: null,
      ...(step === 5
        ? { weightKg: Math.round(draftKg * 100) / 100, weightConfirmed: true }
        : {}),
    });
  };
  const enabled =
    !busy &&
    (step !== 1 || d.demoDone) &&
    (step !== 2 || !!d.goal) &&
    (step !== 3 || !!d.experience) &&
    (step !== 4 || d.days.length > 0) &&
    (step !== 5 || (weight.hydrated && !weightBlocked));
  const label = [
    "Los geht’s",
    "Weiter",
    "Das ist mein Ziel",
    "Weiter",
    "Rhythmus übernehmen",
    "Gewicht übernehmen",
    "In die Übersicht",
  ][step];
  const helper =
    step === 2
      ? "Eine Auswahl reicht."
      : step === 4
        ? "Oder lege deine Tage später fest."
        : step === 5
          ? "Scrollen, um dein Gewicht einzustellen."
          : step === 6
            ? "Alles bereit für deinen ersten Schritt."
            : "";
  const edit = (s: number) => {
    if (s === 5) setDraftKg(d.weightKg ?? weight.currentWeight ?? 82.4);
    go(s, { returnTo: 6 });
  };
  const c = copy[step];
  if (!store.hydrated)
    return (
      <View style={[s.root, s.loading]}>
        <StatusBar style="light" />
        {store.error ? (
          <>
            <Text style={s.intro}>{store.error}</Text>
            <Pressable
              onPress={() => void store.hydrate()}
              style={s.smallButton}
            >
              <Text style={s.body}>Erneut versuchen</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={O.ink} />
        )}
      </View>
    );
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <OnboardingAtmosphere active={active} />
      <View style={[s.container, { maxWidth: 600 }]}>
        <OnboardingScene
          step={step}
          compact={compact}
          width={Math.min(width, 600)}
          top={72 + insets.top}
          active={active}
          reduced={reduced}
          mood={step === 6 ? "happy" : mood}
          reaction={reaction}
        />
        <View style={[s.topbar, { marginTop: insets.top, height: 68 }]}>
          {step > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zurück"
              disabled={busy}
              onPress={back}
              style={s.back}
            >
              <ArrowLeftIcon color={O.ink} size={24} />
            </Pressable>
          )}
          <Text style={s.wordmark}>BERKK</Text>
          {[1, 4, 5].includes(step) && (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={skip}
              style={[s.quiet, { marginLeft: "auto" }]}
            >
              <Text style={s.small}>Überspringen</Text>
            </Pressable>
          )}
        </View>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Einrichtung"
          accessibilityValue={{ min: 0, max: 6, now: step }}
          style={[s.progress, { opacity: step ? 1 : 0 }]}
        >
          <View
            style={{
              height: 2,
              width: `${(step / 6) * 100}%`,
              backgroundColor: "#F8B182",
            }}
          />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : Platform.OS === "android"
                ? "height"
                : undefined
          }
        >
          <ScrollView
            ref={scroll}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop:
                step === 0
                  ? compact
                    ? 258
                    : 325
                  : step === 6
                    ? compact
                      ? 165
                      : 225
                    : compact
                      ? 22
                      : 36,
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={contentStyle}>
              <Entrance key={`${step}-eyebrow`} index={0} reduced={reduced}>
                <Text style={s.eyebrow}>{c[0].toLocaleUpperCase("de-DE")}</Text>
              </Entrance>
              <Entrance key={`${step}-heading`} index={1} reduced={reduced}>
                <Text
                  accessibilityRole="header"
                  style={[
                    s.heading,
                    {
                      marginBottom: compact ? 14 : 18,
                      fontSize:
                        step === 0
                          ? compact
                            ? 41
                            : 46
                          : step === 6
                            ? 38
                            : compact
                              ? 37
                              : 43,
                      lineHeight:
                        (step === 0
                          ? compact
                            ? 41
                            : 46
                          : step === 6
                            ? 38
                            : compact
                              ? 37
                              : 43) * 1.07,
                    },
                  ]}
                >
                  {c[1]}
                  {"\n"}
                  <Text style={{ color: O.emphasis }}>{c[2]}</Text>
                </Text>
              </Entrance>
              <Entrance key={`${step}-intro`} index={2} reduced={reduced}>
                <Text
                  style={[
                    s.intro,
                    {
                      fontSize: compact ? 13 : 14,
                      lineHeight: compact ? 20.8 : 22.4,
                      marginBottom:
                        step === 0 && compact ? 8 : compact ? 18 : 24,
                    },
                  ]}
                >
                  {c[3]}
                </Text>
              </Entrance>
              <Entrance key={`${step}-body`} index={3} reduced={reduced}>
                {step === 1 && (
                  <View style={{ marginTop: compact ? 20 : 30 }}>
                    <View style={s.practiceHead}>
                      <Text style={s.practiceTitle}>Bankdrücken</Text>
                      <Text style={s.tiny}>PROBE-SATZ</Text>
                    </View>
                    <View
                      style={[
                        s.setGrid,
                        { paddingVertical: compact ? 16 : 25 },
                      ]}
                    >
                      {(["demoWeight", "demoReps"] as const).map((field, i) => (
                        <View key={field} style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.small}>
                            {i ? "Wiederholungen" : "Gewicht"}
                          </Text>
                          <Text style={s.setValue}>
                            {String(d[field]).replace(".", ",")}{" "}
                            <Text style={s.small}>{i ? "Wdh." : "kg"}</Text>
                          </Text>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            {[-1, 1].map((delta) => (
                              <Pressable
                                key={delta}
                                accessibilityRole="button"
                                accessibilityLabel={`${i ? "Wiederholungen" : "Gewicht"} ${delta > 0 ? "erhöhen" : "verringern"}`}
                                onPress={() => {
                                  store.update({
                                    [field]: Math.max(
                                      i ? 1 : 0,
                                      Math.min(
                                        i ? 100 : 300,
                                        d[field] + delta * (i ? 1 : 2.5),
                                      ),
                                    ),
                                    demoDone: false,
                                  });
                                  react("curious");
                                }}
                                style={s.stepper}
                              >
                                <Text style={[s.body, { fontSize: 22 }]}>
                                  {delta > 0 ? "+" : "−"}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: d.demoDone }}
                      onPress={() => {
                        if (d.demoDone) return;
                        store.update({ demoDone: true });
                        react("celebrate", 1100);
                        setReaction((v) => v + 1);
                      }}
                      style={[
                        s.confirm,
                        d.demoDone && {
                          borderColor: "#B3BC7C60",
                          backgroundColor: "#C0D27D10",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.confirmText,
                          d.demoDone && { color: "#D5D9B4" },
                        ]}
                      >
                        {d.demoDone
                          ? "✓  Satz bestätigt"
                          : "Satz bestätigen  ✓"}
                      </Text>
                    </Pressable>
                    <Text style={[s.small, { marginTop: 14, lineHeight: 17 }]}>
                      Nur zum Ausprobieren. Dieser Satz zählt nicht zu deinem
                      Training.
                    </Text>
                    <Text accessibilityLiveRegion="polite" style={s.feedback}>
                      {d.demoDone
                        ? "Genau so einfach bleibt’s im Training."
                        : ""}
                    </Text>
                  </View>
                )}
                {(step === 2 || step === 3) && (
                  <View style={{ marginTop: compact ? 20 : 30 }}>
                    {(step === 2 ? goals : experiences).map(
                      ([value, title, description], i) => (
                        <Choice
                          key={value}
                          index={i}
                          title={title}
                          description={description}
                          selected={
                            (step === 2 ? d.goal : d.experience) === value
                          }
                          reduced={reduced}
                          onPress={() => {
                            store.update(
                              step === 2
                                ? { goal: value as Goal }
                                : { experience: value as Experience },
                            );
                            react(
                              step === 3 && value === "regular"
                                ? "focused"
                                : "happy",
                            );
                          }}
                        />
                      ),
                    )}
                    <Text accessibilityLiveRegion="polite" style={s.feedback}>
                      {step === 2 && d.goal
                        ? {
                            strength: "Jeder Satz bringt dich weiter.",
                            muscle: "Lass deinen Fortschritt sichtbar werden.",
                            routine: "Ein Rhythmus, der zu dir passt.",
                          }[d.goal]
                        : step === 3 && d.experience
                          ? "Wir starten da, wo du gerade bist."
                          : ""}
                    </Text>
                  </View>
                )}
                {step === 4 && (
                  <View>
                    <View
                      style={[
                        s.days,
                        {
                          marginHorizontal: width < 400 ? -12 : 0,
                          marginTop: compact ? 22 : 34,
                        },
                      ]}
                    >
                      {weekdays.map((day, i) => (
                        <Pressable
                          key={day}
                          accessibilityRole="checkbox"
                          accessibilityLabel={dayNames[i]}
                          accessibilityState={{ checked: d.days.includes(i) }}
                          aria-checked={d.days.includes(i)}
                          onPress={() => {
                            store.update({
                              days: d.days.includes(i)
                                ? d.days.filter((n) => n !== i)
                                : [...d.days, i].sort(),
                            });
                            react("happy", 900);
                          }}
                          style={[
                            s.day,
                            d.days.includes(i) && {
                              backgroundColor: "#F6A575",
                              borderColor: "#FFB47D",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.body,
                              {
                                fontSize: 13,
                                color: d.days.includes(i) ? "#32190C" : O.muted,
                              },
                            ]}
                          >
                            {day}
                          </Text>
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: d.days.includes(i)
                                ? "#32190C"
                                : "#F5EFE624",
                            }}
                          />
                        </Pressable>
                      ))}
                    </View>
                    <Text accessibilityLiveRegion="polite" style={s.schedule}>
                      {d.days.length ? (
                        <>
                          <Text style={{ color: O.orange }}>
                            {d.days.length}×
                          </Text>{" "}
                          pro Woche
                        </>
                      ) : (
                        "Dein Rhythmus ist offen."
                      )}
                    </Text>
                    <Text style={s.intro}>
                      Ruhetage gehören dazu. Dein Wochenrhythmus ist jederzeit
                      anpassbar.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        store.update({ days: [0, 2, 4] });
                        react("happy");
                      }}
                      style={s.quiet}
                    >
                      <Text
                        style={[
                          s.small,
                          { color: "#FFB88D", textDecorationLine: "underline" },
                        ]}
                      >
                        Mo · Mi · Fr als Vorschlag wählen
                      </Text>
                    </Pressable>
                  </View>
                )}
                {step === 5 && (
                  <View style={{ marginTop: compact ? 14 : 28 }}>
                    <OnboardingWeight
                      kg={draftKg}
                      unit={d.unit}
                      onChange={setDraftKg}
                      onUnit={(unit) => store.update({ unit })}
                      onBlocked={setBlocked}
                    />
                    {weight.loadError && (
                      <Pressable
                        onPress={() => void weight.hydrate()}
                        style={s.quiet}
                      >
                        <Text style={s.feedback}>
                          Gewichtsdaten erneut laden
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
                {step === 6 && (
                  <View style={s.summary}>
                    {[
                      [
                        "Dein Ziel",
                        goals.find((g) => g[0] === d.goal)?.[1] ?? "Noch offen",
                        2,
                      ],
                      [
                        "Deine Erfahrung",
                        experiences.find((e) => e[0] === d.experience)?.[1] ??
                          "Noch offen",
                        3,
                      ],
                      [
                        "Deine Woche",
                        d.days.map((i) => weekdays[i]).join(" · ") ||
                          "Später festlegen",
                        4,
                      ],
                      [
                        "Startgewicht",
                        d.weightConfirmed && d.weightKg !== null
                          ? `${(d.weightKg * (d.unit === "lb" ? 2.2046226218 : 1)).toLocaleString("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ${d.unit}`
                          : weight.currentWeight !== null
                            ? `${weight.currentWeight.toLocaleString("de-DE")} kg · vorhanden`
                            : "Später ergänzen",
                        5,
                      ],
                    ].map(([title, value, dest]) => (
                      <View
                        key={title}
                        style={[
                          s.summaryRow,
                          {
                            paddingVertical: compact ? 7 : 12,
                            flexWrap: fontScale > 1.3 ? "wrap" : "nowrap",
                          },
                        ]}
                      >
                        <Text style={s.small}>{title}</Text>
                        <Text
                          style={[
                            s.body,
                            { fontSize: 12, flex: 1, textAlign: "right" },
                          ]}
                        >
                          {value}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${title} ändern`}
                          onPress={() => edit(Number(dest))}
                          style={s.quiet}
                        >
                          <Text style={[s.small, { color: "#FFB88D" }]}>
                            Ändern
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </Entrance>
            </Animated.View>
          </ScrollView>
          <View
            style={[
              s.footer,
              {
                paddingBottom: Math.max(28, insets.bottom + 13),
                paddingTop: compact ? 8 : 12,
              },
            ]}
          >
            {!!(error || store.error) && (
              <Text
                accessibilityRole="alert"
                style={[
                  s.small,
                  { textAlign: "center", color: "#FFC19F", marginBottom: 8 },
                ]}
              >
                {error || store.error}
              </Text>
            )}
            {step > 0 && !keyboardShown && (
              <Text
                style={[
                  s.footnote,
                  {
                    marginBottom: compact ? 8 : 12,
                    marginTop: 0,
                    minHeight: 17,
                  },
                ]}
              >
                {helper}
              </Text>
            )}
            <Primary
              label={busy && step === 6 ? "Wird gespeichert…" : label}
              active={active}
              enabled={enabled}
              onPress={next}
            />
            {!keyboardShown && (
              <Text style={[s.footnote, { marginTop: compact ? 9 : 13 }]}>
                {step === 0
                  ? "Ohne Konto starten. In deinem Tempo."
                  : "Du kannst deine Angaben später ändern."}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

function Entrance({
  children,
  index,
  reduced,
}: PropsWithChildren<{ index: number; reduced: boolean }>) {
  const v = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    v.set(
      withDelay(
        reduced ? 0 : [0, 35, 65, 90][index],
        withTiming(1, {
          duration: reduced ? 0 : [380, 500, 500, 550][index],
          easing: Easing.bezier(...O.ease),
        }),
      ),
    );
  }, [index, reduced, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [
      { translateX: reduced ? 0 : (1 - v.value) * 20 },
      { translateY: reduced ? 0 : (1 - v.value) * 8 },
    ],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
function Choice({
  index,
  title,
  description,
  selected,
  reduced,
  onPress,
}: {
  index: number;
  title: string;
  description: string;
  selected: boolean;
  reduced: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.set(
      withTiming(selected && !reduced ? 1.08 : 1, {
        duration: 350,
        easing: Easing.bezier(...O.ease),
      }),
    );
  }, [selected, reduced, scale]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      style={[
        s.choice,
        index === 0 && { borderTopWidth: 1 },
        selected && { backgroundColor: "#FFAB7608" },
      ]}
    >
      <Text
        style={[
          s.small,
          { width: 20, color: selected ? "#FFAC77" : "#B7A6A577" },
        ]}
      >
        0{index + 1}
      </Text>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.choiceTitle, selected && { color: "#FFB380" }]}>
          {title}
        </Text>
        <Text style={[s.small, { marginTop: 6 }]}>{description}</Text>
      </View>
      <Animated.View
        style={[
          s.mark,
          selected && { backgroundColor: "#FFAC77", borderColor: "#FFAC77" },
          style,
        ]}
      >
        {selected && <Text style={{ color: "#30180E" }}>✓</Text>}
      </Animated.View>
    </Pressable>
  );
}
function Primary({
  label,
  active,
  enabled,
  onPress,
}: {
  label: string;
  active: boolean;
  enabled: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));
  const phase = useOnboardingLoop(O.motion.sheen, active);
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          phase.value < 0.65 || phase.value > 0.85
            ? -600
            : -600 + ((phase.value - 0.65) / 0.2) * 1200,
      },
    ],
  }));
  return (
    <Animated.View style={pressStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled }}
        aria-disabled={!enabled}
        disabled={!enabled}
        onPress={onPress}
        onPressIn={() => {
          if (active) press.set(withTiming(0.97, { duration: 100 }));
        }}
        onPressOut={() =>
          press.set(withTiming(1, { duration: active ? 180 : 0 }))
        }
        style={{ opacity: enabled ? 1 : 0.35 }}
      >
        <LinearGradient
          colors={["#FFD0A2", "#F69A66", "#EC8067"]}
          locations={[0, 0.58, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.45 }}
          style={s.primary}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", width: 450, top: 0, bottom: 0 },
              style,
            ]}
          >
            <LinearGradient
              colors={["#FFF5F000", "#FFF5F055", "#FFF5F000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0.3 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Text style={s.primaryText}>{label}</Text>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={s.arrow}
          >
            <Text
              style={{ fontFamily: F.regular, color: "#30180E", fontSize: 24 }}
            >
              ↗
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: O.base, overflow: "hidden" },
  container: { flex: 1, width: "100%", alignSelf: "center" },
  loading: { alignItems: "center", justifyContent: "center", padding: 28 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 26,
    gap: 16,
    zIndex: 3,
  },
  wordmark: {
    fontFamily: F.bold,
    color: O.ink,
    fontSize: 20,
    letterSpacing: -1,
  },
  back: {
    marginLeft: -8,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: O.line,
    borderRadius: 22,
    backgroundColor: "#FFFFFF08",
    justifyContent: "center",
    alignItems: "center",
  },
  quiet: { minHeight: 44, minWidth: 44, justifyContent: "center" },
  progress: { height: 2, marginTop: 12, marginHorizontal: 28 },
  eyebrow: {
    fontFamily: F.bold,
    color: O.orange,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 15,
  },
  heading: {
    fontFamily: F.bold,
    color: O.ink,
    letterSpacing: -2.1,
    marginBottom: 18,
  },
  intro: {
    fontFamily: F.regular,
    color: O.muted,
    fontSize: 14,
    lineHeight: 22.4,
    maxWidth: 290,
    marginBottom: 24,
  },
  body: { fontFamily: F.regular, color: O.ink, fontSize: 14 },
  small: { fontFamily: F.regular, color: O.muted, fontSize: 12 },
  tiny: {
    fontFamily: F.regular,
    color: O.muted,
    fontSize: 10,
    letterSpacing: 1,
  },
  footer: { paddingHorizontal: 26 },
  footnote: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    color: O.muted,
  },
  primary: {
    minHeight: 60,
    paddingVertical: 10,
    paddingLeft: 24,
    paddingRight: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD4AE88",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    overflow: "hidden",
  },
  primaryText: { fontFamily: F.bold, fontSize: 16, color: "#30180E", flex: 1 },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#32190C12",
  },
  choice: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: O.line,
  },
  choiceTitle: {
    fontFamily: F.regular,
    fontSize: 19,
    letterSpacing: -0.3,
    color: O.ink,
  },
  mark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#F5EFE63B",
    justifyContent: "center",
    alignItems: "center",
  },
  feedback: {
    fontFamily: F.regular,
    color: "#FFBF92",
    fontSize: 13,
    marginTop: 12,
    minHeight: 24,
  },
  practiceHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: O.line,
    paddingBottom: 17,
  },
  practiceTitle: { fontFamily: F.bold, color: O.ink, fontSize: 17 },
  setGrid: { flexDirection: "row", gap: 20 },
  setValue: {
    fontFamily: F.bold,
    fontSize: 43,
    letterSpacing: -2,
    color: O.ink,
    lineHeight: 60,
  },
  stepper: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: O.line,
    borderRadius: 12,
    backgroundColor: "#F5EFE608",
    justifyContent: "center",
    alignItems: "center",
  },
  confirm: {
    minHeight: 48,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDB38A50",
    backgroundColor: "#EEBF9410",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { fontFamily: F.bold, color: "#FFB88D", fontSize: 13 },
  days: { flexDirection: "row", gap: 1 },
  day: {
    flex: 1,
    minWidth: 44,
    minHeight: 102,
    borderWidth: 1,
    borderColor: O.line,
    borderRadius: 25,
    paddingTop: 17,
    paddingBottom: 15,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF03",
  },
  schedule: {
    fontFamily: F.bold,
    fontSize: 30,
    letterSpacing: -1,
    color: O.ink,
    marginTop: 30,
    marginBottom: 8,
  },
  summary: { borderTopWidth: 1, borderColor: O.line, marginTop: 22 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: O.line,
  },
  smallButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
});
