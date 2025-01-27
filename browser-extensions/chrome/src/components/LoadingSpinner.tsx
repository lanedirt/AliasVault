import React from 'react';

type LoadingSpinnerProps = {
  size?: number;
}

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
}) => {
  const spinnerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div
        className="border-[4px] border-solid border-current/10 dark:border-white/10 border-t-current dark:border-t-white"
        style={spinnerStyle}
      />
    </>
  );
};

export default LoadingSpinner;
