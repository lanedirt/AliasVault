import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Credential } from '@/utils/types/Credential';
import FormInputCopyToClipboard from '@/components/FormInputCopyToClipboard';

interface AliasDetailsProps {
  credential: Credential;
}

export const AliasDetails: React.FC<AliasDetailsProps> = ({ credential }) => {
  const hasName = Boolean(credential.Alias?.FirstName?.trim() || credential.Alias?.LastName?.trim());
  const fullName = [credential.Alias?.FirstName, credential.Alias?.LastName].filter(Boolean).join(' ');

  const hasValidBirthDate = credential.Alias?.BirthDate ? (() => {
    const date = new Date(credential.Alias.BirthDate);
    return !isNaN(date.getTime()) &&
      date.getFullYear() > 1 &&
      date.getFullYear() < 9999;
  })() : false;

  if (!hasName && !credential.Alias?.NickName && !hasValidBirthDate) {
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
      {hasValidBirthDate && (
        <FormInputCopyToClipboard
          label="Birth Date"
          value={credential.Alias.BirthDate.split('T')[0]}
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