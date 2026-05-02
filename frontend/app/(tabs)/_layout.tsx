import { Tabs } from 'expo-router';
import { useMemo } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const activeTabBackground = scheme === 'light' ? '#111827' : `${colors.tint}2B`;
  const activeTabColor = scheme === 'light' ? '#FFFFFF' : colors.tabIconSelected;

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.card ?? colors.background,
        borderTopColor: colors.cardBorder ?? 'transparent',
        borderTopWidth: 1,
        height: 76,
        paddingTop: 8,
        paddingBottom: 12,
      },
      tabBarActiveTintColor: activeTabColor,
      tabBarInactiveTintColor: colors.tabIconDefault,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.4,
      },
      tabBarItemStyle: {
        borderRadius: 14,
        marginHorizontal: 4,
      },
      tabBarActiveBackgroundColor: activeTabBackground,
    }),
    [activeTabBackground, activeTabColor, colors]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: 'KWEST' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

