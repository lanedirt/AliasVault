import React, { createContext, useContext, useState } from 'react';
import SqliteClient from '../utilities/SqliteClient';

interface DbContextType {
  sqliteClient: SqliteClient | null;
  initializeDatabase: (base64Data: string) => Promise<void>;
  clearDatabase: () => void;
  isInitialized: boolean;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sqliteClient, setSqliteClient] = useState<SqliteClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDatabase = async (base64Data: string) => {
    try {
      const client = new SqliteClient();
      await client.initializeFromBase64(base64Data);
      setSqliteClient(client);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      clearDatabase();
      throw error;
    }
  };

  const clearDatabase = () => {
    if (sqliteClient) {
      sqliteClient.close();
    }
    setSqliteClient(null);
    setIsInitialized(false);
  };

  return (
    <DbContext.Provider value={{
      sqliteClient,
      initializeDatabase,
      clearDatabase,
      isInitialized
    }}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};