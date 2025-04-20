import { StyleSheet, View, Text, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useColors } from '@/hooks/useColorScheme';

interface LoadingIndicatorProps {
  status: string;
}

export default function LoadingIndicator({ status }: LoadingIndicatorProps) {
  const colors = useColors();
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const dot4Anim = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState('');

  useEffect(() => {
    const createPulseAnimation = (anim: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]);
    };

    const animation = Animated.loop(
      Animated.parallel([
        createPulseAnimation(dot1Anim),
        Animated.sequence([
          Animated.delay(200),
          createPulseAnimation(dot2Anim),
        ]),
        Animated.sequence([
          Animated.delay(400),
          createPulseAnimation(dot3Anim),
        ]),
        Animated.sequence([
          Animated.delay(600),
          createPulseAnimation(dot4Anim),
        ]),
      ])
    );

    const dotsInterval = setInterval(() => {
      setDots(prevDots => {
        if (prevDots.length >= 3) return '';
        return prevDots + '.';
      });
    }, 400);

    animation.start();

    return () => {
      animation.stop();
      clearInterval(dotsInterval);
    };
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dotsContainer: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      borderRadius: 20,
      padding: 12,
      paddingHorizontal: 24,
      gap: 10,
      borderWidth: 5,
      borderColor: colors.tertiary,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.tertiary,
    },
    statusText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot3Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dot4Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.statusText}>{status}{dots}</Text>
    </View>
  );
}