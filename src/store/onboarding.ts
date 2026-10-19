import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "zustand";
import { createOnboardingStore } from "./onboarding-state";

export const onboardingStore = createOnboardingStore(AsyncStorage);
void onboardingStore.getState().hydrate();
export const useOnboarding = () => useStore(onboardingStore);
