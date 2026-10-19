import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWorkoutMotion } from './workout-motion-provider';
import { BerkkGhost } from './berkk-ghost';
import type { GhostPulse, GhostReaction } from './ghost-state';
import { DiaryMotion as M } from '@/constants/diary-motion';
import { GhostMotion } from '@/constants/ghost-motion';
import { Berkk, BerkkFonts } from '@/constants/theme';

export type SaveFeedback = { message?: string; detail?: string; reaction?: GhostReaction };
type Shown = { message: string; detail?: string; pulse: GhostPulse };

const SaveFeedbackContext = createContext<((feedback?: string | SaveFeedback) => void) | null>(null);
/** Survives the recorder's immediate unmount after an actual successful write. */
export function WorkoutSaveFeedbackProvider({ children }: { children: ReactNode }) {
  const { reduced } = useWorkoutMotion();
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<Shown | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseId = useRef(0);
  const notifySaved = useCallback((feedback: string | SaveFeedback = {}) => {
    const { message = 'Training gespeichert', detail, reaction = 'success' } = typeof feedback === 'string' ? { message: feedback } : feedback;
    if (timer.current) clearTimeout(timer.current);
    setShown({ message, detail, pulse: { reaction, id: ++pulseId.current } });
    AccessibilityInfo.announceForAccessibility(detail ? `${message}. ${detail}` : message);
    // A streak line gets a little longer so it can actually be read.
    timer.current = setTimeout(() => { setShown(null); timer.current = null; }, M.savedVisibleMs + (detail ? GhostMotion.toastDetailExtraMs : 0));
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <SaveFeedbackContext.Provider value={notifySaved}>{children}
    <View pointerEvents="none" style={[styles.overlay, { top: insets.top + 12 }]}>
      {shown && <Animated.View testID="workout-saved-feedback" entering={reduced ? undefined : FadeIn.duration(M.savedFadeMs)} exiting={reduced ? undefined : FadeOut.duration(M.savedFadeMs)} style={styles.toast}>
        <BerkkGhost size={30} mood="calm" pulse={shown.pulse} glow={shown.pulse.reaction === 'streak'} />
        <View style={styles.copy}>
          <Text style={styles.text}>{shown.message}</Text>
          {shown.detail && <Text testID="workout-saved-streak" style={styles.detail}>{shown.detail}</Text>}
        </View>
      </Animated.View>}
    </View>
  </SaveFeedbackContext.Provider>;
}
export function useWorkoutSaveFeedback() {
  const notify = useContext(SaveFeedbackContext);
  if (!notify) throw new Error('WorkoutSaveFeedbackProvider missing');
  return notify;
}
const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { maxWidth: 440, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingVertical: 11, paddingLeft: 14, paddingRight: 18, backgroundColor: Berkk.detailGradient[2], borderWidth: 1, borderColor: Berkk.glassBorder },
  copy: { flexShrink: 1 },
  text: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 14, lineHeight: 20 },
  detail: { color: Berkk.link, fontFamily: BerkkFonts.medium, fontSize: 12, lineHeight: 17, fontVariant: ['tabular-nums'] },
});
