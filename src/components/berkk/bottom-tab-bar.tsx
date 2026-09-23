import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/berkk/glass-surface';
import { NavCalendarIcon, NavChatIcon, NavGridIcon, NavHistoryIcon } from '@/components/berkk/icons';
import { Berkk } from '@/constants/theme';

const NAV_ICONS: Record<string, (props: { size: number; color: string }) => React.ReactElement> = {
  index: NavGridIcon,
  plan: NavCalendarIcon,
  progress: NavHistoryIcon,
  coach: NavChatIcon,
};

/** Floating glass pill tab bar — "Übersicht / Kalender / Verlauf / Notizen". */
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute inset-x-[22px]" style={{ bottom: insets.bottom + 8 }} pointerEvents="box-none">
      <GlassSurface radius={30} style={{ height: 68 }} className="flex-row items-center justify-around px-3">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = NAV_ICONS[route.name] ?? NavGridIcon;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              hitSlop={10}
              className="items-center justify-center"
              style={{ width: 44, height: 44 }}>
              <Icon size={22} color={focused ? Berkk.ink : Berkk.inkSecondary} />
              {route.name === 'coach' && (
                <View
                  className="absolute rounded-full"
                  style={{ top: 11, right: 11, width: 6, height: 6, backgroundColor: Berkk.navBadge }}
                />
              )}
            </Pressable>
          );
        })}
      </GlassSurface>
    </View>
  );
}
