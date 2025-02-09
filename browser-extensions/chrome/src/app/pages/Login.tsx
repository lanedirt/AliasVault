import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useWebApi } from '../context/WebApiContext';
import { Buffer } from 'buffer';
import Button from '../components/Button';
import EncryptionUtility from '../../shared/EncryptionUtility';
import SrpUtility from '../utils/SrpUtility';
import { useLoading } from '../context/LoadingContext';
import { VaultResponse } from '../../shared/types/webapi/VaultResponse';
import { LoginResponse } from '../../shared/types/webapi/Login';
import { AppInfo } from '../../shared/AppInfo';

/**
 * Login page
 */
const Login: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const { showLoading, hideLoading } = useLoading();
  const [rememberMe, setRememberMe] = useState(true);
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);
  const [passwordHashString, setPasswordHashString] = useState<string | null>(null);
  const [passwordHashBase64, setPasswordHashBase64] = useState<string | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [clientUrl, setClientUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webApi = useWebApi();
  const srpUtil = new SrpUtility(webApi);

  useEffect(() => {
    /**
     * Load the client URL from the storage.
     */
    const loadClientUrl = async () : Promise<void> => {
      const setting = await chrome.storage.local.get(['clientUrl']);
      setClientUrl(setting.clientUrl);
    };
    loadClientUrl();
  }, []);

  /**
   * Validates the vault response and returns an error message if validation fails
   */
  const validateVaultResponse = (vaultResponseJson: VaultResponse): string | null => {
    /**
     * Status 0 = OK, vault is ready.
     * Status 1 = Merge required, which only the web client supports.
     */
    if (vaultResponseJson.status !== 0) {
      return 'Your vault needs to be updated. Please login on the AliasVault website and follow the steps.';
    }

    if (!vaultResponseJson.vault?.blob) {
      return 'Your account does not have a vault yet. Please complete the tutorial in the AliasVault web client before using the browser extension.';
    }

    if (!AppInfo.isVaultVersionSupported(vaultResponseJson.vault.version)) {
      return 'Your vault is outdated. Please login via the web client to update your vault.';
    }

    return null;
  };

  /**
   * Handle submit
   */
  const handleSubmit = async (e: React.FormEvent) : Promise<void> => {
    e.preventDefault();
    setError(null);

    try {
      showLoading();

      // Use the srpUtil instance instead of the imported singleton
      const loginResponse = await srpUtil.initiateLogin(credentials.username);

      // 1. Derive key from password using Argon2id
      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        credentials.password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      // Convert uint8 array to uppercase hex string which is expected by the server.
      const passwordHashString = Buffer.from(passwordHash).toString('hex').toUpperCase();

      // Get the derived key as base64 string required for decryption.
      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');

      // 2. Validate login with SRP protocol
      const validationResponse = await srpUtil.validateLogin(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse
      );

      // 3. Handle 2FA if required
      if (validationResponse.requiresTwoFactor) {
        // Store login response as we need it for 2FA validation
        setLoginResponse(loginResponse);
        // Store password hash string as we need it for 2FA validation
        setPasswordHashString(passwordHashString);
        // Store password hash base64 as we need it for decryption
        setPasswordHashBase64(passwordHashBase64);
        setTwoFactorRequired(true);
        // Show app.
        hideLoading();
        return;
      }

      // Check if token was returned.
      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      // Try to get latest vault manually providing auth token.
      const vaultResponseJson = await webApi.fetch<VaultResponse>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      const vaultError = validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        setError(vaultError);
        hideLoading();
        return;
      }

      // All is good. Store auth info which makes the user logged in.
      await authContext.login(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);

      // Initialize the SQLite context with the new vault data.
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);

      // Show app.
      hideLoading();
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
      hideLoading();
    }
  };

  /**
   * Handle two factor submit.
   */
  const handleTwoFactorSubmit = async (e: React.FormEvent) : Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!passwordHashString || !passwordHashBase64) {
      throw new Error('Password hash not found');
    }

    try {
      showLoading();

      // TODO: Implement 2FA validation API call
      const validationResponse = await srpUtil.validateLogin2Fa(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse!,
        parseInt(twoFactorCode)
      );

      // Check if token was returned.
      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      // Try to get latest vault manually providing auth token.
      const vaultResponseJson = await webApi.fetch<VaultResponse>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      const vaultError = validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        setError(vaultError);
        hideLoading();
        return;
      }

      // All is good. Store auth info which makes the user logged in.
      await authContext.login(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);

      // Initialize the SQLite context with the new vault data.
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);

      // Reset 2FA state and login response as it's no longer needed
      setTwoFactorRequired(false);
      setTwoFactorCode('');
      setPasswordHashString(null);
      setPasswordHashBase64(null);
      setLoginResponse(null);
      hideLoading();
    } catch (err) {
      setError('Invalid authentication code. Please try again.');
      console.error('2FA error:', err);
      hideLoading();
    }
  };

  /**
   * Handle change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) : void => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (twoFactorRequired) {
    return (
      <div className="max-w-md">
        <form onSubmit={handleTwoFactorSubmit} className="bg-white dark:bg-gray-700 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {error && (
            <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-200 mb-4">
              Please enter the authentication code from your authenticator app.
            </p>
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="twoFactorCode">
              Authentication Code
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline"
              id="twoFactorCode"
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
            />
          </div>
          <div className="flex flex-col w-full space-y-2">
            <Button type="submit">
              Verify
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Reset the form.
                setCredentials({
                  username: '',
                  password: ''
                });
                setTwoFactorRequired(false);
                setTwoFactorCode('');
                setPasswordHashString(null);
                setPasswordHashBase64(null);
                setLoginResponse(null);
                setError(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Note: if you don&apos;t have access to your authenticator device, you can reset your 2FA with a recovery code by logging in via the website.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-700 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {error && (
          <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <h2 className="text-xl font-bold mb-4 dark:text-gray-200">Login to AliasVault</h2>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="username">
            Username or email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            name="username"
            placeholder="name / name@company.com"
            value={credentials.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-200">Remember me</span>
          </label>
        </div>
        <div className="flex w-full">
          <Button type="submit">
            Login
          </Button>
        </div>
      </form>
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        No account yet?{' '}
        <a
          href={clientUrl ?? ''}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-500"
        >
          Create new vault
        </a>
      </div>
    </div>
  );
};

export default Login;
