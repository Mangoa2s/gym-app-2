import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localDay } from '@/data/calendar';

export function useLocalDay() {
  const [today, setToday] = useState(() => localDay());
  useEffect(() => {
    const refresh = () => setToday(localDay());
    const timer = setInterval(refresh, 30000);
    const listener = AppState.addEventListener('change', refresh);
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  return today;
}
