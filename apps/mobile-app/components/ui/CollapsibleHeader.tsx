import React from 'react';
import { StyleSheet, Platform, Animated, TouchableOpacity, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/themed/ThemedText';
import { useColors } from '@/hooks/useColorScheme';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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
}: CollapsibleHeaderProps): React.ReactNode {
  const colors = useColors();
  const colorScheme = useColorScheme();

  // Calculate header opacity and transforms based on scroll
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

  const headerTransform = alwaysVisible
    ? 0
    : headerOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [-20, 0],
    });

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
      overflow: 'hidden',
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
      {showNavigationHeader && (
        <Stack.Screen options={{ title, headerShown: false }} />
      )}

      <Animated.View
        style={[
          styles.floatingHeader,
          {
            transform: [{ translateY: headerTransform }],
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          colorScheme === 'dark' ? (
            <AnimatedBlurView
              tint="dark"
              intensity={80}
              style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
            />
          ) : (
            <AnimatedBlurView
              tint="light"
              intensity={100}
              style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}
            />
          )
        ) : (
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: headerBackground }]}
          />
        )}

        <Animated.View
          style={[
            styles.floatingTitleContainer,
            { opacity: alwaysVisible ? titleOpacity : headerOpacity },
          ]}
        >
          <ThemedText style={styles.floatingTitle}>{title}</ThemedText>
        </Animated.View>

        {headerButtons.map((button, idx) => (
          <TouchableOpacity
            key={`${button.icon}-${idx}`}
            style={[
              styles.headerButton,
              button.position === 'left' ? styles.leftButton : styles.rightButton,
            ]}
            onPress={button.onPress}
          >
            <MaterialIcons name={button.icon} size={28} color={colors.primary} />
          </TouchableOpacity>
        ))}

        <Animated.View
          style={[
            styles.headerBorder,
            { opacity: headerOpacity },
          ]}
        />
      </Animated.View>
    </>
  );
}
