import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { DetailDragHeader, useDetailMotion, useDetailSheet } from '@/components/berkk/detail-sheet';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { useBodyWeight } from '@/store/body-weight';

import { WeightChart } from './weight-chart';
import { initialWeightTenths, parsePickerInput, pickerText } from './weight-picker-state';
import { WeightWheel } from './weight-wheel';

/** BERKK's warm diagonal sheet gradient, shared by both render states below. */
function SheetBackground() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={Berkk.detailGradient}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** The only weight screen; drafts mount after hydration so saved values always win. */
export function WeightEditor() {
  const { currentWeight, hydrated, loadError, hydrate } = useBodyWeight();
  const { dismiss } = useDetailSheet();
  if (!hydrated) return (
    <View style={styles.root}>
      <SheetBackground />
      <DetailDragHeader><View style={styles.toolbar}><CloseButton onPress={dismiss} /></View></DetailDragHeader>
      <View style={styles.intro}>
        <Text style={styles.title}>Körpergewicht</Text>
        <Text style={styles.subtitle}>{loadError ? 'Gewicht konnte nicht geladen werden.' : 'Wird geladen …'}</Text>
        {loadError && <Pressable onPress={() => void hydrate()} accessibilityRole="button" style={styles.retry}><Text style={styles.retryText}>Erneut laden</Text></Pressable>}
      </View>
    </View>
  );
  return <WeightEditorDraft currentWeight={currentWeight} />;
}

function WeightEditorDraft({ currentWeight }: { currentWeight: number | null }) {
  const [tenths, setTenths] = useState(() => initialWeightTenths(currentWeight));
  const [input, setInput] = useState(() => pickerText(initialWeightTenths(currentWeight)));
  const [typing, setTyping] = useState(false);
  const [moving, setMoving] = useState({ kg: false, decimal: false });
  const [saveError, setSaveError] = useState(false);
  const { saveWeight, saving, entries } = useBodyWeight();
  const { dismiss } = useDetailSheet();
  const { sheetHeight } = useDetailMotion();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const short = sheetHeight < 650;
  const landscape = sheetHeight < 430;
  const rowHeight = Math.min(landscape ? 72 : short ? 104 : 132, Math.round(width * 0.34));
  const wheelHeight = Math.round(rowHeight * 1.85);
  const draft = typing ? parsePickerInput(input) : tenths > 0 ? tenths : null;
  const rolling = moving.kg || moving.decimal;
  const disabled = draft === null || rolling || saving;

  const edit = () => {
    if (saving || rolling) return;
    setInput(pickerText(tenths));
    setTyping(true);
    setSaveError(false);
  };
  const showWheels = () => {
    const parsed = parsePickerInput(input);
    if (parsed === null) return;
    setTenths(parsed);
    Keyboard.dismiss();
    setTyping(false);
  };
  const save = async () => {
    if (disabled || draft === null) return;
    setSaveError(false);
    try {
      await saveWeight(draft / 10);
      dismiss();
    } catch {
      setSaveError(true);
    }
  };

  return (
    <KeyboardAvoidingView testID="weight-editor" style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={height - sheetHeight}>
      <SheetBackground />
      <DetailDragHeader>
        <View style={[styles.toolbar, landscape && styles.shortToolbar]}>
          <View pointerEvents="none" style={styles.handle} />
          <CloseButton onPress={dismiss} disabled={saving} />
          <Pressable testID="weight-save" onPress={() => void save()} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled, busy: saving }} style={({ pressed }) => (pressed || disabled) && styles.dimmed}>
            <LinearGradient colors={Berkk.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.35 }} style={styles.save}>
              <Text style={styles.saveText}>{saving ? 'Speichert …' : 'Speichern'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </DetailDragHeader>
      <View style={[styles.intro, short && styles.shortIntro]}>
        <Text accessibilityRole="header" style={[styles.title, landscape && styles.shortTitle]}>Körpergewicht</Text>
        <Text style={styles.subtitle}>Für heute</Text>
      </View>
      {typing ? (
        <ScrollView style={styles.typingBody} contentContainerStyle={styles.typingContent} keyboardShouldPersistTaps="handled">
          <View style={styles.inputRow}>
            <TextInput
              testID="weight-input"
              accessibilityLabel="Körpergewicht in Kilogramm"
              accessibilityHint="Komma oder Punkt, eine Nachkommastelle"
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setSaveError(false);
                const parsed = parsePickerInput(text);
                if (parsed !== null) setTenths(parsed);
              }}
              autoFocus keyboardType="decimal-pad" inputMode="decimal" returnKeyType="done"
              onSubmitEditing={showWheels} selectTextOnFocus autoCorrect={false} editable={!saving}
              style={styles.input}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          <Pressable onPress={showWheels} disabled={draft === null || saving} accessibilityRole="button" style={styles.returnButton}>
            <Text style={[styles.returnText, (draft === null || saving) && styles.dimmed]}>Zu den Zahlenrollen</Text>
          </Pressable>
          {draft === null && <Text accessibilityLiveRegion="polite" style={styles.error}>Gib 0,1 bis 999,9 kg mit einer Nachkommastelle ein.</Text>}
        </ScrollView>
      ) : (
        <View style={[styles.pickerSection, short && styles.shortPickerSection, landscape && styles.landscapePickerSection]}>
          <Text style={styles.unitLabel}>Kilogramm</Text>
          <View testID="weight-picker" style={[styles.picker, { height: wheelHeight }]}>
            <WeightWheel
              key={`kg-${rowHeight}`} value={Math.floor(tenths / 10)} max={999} rowHeight={rowHeight} visibleRows={3} viewportHeight={wheelHeight}
              label="Ganze Kilogramm" disabled={saving}
              onMoving={(next) => setMoving((old) => old.kg === next ? old : { ...old, kg: next })}
              onChange={(kg) => { setTenths((old) => kg * 10 + old % 10); setSaveError(false); }} onEdit={edit}
            />
            <WeightWheel
              key={`decimal-${rowHeight}`} value={tenths % 10} max={9} rowHeight={rowHeight} visibleRows={3} viewportHeight={wheelHeight}
              label="Zehntel Kilogramm" disabled={saving}
              onMoving={(next) => setMoving((old) => old.decimal === next ? old : { ...old, decimal: next })}
              onChange={(decimal) => { setTenths((old) => Math.floor(old / 10) * 10 + decimal); setSaveError(false); }} onEdit={edit}
            />
            <Text pointerEvents="none" style={styles.pickerUnit}>kg</Text>
            <LinearGradient pointerEvents="none" colors={['#30202D', 'rgba(48,32,45,0)']} style={[styles.fade, { top: 0, height: rowHeight * 0.16 }]} />
            <LinearGradient pointerEvents="none" colors={['rgba(48,32,45,0)', '#30202D']} style={[styles.fade, { bottom: 0, height: rowHeight * 0.16 }]} />
          </View>
          {draft === null && <Text accessibilityLiveRegion="polite" style={styles.error}>Wähle ein Gewicht über 0 kg.</Text>}
        </View>
      )}
      {saveError && <Text accessibilityLiveRegion="polite" style={[styles.error, styles.saveError]}>Speichern fehlgeschlagen. Bitte erneut versuchen.</Text>}
      <ScrollView testID="weight-history-scroll" style={styles.history} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: short ? 20 : 36, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <WeightChart entries={entries} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CloseButton({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) {
  return <Pressable testID="weight-close" onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel="Schließen und Änderungen verwerfen" style={({ pressed }) => [styles.close, (pressed || disabled) && styles.dimmed]}>
    <Svg width={27} height={27} viewBox="0 0 28 28" fill="none"><Path d="M14 4v19m-8-8 8 8 8-8" stroke={Berkk.ink} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" /></Svg>
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#19151F' },
  toolbar: { height: 88, paddingTop: 24, paddingBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shortToolbar: { height: 72, paddingTop: 16, paddingBottom: 8 },
  handle: { position: 'absolute', top: 8, width: 48, height: 4, borderRadius: 2, backgroundColor: Berkk.inkFaint, alignSelf: 'center', left: '50%', marginLeft: -24 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  save: { minHeight: 44, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, justifyContent: 'center', overflow: 'hidden' },
  saveText: { fontFamily: BerkkFonts.semibold, fontSize: 15, color: Berkk.ctaInk },
  intro: { paddingHorizontal: 24, paddingTop: 8 },
  shortIntro: { paddingTop: 0 },
  title: { fontFamily: BerkkFonts.semibold, fontSize: 34, lineHeight: 42, letterSpacing: -1, color: Berkk.ink },
  shortTitle: { fontSize: 27, lineHeight: 32 },
  subtitle: { fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 16, lineHeight: 24, marginTop: 6 },
  pickerSection: { marginTop: 48, flexShrink: 0 },
  shortPickerSection: { marginTop: 24 },
  landscapePickerSection: { marginTop: 8 },
  unitLabel: { fontFamily: BerkkFonts.medium, color: Berkk.inkSecondary, fontSize: 16, lineHeight: 22, marginHorizontal: 24, marginBottom: 14 },
  picker: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Berkk.divider },
  pickerUnit: { fontFamily: BerkkFonts.regular, fontSize: 19, color: Berkk.inkMuted, marginRight: 8, marginLeft: 6 },
  fade: { position: 'absolute', left: 0, right: 0 },
  typingBody: { flexGrow: 0, flexShrink: 1, marginTop: 20 },
  typingContent: { paddingHorizontal: 24, paddingBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: Berkk.divider },
  input: { flex: 1, minWidth: 0, minHeight: 80, paddingVertical: 8, fontFamily: BerkkFonts.black, fontSize: 56, color: Berkk.ink, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: BerkkFonts.regular, fontSize: 22, color: Berkk.inkSecondary },
  returnButton: { minHeight: 44, justifyContent: 'center' },
  returnText: { fontFamily: BerkkFonts.medium, fontSize: 14, color: Berkk.inkSecondary },
  error: { fontFamily: BerkkFonts.regular, fontSize: 14, lineHeight: 20, color: '#FFB49B' },
  saveError: { marginHorizontal: 24, marginTop: 12 },
  history: { flex: 1, minHeight: 0 },
  dimmed: { opacity: 0.45 },
  retry: { minHeight: 48, justifyContent: 'center' },
  retryText: { fontFamily: BerkkFonts.medium, color: Berkk.ink, fontSize: 16 },
});
