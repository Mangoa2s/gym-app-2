type Reading = { date: string; weight: number };

// UTC is only a timezone-independent coordinate for already-saved calendar days.
// It is never used to assign the date of a weight entry.
function dayCoordinate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

export function weightChartData(entries: Reading[], width: number, height: number) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return null;
  const weights = sorted.map((entry) => entry.weight);
  const low = Math.min(...weights);
  const high = Math.max(...weights);
  const padding = Math.max(0.5, (high - low) * 0.2);
  const min = Math.max(0, low - padding);
  const max = high + padding;
  const firstDay = dayCoordinate(sorted[0].date);
  const span = dayCoordinate(sorted[sorted.length - 1].date) - firstDay;
  const left = 44;
  const right = Math.max(left + 1, width - 8);
  const top = 12;
  const bottom = height - 20;
  const points = sorted.map((entry) => ({
    ...entry,
    x: span === 0 ? (left + right) / 2 : left + (dayCoordinate(entry.date) - firstDay) / span * (right - left),
    y: bottom - (entry.weight - min) / (max - min) * (bottom - top),
  }));
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const length = points.reduce((total, point, index) => index === 0 ? 0 : total + Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y), 0);
  return { points, path, length, left, right, ticks: [max, (max + min) / 2, min].map((weight) => ({ weight, y: bottom - (weight - min) / (max - min) * (bottom - top) })) };
}
