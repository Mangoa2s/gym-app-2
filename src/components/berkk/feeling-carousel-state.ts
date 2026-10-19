import { DiaryMotion as M } from '../../constants/diary-motion.ts';

export const FEELING_ORDER = ['weak', 'normal', 'strong'] as const;

export function previewIndex(position: number) {
  'worklet';
  return Math.max(0, Math.min(2, Math.round(position)));
}

export function resistedPosition(position: number) {
  'worklet';
  if (position < 0) return Math.max(-M.edgeResistance, position * M.edgeResistance);
  if (position > 2) return Math.min(2 + M.edgeResistance, 2 + (position - 2) * M.edgeResistance);
  return position;
}

export function snapIndex(position: number, velocityX: number, step: number) {
  'worklet';
  return previewIndex(position - velocityX / Math.max(1, step) * M.velocityProjectionSeconds);
}
