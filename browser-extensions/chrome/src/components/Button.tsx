import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return (
    <button
      className="bg-white text-blue-500 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;