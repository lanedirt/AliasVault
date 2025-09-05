import React from 'react';

type ButtonProps = {
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  className?: string;
};

/**
 * Button component
 */
const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  type = 'button',
  variant = 'primary',
  className = ''
}) => {
  const colorClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600',
    secondary: 'bg-gray-500 hover:bg-gray-600'
  };

  return (
    <button
      className={`${colorClasses[variant]} text-white font-medium rounded-lg px-4 py-2 text-sm w-full ${className}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
