import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Buffer } from 'buffer';

type Credential = {
  Id: string;
  ServiceName: string;
  Username: string;
  Logo?: Uint8Array;
}

type CredentialsListProps = {
  base64Encode: (buffer: Uint8Array) => string | null;
}

/**
 * Credentials list page
 */
const CredentialsList: React.FC<CredentialsListProps> = ({ base64Encode }) => {
  const dbContext = useDb();
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    if (!dbContext?.sqliteClient) return;

    try {
      const results = dbContext.sqliteClient.executeQuery<Credential>(
        `SELECT
          c.Id,
          c.Username as Username,
          s.Name as ServiceName,
          s.Logo as Logo
        FROM Credentials c
        JOIN Services s ON s.Id = c.ServiceId
        WHERE c.IsDeleted = 0`
      );
      setCredentials(results);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
  }, [dbContext.sqliteClient]);

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4 shadow-lg">
      <h2 className="text-gray-900 dark:text-white text-xl mb-4">Your Credentials</h2>
      {credentials.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No credentials found</p>
      ) : (
        <ul className="space-y-2">
          {credentials.map(cred => (
            <li key={cred.Id} className="p-2 border dark:border-gray-600 rounded flex items-center bg-gray-50 dark:bg-gray-800">
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