import React from 'react';

import { FormInputCopyToClipboard } from '@/entrypoints/popup/components/FormInputCopyToClipboard';

import { IdentityHelperUtils } from '@/utils/shared/identity-generator';
import type { Credential } from '@/utils/shared/models/vault';

type AliasBlockProps = {
  credential: Credential;
}

/**
 * Render the alias block.
 */
const AliasBlock: React.FC<AliasBlockProps> = ({ credential }) => {
  const hasFirstName = Boolean(credential.Alias?.FirstName?.trim());
  const hasLastName = Boolean(credential.Alias?.LastName?.trim());
  const hasNickName = Boolean(credential.Alias?.NickName?.trim());
  const hasBirthDate = IdentityHelperUtils.isValidBirthDate(credential.Alias?.BirthDate);

  if (!hasFirstName && !hasLastName && !hasNickName && !hasBirthDate) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Alias</h2>
      {(hasFirstName || hasLastName) && (
        <FormInputCopyToClipboard
          id="fullName"
          label="Full Name"
          value={[credential.Alias?.FirstName, credential.Alias?.LastName].filter(Boolean).join(' ')}
        />
      )}
      {hasFirstName && (
        <FormInputCopyToClipboard
          id="firstName"
          label="First Name"
          value={credential.Alias?.FirstName ?? ''}
        />
      )}
      {hasLastName && (
        <FormInputCopyToClipboard
          id="lastName"
          label="Last Name"
          value={credential.Alias?.LastName ?? ''}
        />
      )}
      {hasBirthDate && (
        <FormInputCopyToClipboard
          id="birthDate"
          label="Birth Date"
          value={IdentityHelperUtils.normalizeBirthDateForDisplay(credential.Alias?.BirthDate)}
        />
      )}
      {hasNickName && (
        <FormInputCopyToClipboard
          id="nickName"
          label="Nickname"
          value={credential.Alias?.NickName ?? ''}
        />
      )}
    </div>
  );
};

export default AliasBlock;