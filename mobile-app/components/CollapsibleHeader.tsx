import React from 'react';
import { StyleSheet, Platform, Animated, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColorScheme';
import { ThemedText } from './ThemedText';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface HeaderButton {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  position: 'left' | 'right';
}

interface CollapsibleHeaderProps {
  title: string;
  scrollY: Animated.Value;
  showNavigationHeader?: boolean;
  alwaysVisible?: boolean;
  headerButtons?: HeaderButton[];
}

export function CollapsibleHeader({
  title,
  scrollY,
  showNavigationHeader = false,
  alwaysVisible = false,
  headerButtons = []
}: CollapsibleHeaderProps) {
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
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: Platform.OS === 'ios' ? 100 : 64,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingBottom: Platform.OS === 'ios' ? 12 : 16,
      zIndex: 100,
      paddingTop: Platform.OS === 'ios' ? 60 : 0,
    },
    floatingTitle: {
      fontSize: Platform.OS === 'ios' ? 20 : 17,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 50,
      marginTop: 5,
    },
    headerButton: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 6 : 16,
      color: colors.primary,
      padding: 4,
    },
    leftButton: {
      left: 16,
    },
    rightButton: {
      right: 16,
    },
    headerBorder: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.accentBorder,
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
        <Animated.View style={{ flex: 1, opacity: alwaysVisible ? titleOpacity : headerOpacity }}>
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