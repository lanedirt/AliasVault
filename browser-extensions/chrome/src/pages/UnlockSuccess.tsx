import React from 'react';

/**
 * Unlock success component shown when the vault is successfully unlocked in a separate popup
 * asking the user if they want to close the popup.
 */
const UnlockSuccess: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <div className="mb-4 text-green-600 dark:text-green-400">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
    Your vault is successfully unlocked
    </h2>
    <p className="mb-6 text-gray-600 dark:text-gray-400">
    You can now use autofill in login forms in your browser.
    </p>
    <div className="space-y-3 w-full">
      <button
        onClick={() => window.close()}
        className="w-full px-4 py-2 text-white bg-primary-600 rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Close this popup
      </button>
      <button
        onClick={() => onClose()}
        className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        Browse vault contents
      </button>
    </div>
  </div>
);

export default UnlockSuccess;
