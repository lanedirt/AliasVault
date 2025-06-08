import React from 'react';

import { FormInputCopyToClipboard } from '@/entrypoints/popup/components/FormInputCopyToClipboard';

import { Credential } from '@/utils/types/Credential';

type LoginCredentialsBlockProps = {
  credential: Credential;
}

/**
 * Render the login credentials block.
 */
const LoginCredentialsBlock: React.FC<LoginCredentialsBlockProps> = ({ credential }) => {
  const email = credential.Alias?.Email?.trim();
  const username = credential.Username?.trim();
  const password = credential.Password?.trim();

  if (!email && !username && !password) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Login credentials</h2>
      {email && (
        <FormInputCopyToClipboard
          id="email"
          label="Email"
          value={email}
        />
      )}
      {username && (
        <FormInputCopyToClipboard
          id="username"
          label="Username"
          value={username}
        />
      )}
      {password && (
        <FormInputCopyToClipboard
          id="password"
          label="Password"
          value={password}
          type="password"
        />
      )}
    </div>
  );
};

export default LoginCredentialsBlock;