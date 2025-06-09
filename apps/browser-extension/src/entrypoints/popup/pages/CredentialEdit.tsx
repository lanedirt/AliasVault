import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { useVaultMutate } from '@/entrypoints/popup/hooks/useVaultMutate';

import type { Credential } from '@/utils/shared/models/vault';

/**
 * Credential edit page.
 */
const CredentialEdit: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dbContext = useDb();
  const [credential, setCredential] = useState<Credential | null>(null);
  const { setIsInitialLoading } = useLoading();
  const { executeVaultMutation, isLoading, syncStatus } = useVaultMutate();

  useEffect(() => {
    if (!dbContext?.sqliteClient || !id) {
      return;
    }

    try {
      const result = dbContext.sqliteClient.getCredentialById(id);
      if (result) {
        setCredential(result);
        setIsInitialLoading(false);
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
   * @returns {Promise<void>}
   */
  const handleDelete = async (): Promise<void> => {
    if (!id || !window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }

    /**
     * Execute the vault mutation to delete the credential.
     */
    executeVaultMutation(async () => {
      /**
       * Delete the credential from the database.
       */
      dbContext.sqliteClient!.deleteCredentialById(id);
    }, {
      /**
       * Navigate back to the credentials list on success.
       */
      onSuccess: () => {
        navigate('/credentials');
      }
    });
  };

  if (!credential) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Edit Credential</h1>
        <button
          onClick={() => navigate(`/credentials/${id}`)}
          className="text-blue-500 hover:text-blue-700"
        >
          Cancel
        </button>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-500">
          {syncStatus}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Service Name</label>
          <input
            type="text"
            value={credential.ServiceName}
            onChange={(e) => setCredential({ ...credential, ServiceName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Service URL</label>
          <input
            type="text"
            value={credential.ServiceUrl}
            onChange={(e) => setCredential({ ...credential, ServiceUrl: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={credential.Username}
            onChange={(e) => setCredential({ ...credential, Username: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={credential.Password}
            onChange={(e) => setCredential({ ...credential, Password: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={credential.Notes}
            onChange={(e) => setCredential({ ...credential, Notes: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleDelete}
            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Credential
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialEdit;