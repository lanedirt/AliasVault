import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import Toast from 'react-native-toast-message';

import { useColors } from '@/hooks/useColorScheme';

import { useAuth } from '@/context/AuthContext';
import { useClipboardCountdown } from '@/context/ClipboardCountdownContext';
import NativeVaultManager from '@/specs/NativeVaultManager';

type FormInputCopyToClipboardProps = {
  label: string;
  value: string | undefined;
  type?: 'text' | 'password';
}

/**
 * Form input copy to clipboard component.
 */
const FormInputCopyToClipboard: React.FC<FormInputCopyToClipboardProps> = ({
  label,
  value,
  type = 'text',
}) : React.ReactNode => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const colors = useColors();
  const { t } = useTranslation();
  const { getClipboardClearTimeout } = useAuth();
  const { activeFieldId, setActiveField } = useClipboardCountdown();
  
  const animatedWidth = useRef(new Animated.Value(0)).current;
  // Create a stable unique ID based on label and value
  const fieldId = useRef(`${label}-${value}-${Math.random().toString(36).substring(2, 11)}`).current;
  const isCountingDown = activeFieldId === fieldId;

  useEffect(() => {
    return (): void => {
      // Cleanup on unmount
      animatedWidth.stopAnimation();
    };
  }, [animatedWidth]);

  useEffect(() => {
    /* Handle animation based on whether this field is active */
    if (isCountingDown) {
      // This field is now active - reset and start animation
      animatedWidth.stopAnimation();
      animatedWidth.setValue(100);
      
      // Get timeout and start animation
      getClipboardClearTimeout().then((timeoutSeconds) => {
        if (timeoutSeconds > 0 && activeFieldId === fieldId) {
          Animated.timing(animatedWidth, {
            toValue: 0,
            duration: timeoutSeconds * 1000,
            useNativeDriver: false,
            easing: Easing.linear,
          }).start((finished) => {
            if (finished && activeFieldId === fieldId) {
              setActiveField(null);
            }
          });
        }
      });
    } else {
      // This field is not active - stop animation and reset
      animatedWidth.stopAnimation();
      animatedWidth.setValue(0);
    }
  }, [isCountingDown, activeFieldId, fieldId, animatedWidth, setActiveField, getClipboardClearTimeout]);

  /**
   * Copy the value to the clipboard.
   */
  const copyToClipboard = async () : Promise<void> => {
    if (value) {
      try {
        // Copy to clipboard using expo-clipboard
        await Clipboard.setStringAsync(value);

        // Get clipboard clear timeout from settings
        const timeoutSeconds = await getClipboardClearTimeout();

        // Schedule clipboard clear if timeout is set
        if (timeoutSeconds > 0) {
          // Clear any existing active field first (this will cancel its animation)
          setActiveField(null);
          
          // Schedule the clipboard clear
          await NativeVaultManager.clearClipboardAfterDelay(timeoutSeconds);
          
          /*
           * Now set this field as active - animation will be handled by the effect
           * Use setTimeout to ensure state update happens in next tick
           */
          setTimeout(() => {
            setActiveField(fieldId);
          }, 0);
        }

        if (Platform.OS !== 'android') {
          // Only show toast on iOS, Android already shows a native toast on clipboard interactions.
          Toast.show({
            type: 'success',
            text1: t('common.copied'),
            position: 'bottom',
            visibilityTime: 2000,
          });
        }
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          position: 'bottom',
          visibilityTime: 2000,
        });
      }
    }
  };

  const displayValue = type === 'password' && !isPasswordVisible
    ? '••••••••'
    : value;

  const styles = StyleSheet.create({
    actions: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    animatedOverlay: {
      backgroundColor: `${colors.primary}50`,
      borderRadius: 8,
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
    },
    iconButton: {
      padding: 8,
    },
    inputContainer: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      marginBottom: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    inputContent: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 12,
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },
    value: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity
      onPress={copyToClipboard}
      style={styles.inputContainer}
    >
      {isCountingDown && (
        <Animated.View
          style={[
            styles.animatedOverlay,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      )}
      <View style={styles.inputContent}>
        <View>
          <Text style={styles.label}>
            {label}
          </Text>
          <Text style={styles.value}>
            {displayValue}
          </Text>
        </View>
        <View style={styles.actions}>
          {type === 'password' && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.iconButton}
            >
              <MaterialIcons
                name={isPasswordVisible ? "visibility-off" : "visibility"}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FormInputCopyToClipboard;