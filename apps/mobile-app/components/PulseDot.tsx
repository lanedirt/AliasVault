import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';

import { useColors } from '@/hooks/useColorScheme';

/**
 * Pulsing dot component.
 */
export const PulseDot: React.FC = () => {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return (): void => {
      pulseAnimation.stop();
    };
  }, [pulseAnim, colors]);

  const styles = StyleSheet.create({
    refreshDot: {
      backgroundColor: colors.greenBackground,
      borderRadius: 4,
      height: 8,
      width: 8,
    },
  });

  return <Animated.View style={[styles.refreshDot, { opacity: pulseAnim }]} />;
};