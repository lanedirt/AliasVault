import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';

export default function TabLayout() {
  const colors = useColors();
  const authContext = useAuth();
  const dbContext = useDb();

  // Check if user is authenticated and database is available
  const isFullyInitialized = authContext.isInitialized && dbContext.dbInitialized;
  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;
  const requireLoginOrUnlock = isFullyInitialized && (!isAuthenticated || !isDatabaseAvailable);

  useEffect(() => {
    if (requireLoginOrUnlock) {
      // Use setTimeout to ensure navigation happens after the component is mounted
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [requireLoginOrUnlock]);

  if (!isFullyInitialized || requireLoginOrUnlock) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            //backgroundColor: colors.tabBarBackground,
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="(credentials)"
        options={{
          title: 'Credentials',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="key.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="emails"
        options={{
          title: 'Emails',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="envelope.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Simple icon component since we don't have access to the actual icon library
const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color }} />
);
