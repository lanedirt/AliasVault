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

  if (!hasName && !credential.Alias?.NickName && !credential.Alias?.BirthDate) {
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
      {credential.Alias?.BirthDate && !isNaN(credential.Alias.BirthDate.getTime()) && credential.Alias.BirthDate.getTime() !== new Date(0).getTime() && (
        <FormInputCopyToClipboard
          label="Birth Date"
          value={credential.Alias.BirthDate.toISOString().split('T')[0]}
        />
      )}
    </ThemedView>
  );
};

const styles = {
  section: {
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
};