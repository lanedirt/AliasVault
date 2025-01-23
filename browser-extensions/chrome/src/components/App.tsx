import React, { useState } from 'react';
import '../styles/tailwind.css';
import Button from './Button';
import Login from './Login';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleClick = () => {
    alert('Button clicked!');
  };

  return (
    <div className="min-h-screen bg-blue-500 items-center justify-center p-4">
      <h1 className="text-white text-2xl mb-8">AliasVault</h1>
      {isLoggedIn ? (
        <div className="mt-4">
          <Button onClick={handleClick}>
            Click me!
          </Button>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;
