import React from 'react';
import '../styles/tailwind.css';
import Button from './Button';

const App: React.FC = () => {
  const handleClick = () => {
    alert('Button clicked!');
  };

  return (
    <div className="bg-blue-500 text-white p-4">
      <h1>Hello, AliasVault Chrome Extension!</h1>
      <div className="mt-4">
        <Button onClick={handleClick}>
          Click me!
        </Button>
      </div>
    </div>
  );
};

export default App;
