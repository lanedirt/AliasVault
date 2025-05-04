import React from 'react';
import { StyleSheet, Platform, Animated, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';

type HeaderButton = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  position: 'left' | 'right';
}

type CollapsibleHeaderProps = {
  title: string;
  scrollY: Animated.Value;
  showNavigationHeader?: boolean;
  alwaysVisible?: boolean;
  headerButtons?: HeaderButton[];
}

/**
 * Collapsible header component.
 */
export function CollapsibleHeader({
  title,
  scrollY,
  showNavigationHeader = false,
  alwaysVisible = false,
  headerButtons = []
}: CollapsibleHeaderProps) : React.ReactNode {
  const colors = useColors();

  // Calculate header opacity based on scroll position and transform
  const headerOpacity = scrollY.interpolate({
    inputRange: [10, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [10, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTransform = alwaysVisible ? 0 : headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  // Interpolate the header background color and border
  const headerBackground = headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.accentBackground],
  });

  const styles = StyleSheet.create({
    floatingHeader: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      height: Platform.OS === 'ios' ? 100 : 64,
      justifyContent: 'center',
      left: 0,
      paddingBottom: Platform.OS === 'ios' ? 12 : 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 100,
    },
    floatingTitle: {
      color: colors.text,
      flex: 1,
      fontSize: Platform.OS === 'ios' ? 20 : 17,
      fontWeight: '600',
      marginHorizontal: 50,
      marginTop: 5,
      textAlign: 'center',
    },
    floatingTitleContainer: {
      flex: 1,
    },
    headerBorder: {
      backgroundColor: colors.accentBorder,
      bottom: 0,
      height: 1,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    headerButton: {
      bottom: Platform.OS === 'ios' ? 6 : 16,
      color: colors.primary,
      padding: 4,
      position: 'absolute',
    },
    leftButton: {
      left: 16,
    },
    rightButton: {
      right: 16,
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
            backgroundColor: headerBackground,
            transform: [{
              translateY: headerTransform
            }]
          }
        ]}
      >
        <Animated.View style={[
          styles.floatingTitleContainer,
          { opacity: alwaysVisible ? titleOpacity : headerOpacity },
        ]}>
          <ThemedText style={styles.floatingTitle}>{title}</ThemedText>
        </Animated.View>

        {headerButtons.map((button, index) => (
          <TouchableOpacity
            key={`${button.icon}-${index}`}
            style={[
              styles.headerButton,
              button.position === 'left' ? styles.leftButton : styles.rightButton
            ]}
            onPress={button.onPress}
          >
            <MaterialIcons name={button.icon} size={28} color={colors.primary} />
          </TouchableOpacity>
        ))}

        <Animated.View
          style={[
            styles.headerBorder,
            {
              opacity: headerOpacity
            }
          ]}
        />
      </Animated.View>
    </>
  );
}