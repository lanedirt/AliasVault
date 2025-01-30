import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Credential } from '../types/Credential';
import { Buffer } from 'buffer';
import { useNavigate } from 'react-router-dom';

/**
 * Credentials list page.
 */
const CredentialsList: React.FC = () => {
  const dbContext = useDb();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('loading credentials1');
    console.log(dbContext);
    if (!dbContext?.sqliteClient) return;

    console.log('loading credentials2');
    try {
      const results = dbContext.sqliteClient.getAllCredentials();
      setCredentials(results);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
  }, [dbContext.sqliteClient]);

  return (
    <div>
      <h2 className="text-gray-900 dark:text-white text-xl mb-4">Credentials</h2>
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