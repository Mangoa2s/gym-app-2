import { Tabs } from 'expo-router/js-tabs';

import { BottomTabBar } from '@/components/berkk/bottom-tab-bar';

export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="coach" />
    </Tabs>
  );
}
