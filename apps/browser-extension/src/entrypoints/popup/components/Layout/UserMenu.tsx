import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/entrypoints/popup/context/AuthContext';

/**
 * User menu component.
 */
const UserMenu: React.FC = () => {
  const authContext = useAuth();
  const navigate = useNavigate();

  /**
   * Handle logout.
   */
  const handleLogout = async () : Promise<void> => {
    await authContext.logout();
    navigate('/');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 text-lg font-medium">
                {authContext.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {authContext.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Logged in
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserMenu;