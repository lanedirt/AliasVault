import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';

export const PulseDot: React.FC = () => {
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

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const styles = StyleSheet.create({
    refreshDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22c55e', // green-500
    },
  });

  return <Animated.View style={[styles.refreshDot, { opacity: pulseAnim }]} />;
};