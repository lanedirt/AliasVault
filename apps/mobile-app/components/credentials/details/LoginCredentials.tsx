import type { Credential } from '@/utils/dist/shared/models/vault';
import { useTranslation } from 'react-i18next';

import FormInputCopyToClipboard from '@/components/form/FormInputCopyToClipboard';
import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';

type LoginCredentialsProps = {
  credential: Credential;
};

/**
 * Login credentials component.
 */
export const LoginCredentials: React.FC<LoginCredentialsProps> = ({ credential }) : React.ReactNode => {
  const { t } = useTranslation();
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
      <ThemedText type="subtitle">{t('credentials.loginCredentials')}</ThemedText>
      {email && (
        <FormInputCopyToClipboard
          label={t('credentials.email')}
          value={email}
        />
      )}
      {username && (
        <FormInputCopyToClipboard
          label={t('credentials.username')}
          value={username}
        />
      )}
      {password && (
        <FormInputCopyToClipboard
          label={t('credentials.password')}
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