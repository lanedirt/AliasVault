import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';
import { Credential } from '@/utils/types/Credential';
import FormInputCopyToClipboard from '@/components/form/FormInputCopyToClipboard';

type LoginCredentialsProps = {
  credential: Credential;
};

/**
 * Login credentials component.
 */
export const LoginCredentials: React.FC<LoginCredentialsProps> = ({ credential }) : React.ReactNode => {
  const email = credential.Alias?.Email?.trim();
  const username = credential.Username?.trim();
  const password = credential.Password?.trim();

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
    paddingTop: 16,
    gap: 8,
  },
};