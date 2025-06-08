import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

type SkeletonLoaderProps = {
  /** Number of skeleton items to render */
  count?: number;
  /** Height of each skeleton item */
  height?: number;
  /** Number of parts (lines) in each skeleton item */
  parts?: number;
  /** Additional styles to apply to the skeleton item */
  style?: ViewStyle;
}

/**
 * A reusable skeleton loader component that displays animated loading placeholders.
 * @param props - The component props
 * @returns A React node containing the skeleton loader
 */
export const SkeletonLoader = ({
  count = 1,
  height = 60,
  parts = 2,
  style,
}: SkeletonLoaderProps): React.ReactNode => {
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
    outputRange: [-100, 100],
  });

  const skeletonStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.accentBackground,
      borderRadius: 12,
      height,
      marginBottom: 12,
      overflow: 'hidden',
    },
    content: {
      gap: 8,
      padding: 16,
    },
    part: {
      backgroundColor: colors.skeleton,
      borderRadius: 4,
      height: 12,
      width: `${100 / parts}%`,
    },
  });

  /**
   * Renders a single skeleton item with the specified number of parts
   * @returns A React node containing a single skeleton item
   */
  const renderSkeletonItem = (): React.ReactNode => (
    <View style={[skeletonStyles.card, style]}>
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
      <View style={skeletonStyles.content}>
        {Array.from({ length: parts }).map((_, index) => (
          <View key={index} style={skeletonStyles.part} />
        ))}
      </View>
    </View>
  );

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>{renderSkeletonItem()}</View>
      ))}
    </>
  );
};