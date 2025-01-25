import React, { useState } from 'react';
import Button from '../components/Button';
import { Buffer } from 'buffer';
import EncryptionUtility from '../utils/EncryptionUtility';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { useWebApi } from '../context/WebApiContext';
import SrpUtility from '../utils/SrpUtility';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbContext = useDb();
  const webApi = useWebApi();
  // Create SrpUtility instance with webApi
  const srpUtil = new SrpUtility(webApi);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
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

      console.log('Password hash:');
      console.log(passwordHash);
      console.log(passwordHashString);

      // 2. Validate login with SRP protocol
      const validationResponse = await srpUtil.validateLogin(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse
      );

      // Store access and refresh token using the context
      if (validationResponse.token) {
        // Store auth info
        await login(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);
      } else {
        throw new Error('Login failed -- no token returned');
      }

        // Make another API call trying to get latest vault
        // TODO: can we make webapi response typed?
        const vaultResponseJson = await webApi.get('Vault') as any;

        console.log('Vault response:')
        console.log('--------------------------------');
        console.log(vaultResponseJson);
        console.log('Encrypted blob:');
        console.log(vaultResponseJson.vault.blob);

        // Attempt to decrypt the blob
        const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');
        const decryptedBlob = await EncryptionUtility.symmetricDecrypt(vaultResponseJson.vault.blob, passwordHashBase64);
        console.log('Decrypted blob:');
        console.log(decryptedBlob);

        // Initialize the SQLite context with decrypted data
        await dbContext.initializeDatabase(decryptedBlob);

      // 3. Handle 2FA if required
      /*if (validationResponse.requiresTwoFactor) {
        // TODO: Implement 2FA flow
        console.log('2FA required');
        return;
      }

      // 5. Redirect to home page
      window.location.href = '/';*/

    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-700 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {error && (
          <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            name="username"
            placeholder="Enter your username"
            value={credentials.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
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
    </div>
  );
};

export default Login;
