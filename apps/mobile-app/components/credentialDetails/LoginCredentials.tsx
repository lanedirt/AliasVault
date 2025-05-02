import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Credential } from '@/utils/types/Credential';
import FormInputCopyToClipboard from '@/components/FormInputCopyToClipboard';

interface LoginCredentialsProps {
  credential: Credential;
}

export const LoginCredentials: React.FC<LoginCredentialsProps> = ({ credential }) => {
  const email = credential.Alias?.Email?.trim();
  const username = credential.Username?.trim();
  const password = credential.Password?.trim();

  const hasLoginCredentials = email || username || password;

  if (!hasLoginCredentials) {
    return null;
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Login credentials</ThemedText>
      {email && (
        <FormInputCopyToClipboard
          label="Email"
          value={email}
        />
      )}
      {username && (
        <FormInputCopyToClipboard
          label="Username"
          value={username}
        />
      )}
      {password && (
        <FormInputCopyToClipboard
          label="Password"
          value={password}
          type="password"
        />
      )}
    </ThemedView>
  );
};

const styles = {
  section: {
    padding: 16,
    paddingBottom: 0,
    gap: 8,
  },
};