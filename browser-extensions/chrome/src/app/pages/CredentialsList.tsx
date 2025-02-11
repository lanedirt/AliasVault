import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Credential } from '../../shared/types/Credential';
import { Buffer } from 'buffer';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { useWebApi } from '../context/WebApiContext';
import { VaultResponse } from '../../shared/types/webapi/VaultResponse';
import ReloadButton from '../components/ReloadButton';
import { useAuth } from '../context/AuthContext';
import { StatusResponse } from '../../shared/types/webapi/StatusResponse';

/**
 * Credentials list page.
 */
const CredentialsList: React.FC = () => {
  const dbContext = useDb();
  const webApi = useWebApi();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const authContext = useAuth();

  useEffect(() => {
    /**
     * Check if the extension is (still) supported by the API and if the local vault is up to date.
     */
    const checkStatus = async (): Promise<void> => {
      if (!dbContext?.sqliteClient) return;

      const statusResponse = await webApi.get('Auth/status') as StatusResponse;
      if (!statusResponse.supported) {
        authContext.logout('This version of the AliasVault browser extension is outdated. Please update to the latest version.');
        return;
      }

      if (statusResponse.vaultRevision > dbContext.vaultRevision) {
        await onRefresh();
      }

      // Load credentials
      try {
        const results = dbContext.sqliteClient.getAllCredentials();
        setCredentials(results);
      } catch (err) {
        console.error('Error loading credentials:', err);
      }
    };

    checkStatus();
  });

  /**
   * Retrieve latest vault and refresh the page.
   */
  const onRefresh = async () : Promise<void> => {
    if (!dbContext?.sqliteClient) return;

    try {
      // Make API call to get latest vault
      const vaultResponseJson = await webApi.get('Vault') as VaultResponse;

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        authContext.logout(vaultError);
        hideLoading();
        return;
      }

      // Get derived key from background worker
      const passwordHashBase64 = await chrome.runtime.sendMessage({ type: 'GET_DERIVED_KEY' });

      // Initialize the SQLite context again with the newly retrieved decrypted blob
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);

      // Load credentials
      try {
        const results = dbContext.sqliteClient.getAllCredentials();
        setCredentials(results);
      } catch (err) {
        console.error('Error loading credentials:', err);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  const onManualRefresh = async (): Promise<void> => {
    showLoading();
    await onRefresh();
    hideLoading();
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-gray-900 dark:text-white text-xl mb-4">Credentials</h2>
        <ReloadButton onClick={onManualRefresh} />
      </div>
      {credentials.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 space-y-2 mb-10">
          <p className="text-sm">
            Welcome to AliasVault!
          </p>
          <p className="text-sm">
            To use the AliasVault browser extension: navigate to a website and use the AliasVault autofill popup to create a new credential.
          </p>
          <p className="text-sm">
            If you want to create manual identities, open the full AliasVault app via the popout icon in the top right corner.
          </p>
        </div>
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