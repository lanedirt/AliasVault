import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import { useAuth } from '../context/AuthContext';
import { useWebApi } from '../context/WebApiContext';
import { Buffer } from 'buffer';
import Button from '../components/Button';
import EncryptionUtility from '../utils/EncryptionUtility';
import SrpUtility from '../utils/SrpUtility';
import { VaultResponse } from '../types/webapi/VaultResponse';
import { useLoading } from '../context/LoadingContext';

/**
 * Unlock page
 */
const Unlock: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();

  const webApi = useWebApi();
  const srpUtil = new SrpUtility(webApi);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { showLoading, hideLoading } = useLoading();
  /**
   * Handle submit
   */
  const handleSubmit = async (e: React.FormEvent) : Promise<void> => {
    e.preventDefault();
    setError(null);
    showLoading();
    try {
      // 1. Initiate login to get salt and server ephemeral
      const loginResponse = await srpUtil.initiateLogin(authContext.username!);

      // Derive key from password using user's encryption settings
      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      // Make API call to get latest vault
      const vaultResponseJson = await webApi.get('Vault') as VaultResponse;

      // Attempt to decrypt the blob
      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');
      const decryptedBlob = await EncryptionUtility.symmetricDecrypt(
        vaultResponseJson.vault.blob,
        passwordHashBase64
      );

      // Initialize the SQLite context with decrypted data
      await dbContext.initializeDatabase(passwordHashBase64, decryptedBlob);
    } catch (err) {
      setError('Failed to unlock vault. Please check your password and try again.');
      console.error('Unlock error:', err);
    } finally {
      hideLoading();
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () : Promise<void> => {
    showLoading();
    try {
      await authContext.logout();
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-700 w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex space-x-4 mb-6">
          <img className="w-8 h-8 rounded-full" src="/assets/images/avatar.webp" alt="User avatar" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{authContext.username}</h2>
        </div>

        <p className="text-base text-gray-500 dark:text-gray-200 mb-6">
          Enter your master password to unlock your database.
        </p>

        {error && (
          <div className="mb-4 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <Button type="submit">
          Unlock
        </Button>

        <div className="text-sm font-medium text-gray-500 dark:text-gray-200 mt-6">
          Switch accounts? <a href="#" onClick={handleLogout} className="text-primary-700 hover:underline dark:text-primary-500">Log out</a>
        </div>
      </form>
    </div>
  );
};

export default Unlock;
