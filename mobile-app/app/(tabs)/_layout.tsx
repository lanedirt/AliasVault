import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import emitter from '@/utils/EventEmitter';
import { ThemedText } from '@/components/ThemedText';

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
      screenListeners={{
        tabPress: (e) => {
          const targetPathname = (e.target as string).split('-')[0];
          console.log('Tab pressed in layout, navigating to:', targetPathname);
          emitter.emit('tabPress', targetPathname);
        },
      }}
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
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
        name="(emails)"
        options={{
          title: 'Emails',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="envelope.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <IconSymbol size={28} name="gear" color={color} />
              {Platform.OS === 'ios' && authContext.shouldShowIosAutofillReminder && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    width: 16,
                    height: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <ThemedText
                    style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: '600',
                      textAlign: 'center',
                      lineHeight: 16,
                    }}
                  >
                    1
                  </ThemedText>
                </View>
              )}
            </View>
          )
        }}
      />
    </Tabs>
  );
}