import React from 'react';
import '../styles/tailwind.css';
import Button from './Button';
import Login from './Login';
import { useAuth } from '../context/AuthContext';

const App: React.FC = () => {
  const { isLoggedIn, username, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-blue-500 items-center justify-center p-4">
      <h1 className="text-white text-2xl mb-8">AliasVault</h1>
      {isLoggedIn ? (
        <div className="mt-4">
          <p className="text-white text-lg mb-4">Logged in as {username}</p>
          <Button onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;
