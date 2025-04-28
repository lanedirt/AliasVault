import { StyleSheet, View, Text, TouchableOpacity, Keyboard } from 'react-native';
import { CredentialIcon } from './CredentialIcon';
import { useColors } from '@/hooks/useColorScheme';
import { Credential } from '@/utils/types/Credential';
import { router } from 'expo-router';

type CredentialCardProps = {
  credential: Credential;
};

export function CredentialCard({ credential }: CredentialCardProps) {
  const colors = useColors();

  /**
   * Get the display text for a credential, showing username by default,
   * falling back to email only if username is null/undefined/empty
   */
  const getCredentialDisplayText = (cred: Credential): string => {
    // Show username if available
    if (cred.Username) {
      return cred.Username;
    }

    // Show email if username is not available
    if (cred.Alias?.Email) {
      return cred.Alias.Email;
    }

    // Show empty string if neither username nor email is available
    return '';
  };

  const styles = StyleSheet.create({
    credentialCard: {
      backgroundColor: colors.accentBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.accentBorder,
    },
    credentialContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: 32,
      height: 32,
      borderRadius: 4,
      marginRight: 12,
    },
    credentialInfo: {
      flex: 1,
    },
    serviceName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    credentialText: {
      color: colors.textMuted,
      fontSize: 14,
    },
  });

  return (
    <TouchableOpacity
      style={styles.credentialCard}
      onPress={() => {
        Keyboard.dismiss();
        router.push(`/(tabs)/(credentials)/${credential.Id}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.credentialContent}>
        <CredentialIcon logo={credential.Logo} style={styles.logo} />
        <View style={styles.credentialInfo}>
          <Text style={[styles.serviceName]}>
            {credential.ServiceName ?? 'Unknown Service'}
          </Text>
          <Text style={[styles.credentialText]}>
            {getCredentialDisplayText(credential)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
