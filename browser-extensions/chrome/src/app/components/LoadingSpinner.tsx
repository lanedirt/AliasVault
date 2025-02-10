import React from 'react';

/**
 * Loading spinner component used throughout the app for showing a loading spinner
 * inline in the page.
 */
const LoadingSpinner: React.FC = () => {
  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const spinner = (
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

  return (
    <div className="inline-flex items-center">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
