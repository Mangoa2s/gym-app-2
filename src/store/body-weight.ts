import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from 'zustand';

import { createBodyWeightStore } from './body-weight-state';

const bodyWeightStore = createBodyWeightStore(AsyncStorage);
void bodyWeightStore.getState().hydrate();

export function useBodyWeight() {
  return useStore(bodyWeightStore);
}
