import { CalendarAppearance as C } from '../constants/calendar-appearance.ts';
import { dayDate, monthDays } from './calendar.ts';

/** Grid cells hold no text, so font scaling only grows the month heading and weekday row. */
export function calendarMetrics(fontScale: number, compact = false) {
  const extra = Math.max(0, Math.min(fontScale, 1.4) - 1);
  return {
    cellHeight: compact ? C.compactCellHeight : C.cellHeight,
    headerHeight: Math.ceil((compact ? C.compactMonthHeaderHeight : C.monthHeaderHeight) + extra * 34),
    bottomSpace: C.monthBottomSpace,
  };
}
export type CalendarMetrics = ReturnType<typeof calendarMetrics>;
export type CalendarMonthLayout = { key: string; weeks: (string | null)[][]; length: number; offset: number; index: number };

/** Rows are explicit groups of seven, never dependent on flex-wrap or percentages. */
export function calendarMonthLayouts(keys: string[], metrics: CalendarMetrics): CalendarMonthLayout[] {
  const result: CalendarMonthLayout[] = [];
  let offset = 0;
  for (const key of keys) {
    const days = monthDays(key);
    const weeks: (string | null)[][] = [];
    for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));
    const length = metrics.headerHeight + weeks.length * metrics.cellHeight + metrics.bottomSpace;
    result.push({ key, weeks, length, offset, index: result.length });
    offset += length;
  }
  return result;
}

/**
 * Where to scroll so a day is in view: the top of its month when the day's week
 * already fits, otherwise just far enough that the week clears the visible bottom.
 */
export function dayScrollOffset(layouts: CalendarMonthLayout[], day: string, metrics: CalendarMetrics, viewport: number) {
  const month = layouts.find((item) => item.key.slice(0, 7) === day.slice(0, 7));
  if (!month) return null;
  const row = Math.max(0, month.weeks.findIndex((week) => week.includes(day)));
  const rowBottom = metrics.headerHeight + (row + 1) * metrics.cellHeight;
  const air = 12;
  return month.offset + Math.max(0, rowBottom + air - Math.max(viewport, metrics.cellHeight + air));
}

/** Keep 44pt-wide targets on narrow screens; header and grid share this inset. */
export const calendarInset = (width: number) => Math.min(24, Math.max(6, (width - 7 * 44) / 2));

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez'];

/**
 * German spoken day label without Intl. `toLocaleDateString` per cell was the
 * costliest work while new months mounted during scrolling on Hermes.
 */
export function spokenDay(key: string) {
  const date = dayDate(key);
  if (!date) return key;
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
