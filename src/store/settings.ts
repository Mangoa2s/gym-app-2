import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSettingsStore } from './settings-state';

export const settingsStore = createSettingsStore(AsyncStorage);
void settingsStore.getState().hydrate();
