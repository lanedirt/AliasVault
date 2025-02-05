import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Credential } from '../types/Credential';
import { Buffer } from 'buffer';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { useWebApi } from '../context/WebApiContext';
import EncryptionUtility from '../utils/EncryptionUtility';
import { VaultResponse } from '../types/webapi/VaultResponse';
import ReloadButton from '../components/ReloadButton';
/**
 * Credentials list page.
 */
const CredentialsList: React.FC = () => {
  const dbContext = useDb();
  const webApi = useWebApi();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (!dbContext?.sqliteClient) return;

    try {
      const results = dbContext.sqliteClient.getAllCredentials();
      setCredentials(results);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
  }, [dbContext.sqliteClient]);

  /**
   * Retrieve latest vault and refresh the page.
   */
  const onRefresh = async () : Promise<void> => {
    showLoading();
    try {
      // Make API call to get latest vault
      const vaultResponseJson = await webApi.get('Vault') as VaultResponse;

      // Get derived key from background worker
      const passwordHashBase64 = await chrome.runtime.sendMessage({ type: 'GET_DERIVED_KEY' });

      // Attempt to decrypt the blob
      const decryptedBlob = await EncryptionUtility.symmetricDecrypt(
        vaultResponseJson.vault.blob,
        passwordHashBase64
      );

      // Initialize the SQLite context again with the newly retrieved decrypted blob
      await dbContext.initializeDatabase(passwordHashBase64, decryptedBlob, vaultResponseJson.vault.publicEmailDomainList, vaultResponseJson.vault.privateEmailDomainList, vaultResponseJson.vault.currentRevisionNumber);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 dark:text-white text-xl mb-4">Credentials</h2>
        <ReloadButton onClick={onRefresh} />
      </div>
      {credentials.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No credentials found</p>
      ) : (
        <ul className="space-y-2">
          {credentials.map(cred => (
            <li key={cred.Id}
              onClick={() => navigate(`/credentials/${cred.Id}`)}
              className="p-2 border dark:border-gray-600 rounded flex items-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
              <img
                src={cred.Logo ? `data:image/x-icon;base64,${Buffer.from(cred.Logo).toString('base64')}` : '/assets/images/service-placeholder.webp'}
                alt={cred.ServiceName}
                className="w-8 h-8 mr-2 flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/assets/images/service-placeholder.webp';
                }}
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{cred.ServiceName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{cred.Username}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CredentialsList;