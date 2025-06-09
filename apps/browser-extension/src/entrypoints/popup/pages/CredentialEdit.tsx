import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { FormInput } from '@/entrypoints/popup/components/FormInput';
import HeaderButton from '@/entrypoints/popup/components/HeaderButton';
import { HeaderIconType } from '@/entrypoints/popup/components/icons/HeaderIcons';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { useVaultMutate } from '@/entrypoints/popup/hooks/useVaultMutate';

import type { Credential } from '@/utils/shared/models/vault';

type CredentialMode = 'random' | 'manual';

/**
 * Add or edit credential page.
 */
const CredentialAddEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const [credential, setCredential] = useState<Credential | null>(null);
  const { setIsInitialLoading } = useLoading();
  const { executeVaultMutation, isLoading, syncStatus } = useVaultMutate();
  const [mode, setMode] = useState<CredentialMode>('random');
  const { setHeaderButtons } = useHeaderButtons();

  // If we received an ID, we're in edit mode
  const isEditMode = id !== undefined && id.length > 0;

  /**
   * Load an existing credential from the database in edit mode.
   */
  useEffect(() => {
    if (!dbContext?.sqliteClient || !id) {
      return;
    }

    try {
      const result = dbContext.sqliteClient.getCredentialById(id);
      if (result) {
        setCredential(result);
        setIsInitialLoading(false);
        // If credential has alias data, switch to manual mode
        if (result.Alias?.FirstName || result.Alias?.LastName) {
          setMode('manual');
        }
      } else {
        console.error('Credential not found');
        navigate('/credentials');
      }
    } catch (err) {
      console.error('Error loading credential:', err);
    }
  }, [dbContext.sqliteClient, id, navigate, setIsInitialLoading]);

  /**
   * Handle the delete button click.
   */
  const handleDelete = useCallback(async (): Promise<void> => {
    if (!id || !window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    executeVaultMutation(async () => {
      dbContext.sqliteClient!.deleteCredentialById(id);
    }, {
      /**
       * Navigate to the credentials list page on success.
       */
      onSuccess: () => {
        navigate('/credentials');
      }
    });
  }, [id, executeVaultMutation, dbContext.sqliteClient, navigate]);

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!credential) {
      return;
    }

    executeVaultMutation(async () => {
      if (isEditMode) {
        await dbContext.sqliteClient!.updateCredentialById(credential);
      } else {
        const credentialId = await dbContext.sqliteClient!.createCredential(credential);
        credential.Id = credentialId.toString();
      }
    }, {
      /**
       * Navigate to the credential details page on success.
       */
      onSuccess: () => {
        // Pop the current page from the history stack
        navigate(-1);
      }
    });
  }, [credential, isEditMode, dbContext.sqliteClient, executeVaultMutation, navigate]);

  // Set header buttons on mount and clear on unmount
  useEffect((): (() => void) => {
    // Only set the header buttons once on mount.
    if (credential) {
      const headerButtonsJSX = (
        <div className="flex items-center gap-2">
          {isEditMode && (
            <HeaderButton
              onClick={handleDelete}
              title="Delete credential"
              iconType={HeaderIconType.DELETE}
              variant="danger"
            />
          )}
          <HeaderButton
            onClick={handleSubmit}
            title="Save credential"
            iconType={HeaderIconType.SAVE}
          />
        </div>
      );

      setHeaderButtons(headerButtonsJSX);
    }
    return () => {};
  }, [setHeaderButtons, handleSubmit, credential, isEditMode, handleDelete]);

  // Clear header buttons on unmount
  useEffect((): (() => void) => {
    return () => setHeaderButtons(null);
  }, [setHeaderButtons]);

  if (!credential && isEditMode) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-sm text-gray-500">
          {syncStatus}
        </div>
      )}

      {!isEditMode && (
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('random')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'random' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Random Alias
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 px-4 rounded ${
              mode === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Manual
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Service</h2>
          <div className="space-y-4">
            <FormInput
              id="serviceName"
              label="Service Name"
              value={credential?.ServiceName || ''}
              onChange={(value) => setCredential({ ...credential!, ServiceName: value })}
              required
            />
            <FormInput
              id="serviceUrl"
              label="Service URL"
              value={credential?.ServiceUrl || ''}
              onChange={(value) => setCredential({ ...credential!, ServiceUrl: value })}
            />
          </div>
        </div>

        {(mode === 'manual' || isEditMode) && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Login Credentials</h2>
              <div className="space-y-4">
                <FormInput
                  id="username"
                  label="Username"
                  value={credential?.Username || ''}
                  onChange={(value) => setCredential({ ...credential!, Username: value })}
                />
                <FormInput
                  id="password"
                  label="Password"
                  type="password"
                  value={credential?.Password || ''}
                  onChange={(value) => setCredential({ ...credential!, Password: value })}
                />
                <button
                  onClick={() => {/* TODO: Implement generate random alias */}}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generate Random Alias
                </button>
                <FormInput
                  id="email"
                  label="Email"
                  value={credential?.Alias?.Email || ''}
                  onChange={(value) => setCredential({
                    ...credential!,
                    Alias: { ...credential!.Alias, Email: value }
                  })}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Alias</h2>
              <div className="space-y-4">
                <FormInput
                  id="firstName"
                  label="First Name"
                  value={credential?.Alias?.FirstName || ''}
                  onChange={(value) => setCredential({
                    ...credential!,
                    Alias: { ...credential!.Alias, FirstName: value }
                  })}
                />
                <FormInput
                  id="lastName"
                  label="Last Name"
                  value={credential?.Alias?.LastName || ''}
                  onChange={(value) => setCredential({
                    ...credential!,
                    Alias: { ...credential!.Alias, LastName: value }
                  })}
                />
                <FormInput
                  id="nickName"
                  label="Nick Name"
                  value={credential?.Alias?.NickName || ''}
                  onChange={(value) => setCredential({
                    ...credential!,
                    Alias: { ...credential!.Alias, NickName: value }
                  })}
                />
                <FormInput
                  id="gender"
                  label="Gender"
                  value={credential?.Alias?.Gender || ''}
                  onChange={(value) => setCredential({
                    ...credential!,
                    Alias: { ...credential!.Alias, Gender: value }
                  })}
                />
                <FormInput
                  id="birthDate"
                  label="Birth Date"
                  placeholder="YYYY-MM-DD"
                  value={credential?.Alias?.BirthDate || ''}
                  onChange={(value) => setCredential({
                    ...credential!,
                    Alias: { ...credential!.Alias, BirthDate: value }
                  })}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Metadata</h2>
              <div className="space-y-4">
                <FormInput
                  id="notes"
                  label="Notes"
                  value={credential?.Notes || ''}
                  onChange={(value) => setCredential({ ...credential!, Notes: value })}
                  multiline
                  rows={4}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CredentialAddEdit;