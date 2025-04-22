import React from 'react';
import { StyleSheet, Platform, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { useColors } from '@/hooks/useColorScheme';
import { ThemedText } from './ThemedText';

interface CollapsibleHeaderProps {
  title: string;
  scrollY: Animated.Value;
  showNavigationHeader?: boolean;
}

export function CollapsibleHeader({ title, scrollY, showNavigationHeader = false }: CollapsibleHeaderProps) {
  const colors = useColors();

  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [10, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const styles = StyleSheet.create({
    floatingHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: Platform.OS === 'ios' ? 96 : 64,
      backgroundColor: colors.accentBackground,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.accentBorder,
      zIndex: 100,
    },
    floatingTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
  });

  return (
    <>
      {showNavigationHeader ? (
        <Stack.Screen options={{
          title: title,
          headerShown: false,
        }} />
      ) : null}

      <Animated.View
        style={[
          styles.floatingHeader,
          {
            opacity: headerOpacity,
            transform: [{
              translateY: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              })
            }]
          }
        ]}
      >
        <ThemedText style={styles.floatingTitle}>{title}</ThemedText>
      </Animated.View>
    </>
  );
}