import { IdentityHelperUtils } from '@/utils/shared/identity-generator';
import type { Credential } from '@/utils/shared/models/vault';

import FormInputCopyToClipboard from '@/components/form/FormInputCopyToClipboard';
import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';

type AliasDetailsProps = {
  credential: Credential;
};

/**
 * Alias details component.
 */
export const AliasDetails: React.FC<AliasDetailsProps> = ({ credential }) : React.ReactNode => {
  const hasName = Boolean(credential.Alias?.FirstName?.trim() ?? credential.Alias?.LastName?.trim());
  const fullName = [credential.Alias?.FirstName, credential.Alias?.LastName].filter(Boolean).join(' ');

  if (!hasName && !credential.Alias?.NickName && !IdentityHelperUtils.isValidBirthDate(credential.Alias?.BirthDate)) {
    return null;
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">Alias</ThemedText>
      {hasName && (
        <FormInputCopyToClipboard
          label="Full Name"
          value={fullName}
        />
      )}
      {credential.Alias?.FirstName && (
        <FormInputCopyToClipboard
          label="First Name"
          value={credential.Alias.FirstName}
        />
      )}
      {credential.Alias?.LastName && (
        <FormInputCopyToClipboard
          label="Last Name"
          value={credential.Alias.LastName}
        />
      )}
      {credential.Alias?.NickName && (
        <FormInputCopyToClipboard
          label="Nickname"
          value={credential.Alias.NickName}
        />
      )}
      {IdentityHelperUtils.isValidBirthDate(credential.Alias?.BirthDate) && (
        <FormInputCopyToClipboard
          label="Birth Date"
          value={IdentityHelperUtils.normalizeBirthDateForDisplay(credential.Alias.BirthDate)}
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