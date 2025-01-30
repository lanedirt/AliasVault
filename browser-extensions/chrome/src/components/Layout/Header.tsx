import React, { useRef, useState, useEffect } from 'react';
import { UserMenu } from './UserMenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  authContext: any;
  clientUrl: string;
  handleRefresh: () => Promise<void>;
  toggleUserMenu: () => void;
  isUserMenuOpen: boolean;
  routes?: {
    path: string;
    showBackButton?: boolean;
    title?: string;
  }[];
}

const Header: React.FC<HeaderProps> = ({
  authContext,
  clientUrl,
  handleRefresh,
  toggleUserMenu,
  isUserMenuOpen,
  routes = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Updated route matching logic to handle URL parameters
  const currentRoute = routes?.find(route => {
    // Convert route pattern to regex
    const pattern = route.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(location.pathname);
  });

  console.log('currentRoute', currentRoute);

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className="fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center h-16 px-4">
        {currentRoute?.showBackButton ? (
        <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 pr-2 pt-1.5 pb-1.5 rounded-lg group"
        >
          <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            {currentRoute.title && (
              <h1 className="text-lg font-medium text-gray-900 dark:text-white ml-2">
                {currentRoute.title}
              </h1>
            )}
          </div>
          </button>
        ) : (
          <div className="flex items-center">
          <img src="/assets/images/logo.svg" alt="AliasVault" className="h-8 w-8 mr-2" />
          <h1 className="text-gray-900 dark:text-white text-xl font-bold">AliasVault</h1>
          <span className="text-primary-500 text-[10px] ml-1 font-normal">BETA</span>
          </div>
        )}

        <div className="flex-grow" />

        <div className="flex items-center">
            {!currentRoute?.showBackButton ? (
          <button
            onClick={() => window.open(clientUrl, '_blank')}
            className="p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </button>
            ) : (<></>)}
        </div>
        {!authContext.isLoggedIn ? (
          <button
            id="settings"
            onClick={(handleSettings)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="sr-only">Settings</span>
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <UserMenu
            handleRefresh={handleRefresh}
            toggleUserMenu={toggleUserMenu}
            isUserMenuOpen={isUserMenuOpen}
            username={authContext.username}
          />
        )}
      </div>
    </header>
  );
};

export default Header;