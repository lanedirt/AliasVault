import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, useColorScheme, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Credential } from '@/utils/types/Credential';
import { TotpCode } from '@/utils/types/TotpCode';
import * as OTPAuth from 'otpauth';
import * as Clipboard from 'expo-clipboard';
import { useDb } from '@/context/DbContext';
import Toast from 'react-native-toast-message';

type TotpSectionProps = {
  credential: Credential;
};

export const TotpSection: React.FC<TotpSectionProps> = ({ credential }) => {
  const [totpCodes, setTotpCodes] = useState<TotpCode[]>([]);
  const [currentCodes, setCurrentCodes] = useState<Record<string, string>>({});
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const dbContext = useDb();

  const getRemainingSeconds = (step = 30): number => {
    const totp = new OTPAuth.TOTP({
      secret: 'dummy',
      algorithm: 'SHA1',
      digits: 6,
      period: step
    });
    return totp.period - (Math.floor(Date.now() / 1000) % totp.period);
  };

  const getRemainingPercentage = (): number => {
    const remaining = getRemainingSeconds();
    return Math.floor(((30.0 - remaining) / 30.0) * 100);
  };

  const generateTotpCode = (secretKey: string): string => {
    try {
      const totp = new OTPAuth.TOTP({
        secret: secretKey,
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      });
      return totp.generate();
    } catch (error) {
      console.error('Error generating TOTP code:', error);
      return 'Error';
    }
  };

  const copyToClipboard = async (code: string): Promise<void> => {
    try {
      await Clipboard.setStringAsync(code);
      Toast.show({
        type: 'success',
        text1: 'Copied to clipboard',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  useEffect(() => {
    const loadTotpCodes = async () => {
      if (!dbContext?.sqliteClient) {
        return;
      }

      try {
        const codes = await dbContext.sqliteClient.getTotpCodesForCredential(credential.Id);
        setTotpCodes(codes);
      } catch (error) {
        console.error('Error loading TOTP codes:', error);
      }
    };

    loadTotpCodes();
  }, [credential.Id, dbContext?.sqliteClient]);

  useEffect(() => {
    const updateTotpCodes = (prevCodes: Record<string, string>): Record<string, string> => {
      const newCodes: Record<string, string> = {};
      totpCodes.forEach(code => {
        const generatedCode = generateTotpCode(code.SecretKey);
        if (generatedCode !== 'Error') {
          newCodes[code.Id] = generatedCode;
        } else {
          newCodes[code.Id] = prevCodes[code.Id] ?? 'Error';
        }
      });
      return newCodes;
    };

    const initialCodes: Record<string, string> = {};
    totpCodes.forEach(code => {
      initialCodes[code.Id] = generateTotpCode(code.SecretKey);
    });
    setCurrentCodes(initialCodes);

    const intervalId = setInterval(() => {
      setCurrentCodes(updateTotpCodes);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [totpCodes]);

  if (totpCodes.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">
        Two-factor authentication
      </ThemedText>
      {totpCodes.map(totpCode => (
        <TouchableOpacity
          key={totpCode.Id}
          style={[
            styles.content,
            {
              backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
              borderColor: isDarkMode ? '#374151' : '#d1d5db',
            }
          ]}
          onPress={() => copyToClipboard(currentCodes[totpCode.Id])}
        >
          <View style={styles.codeContainer}>
            <View>
              <ThemedText style={[styles.label, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                TOTP Code
              </ThemedText>
              <ThemedText style={[styles.code, { color: isDarkMode ? '#f3f4f6' : '#1f2937' }]}>
                {currentCodes[totpCode.Id]}
              </ThemedText>
            </View>
            <View style={styles.timerContainer}>
              <ThemedText style={[styles.timer, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                {getRemainingSeconds()}s
              </ThemedText>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getRemainingPercentage()}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 16,
  },
  content: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  timerContainer: {
    alignItems: 'flex-end',
  },
  timer: {
    fontSize: 12,
    marginBottom: 4,
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
});