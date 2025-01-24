import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return (
    <button
      className="bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-4 py-2 text-sm"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;