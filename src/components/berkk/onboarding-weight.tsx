import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { OnboardingWheel } from "./onboarding-wheel";
import { Onboarding as O } from "@/constants/onboarding";
import { BerkkFonts as F } from "@/constants/theme";
import { manualWeight, validStartWeight } from "@/store/onboarding-state";

export function OnboardingWeight({
  kg,
  unit,
  onChange,
  onUnit,
  onBlocked,
}: {
  kg: number;
  unit: "kg" | "lb";
  onChange: (kg: number) => void;
  onUnit: (unit: "kg" | "lb") => void;
  onBlocked: (blocked: boolean) => void;
}) {
  const [editing, setEditing] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState("");
  const moving = useRef(new Set<string>());
  const input = useRef<TextInput>(null);
  const factor = unit === "lb" ? 2.2046226218 : 1;
  const tenths = Math.round(kg * factor * 10);
  const whole = Math.floor(tenths / 10),
    decimal = tenths % 10;
  useEffect(() => {
    onBlocked(editing);
    return () => onBlocked(false);
  }, [editing, onBlocked]);
  const edit = () => {
    setText((kg * factor).toFixed(1).replace(".", ","));
    setEditing(true);
    setError("");
    requestAnimationFrame(() => input.current?.focus());
  };
  const settle = (name: string, value: boolean) => {
    if (value) moving.current.add(name);
    else moving.current.delete(name);
    onBlocked(editing || moving.current.size > 0);
  };
  const update = (value: number) => {
    const next = value / factor;
    onChange(next);
    setError(
      validStartWeight(next)
        ? ""
        : "Bitte wähle einen Wert zwischen 20 und 350 kg.",
    );
  };
  const confirm = () => {
    const next = manualWeight(text, unit);
    if (next === null) {
      setError("Bitte gib eine gültige Zahl zwischen 20 und 350 kg ein.");
      return;
    }
    onChange(next);
    setEditing(false);
    setError("");
    Keyboard.dismiss();
  };
  return (
    <View>
      <View style={s.unitRow}>
        <Text style={s.label}>Körpergewicht</Text>
        <View style={s.units}>
          {(["kg", "lb"] as const).map((u) => (
            <Pressable
              key={u}
              accessibilityRole="radio"
              accessibilityState={{ checked: unit === u }}
              aria-checked={unit === u}
              accessibilityLabel={u === "kg" ? "Kilogramm" : "Pfund"}
              disabled={editing}
              onPress={() => {
                moving.current.clear();
                onBlocked(false);
                onUnit(u);
              }}
              style={[s.unit, unit === u && { backgroundColor: O.ink }]}
            >
              <Text style={[s.label, unit === u && { color: "#291820" }]}>
                {u}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!editing && (
        <View style={s.wheels}>
          <View pointerEvents="none" style={s.lines} />
          <View pointerEvents="none" style={[s.lines, { top: 135 }]} />
          <View style={{ width: 123 }}>
            <OnboardingWheel
              key={`${unit}-whole`}
              value={whole}
              min={unit === "kg" ? 20 : 44}
              max={unit === "kg" ? 350 : 772}
              label={`Ganze ${unit === "kg" ? "Kilogramm" : "Pfund"}`}
              onChange={(v) => update(v + decimal / 10)}
              onMoving={(v) => settle("whole", v)}
              onEdit={edit}
            />
          </View>
          <Text allowFontScaling={false} style={s.comma}>
            ,
          </Text>
          <View style={{ width: 70 }}>
            <OnboardingWheel
              key={`${unit}-decimal`}
              value={decimal}
              min={0}
              max={9}
              label="Nachkommastelle"
              onChange={(v) => update(whole + v / 10)}
              onMoving={(v) => settle("decimal", v)}
              onEdit={edit}
            />
          </View>
          <Text style={s.label}>{unit}</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={
          editing
            ? () => {
                setEditing(false);
                Keyboard.dismiss();
              }
            : edit
        }
        style={s.manual}
      >
        <Text style={[s.label, { textDecorationLine: "underline" }]}>
          {editing
            ? "Zurück zu den Scrollrädern"
            : "Zahl über die Tastatur eingeben"}
        </Text>
      </Pressable>
      {editing && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            ref={input}
            accessibilityLabel={`Gewicht in ${unit}`}
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={confirm}
            selectTextOnFocus
            style={s.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gewichtseingabe bestätigen"
            onPress={confirm}
            style={s.ok}
          >
            <Text style={s.label}>OK</Text>
          </Pressable>
        </View>
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={[s.label, { color: "#FFC19F", marginTop: 8 }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  label: { fontFamily: F.regular, fontSize: 12, color: O.muted },
  unitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  units: {
    flexDirection: "row",
    padding: 3,
    borderWidth: 1,
    borderColor: O.line,
    borderRadius: 30,
    backgroundColor: "#F5EFE608",
  },
  unit: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  wheels: {
    height: 210,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  lines: {
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: O.line,
  },
  comma: { fontFamily: F.bold, color: O.ink, fontSize: 49, lineHeight: 60 },
  manual: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: F.regular,
    color: O.ink,
    fontSize: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F5EFE640",
    borderRadius: 12,
    backgroundColor: "#FFFFFF08",
  },
  ok: {
    minWidth: 52,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: O.line,
    borderRadius: 12,
  },
});
