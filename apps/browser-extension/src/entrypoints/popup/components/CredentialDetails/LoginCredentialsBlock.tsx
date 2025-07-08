import React from 'react';
import { useTranslation } from 'react-i18next';

import { FormInputCopyToClipboard } from '@/entrypoints/popup/components/FormInputCopyToClipboard';

import type { Credential } from '@/utils/dist/shared/models/vault';

type LoginCredentialsBlockProps = {
  credential: Credential;
}

/**
 * Render the login credentials block.
 */
const LoginCredentialsBlock: React.FC<LoginCredentialsBlockProps> = ({ credential }) => {
  const { t } = useTranslation('common');
  const email = credential.Alias?.Email?.trim();
  const username = credential.Username?.trim();
  const password = credential.Password?.trim();

  if (!email && !username && !password) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('loginCredentials')}</h2>
      {email && (
        <FormInputCopyToClipboard
          id="email"
          label={t('email')}
          value={email}
        />
      )}
      {username && (
        <FormInputCopyToClipboard
          id="username"
          label={t('username')}
          value={username}
        />
      )}
      {password && (
        <FormInputCopyToClipboard
          id="password"
          label={t('password')}
          value={password}
          type="password"
        />
      )}
    </div>
  );
};

export default LoginCredentialsBlock;