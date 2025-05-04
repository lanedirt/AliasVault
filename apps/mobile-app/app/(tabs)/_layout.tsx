import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColors } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import emitter from '@/utils/EventEmitter';
import { ThemedText } from '@/components/ThemedText';

/**
 * This is the main layout for the app. It is used to navigate between the tabs.
 */
export default function TabLayout() : React.ReactNode {
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
      return () : void => clearTimeout(timer);
    }
  }, [requireLoginOrUnlock]);

  if (!isFullyInitialized || requireLoginOrUnlock) {
    return null;
  }

  const styles = StyleSheet.create({
    iconContainer: {
      position: 'relative',
    },
    iconNotificationContainer: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      height: 16,
      justifyContent: 'center',
      position: 'absolute',
      right: -4,
      top: -4,
      width: 16,
    },
    iconNotificationText: {
      color: colors.primarySurfaceText,
      fontSize: 10,
      fontWeight: '600',
      lineHeight: 16,
      textAlign: 'center',
    },
  });

  return (
    <Tabs
      screenListeners={{
        /**
         * Listener for the tab press event.
         * @param {Object} e - The event object.
         * @param {string} e.target - The target pathname.
         */
        tabPress: (e) => {
          const targetPathname = (e.target as string).split('-')[0];
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
            // backgroundColor: colors.tabBarBackground,
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="credentials"
        options={{
          title: 'Credentials',
          /**
           * Icon for the credentials tab.
           */
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="key.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="emails"
        options={{
          title: 'Emails',
          /**
           * Icon for the emails tab.
           */
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="envelope.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          /**
           * Icon for the settings tab.
           */
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <IconSymbol size={28} name="gear" color={color} />
              {Platform.OS === 'ios' && authContext.shouldShowIosAutofillReminder && (
                <View style={styles.iconNotificationContainer}>
                  <ThemedText style={styles.iconNotificationText}>1</ThemedText>
                </View>
              )}
            </View>
          )
        }}
      />
    </Tabs>
  );
}