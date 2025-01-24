import React, { useState, useEffect } from 'react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import Unlock from './Unlock';
import Login from './Login';

interface Credential {
  Id: string;
  ServiceName: string;
  Username: string;
  Logo?: string; // base64 encoded image data
}

const AppContent: React.FC = () => {
  const { isLoggedIn, username, logout } = useAuth();
  const dbContext = useDb();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [needsUnlock, setNeedsUnlock] = useState(true);

  useEffect(() => {
    if (isLoggedIn && dbContext?.isInitialized) {
      setNeedsUnlock(false);
      loadCredentials();
    }
  }, [isLoggedIn, dbContext?.isInitialized]);

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

  return (
    <div className="min-h-screen bg-blue-500 items-center justify-center p-4">
      <h1 className="text-white text-2xl mb-8">AliasVault</h1>
      {isLoggedIn ? (
        <div className="mt-4">
          <p className="text-white text-lg mb-4">Logged in as {username}</p>
          {needsUnlock ? (
            <Unlock />
          ) : (
            <div>
              <div className="bg-white rounded-lg p-4 mb-4">
                <h2 className="text-xl mb-4">Your Credentials</h2>
                {credentials.length === 0 ? (
                  <p className="text-gray-500">No credentials found</p>
                ) : (
                  <ul className="space-y-2">
                    {credentials.map(cred => (
                      <li key={cred.Id} className="p-2 border rounded flex items-center">
                        <img
                          src={cred.Logo ? `data:image/png;base64,${cred.Logo}` : '/images/service-placeholder.webp'}
                          alt={cred.ServiceName}
                          className="w-8 h-8 mr-2 flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium">{cred.ServiceName}</p>
                          <p className="text-sm text-gray-600">{cred.Username}</p>
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
  );
};

export default AppContent;