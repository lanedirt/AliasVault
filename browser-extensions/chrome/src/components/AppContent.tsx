import React, { useState, useEffect } from 'react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import Unlock from './Unlock';
import Login from './Login';
import Settings from './Settings';

interface Credential {
  Id: string;
  ServiceName: string;
  Username: string;
  Logo?: any; // Changed from string to any since it's raw buffer data
}

// Add base64Encode function
// TODO: this is used in contentScript.ts too.
function base64Encode(buffer: any): string | null {
  if (!buffer || typeof buffer !== 'object') {
    console.log('Empty or invalid buffer received');
    return null;
  }

  try {
    // Convert object to array of numbers
    const byteArray = Object.values(buffer);

    // Convert to binary string
    const binary = String.fromCharCode.apply(null, byteArray as number[]);

    // Use btoa to encode binary string to base64
    return btoa(binary);
  } catch (error) {
    console.error('Error encoding to base64:', error);
    return null;
  }
}

const AppContent: React.FC = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const dbContext = useDb();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      console.log('isLoggedIn is true');
      if (!dbContext.isInitialized) {
        console.log('Database is not initialized, setting needsUnlock to true');
        setNeedsUnlock(true);
      } else {
        console.log('Database is initialized, setting needsUnlock to false');
        setNeedsUnlock(false);
        loadCredentials();
      }
    }
  }, [isLoggedIn, dbContext.isInitialized]);

  const loadCredentials = () => {
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

        console.log(results);
    } catch (err) {
      console.error('Error loading credentials:', err);
    }
  };

  const handleLogout = () => {
    setCredentials([]);
    setNeedsUnlock(true);
    logout();
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  if (showSettings) {
    return (
      <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-800">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center px-4 py-3">
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <h1 className="text-gray-900 dark:text-white text-xl">Settings</h1>
            <div className="w-8"></div> {/* Spacer for alignment */}
          </div>
        </div>
        <Settings />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <img src="/images/logo.svg" alt="AliasVault" className="h-8 w-8 mr-2" />
            <h1 className="text-gray-900 dark:text-white text-xl">AliasVault</h1>
          </div>
          <button
            onClick={toggleSettings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Settings
          </button>
        </div>
      </div>

      <div className="p-4">
        {isLoggedIn ? (
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-200 text-lg mb-4">Logged in as {username}</p>
            {needsUnlock ? (
              <Unlock />
            ) : (
              <div>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4 shadow-lg">
                  <h2 className="text-gray-900 dark:text-white text-xl mb-4">Your Credentials</h2>
                  {credentials.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No credentials found</p>
                  ) : (
                    <ul className="space-y-2">
                      {credentials.map(cred => (
                        <li key={cred.Id} className="p-2 border dark:border-gray-600 rounded flex items-center bg-gray-50 dark:bg-gray-800">
                          <img
                            src={cred.Logo ? `data:image/x-icon;base64,${base64Encode(cred.Logo)}` : '/images/service-placeholder.webp'}
                            alt={cred.ServiceName}
                            className="w-8 h-8 mr-2 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/service-placeholder.webp';
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
                <Button onClick={handleLogout}>Logout</Button>
              </div>
            )}
          </div>
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
};

export default AppContent;