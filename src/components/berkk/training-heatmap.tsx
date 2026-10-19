import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useStore } from 'zustand';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { completedDays, formatDay, monthDays, shiftMonth } from '@/data/calendar';
import { useLocalDay } from '@/hooks/use-local-day';
import { workoutStore } from '@/store/workout';

/** Three local calendar months from the same completed-day selector as the calendar. */
export function TrainingHeatmap() {
  const history = useStore(workoutStore, (state) => state.history);
  const today = useLocalDay();
  const completed = useMemo(() => completedDays(history), [history]);
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    {[-2, -1, 0].map((offset) => {
      const month = shiftMonth(today, offset);
      const days = monthDays(month);
      const count = days.filter((day) => day && completed.has(day)).length;
      return <View key={month} accessible accessibilityLabel={`${formatDay(month, { month: 'long', year: 'numeric' })}: ${count} Trainingstage`} style={{ width: 78 }}>
        <Text style={{ textAlign: 'center', fontFamily: BerkkFonts.medium, color: Berkk.inkSecondary, fontSize: 14 }}>{formatDay(month, { month: 'short' })}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 6 }}>
          {days.map((day, index) => <View key={day ?? index} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: !day ? 'transparent' : completed.has(day) ? Berkk.dotHot : Berkk.dotOff }} />)}
        </View>
      </View>;
    })}
  </View>;
}
