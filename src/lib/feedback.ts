/**
 * The ONLY place that talks to expo-haptics. Components call feedback.*, never
 * the library. Every call checks the saved preference first and fails silently
 * (web, simulators and devices without a haptic engine simply do nothing).
 */
import * as Haptics from 'expo-haptics';

import { settingsStore } from '@/store/settings';

function run(effect: () => Promise<void>) {
  if (!settingsStore.getState().hapticsEnabled) return;
  try { void effect().catch(() => undefined); } catch { /* Silent by design. */ }
}

export const feedback = {
  /** Lightest tick: choosing a chip, a set, a stepper step. */
  select: () => run(() => Haptics.selectionAsync()),
  /** A confirmed, better-than-last-time set or a finished action. */
  confirm: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** The one big moment: a new personal record. */
  peak: () => run(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 90));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }),
  /** Invalid input or a failed save. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
