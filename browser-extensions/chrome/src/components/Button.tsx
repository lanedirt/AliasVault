import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, type = 'button' }) => {
  return (
    <button
      className="bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg px-4 py-2 text-sm w-full"
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;