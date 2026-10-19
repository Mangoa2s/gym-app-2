import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { createWorkoutStore } from './workout-state';

export const workoutStore = createWorkoutStore(Date.now, AsyncStorage, randomUUID);
void workoutStore.getState().hydrate();
