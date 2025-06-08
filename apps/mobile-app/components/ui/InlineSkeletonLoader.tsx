import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle, DimensionValue } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

type InlineSkeletonLoaderProps = {
  /** Width of the skeleton loader */
  width?: DimensionValue;
  /** Height of the skeleton loader */
  height?: number;
  /** Additional styles to apply to the skeleton loader */
  style?: ViewStyle;
}

/**
 * A small, inline skeleton loader component for loading states in text or small UI elements.
 * @param props - The component props
 * @returns A React node containing the inline skeleton loader
 */
export const InlineSkeletonLoader = ({
  width = 80,
  height = 16,
  style,
}: InlineSkeletonLoaderProps): React.ReactNode => {
  const colors = useColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50],
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.skeleton,
      borderRadius: 4,
      height,
      overflow: 'hidden',
      width,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.skeleton, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};