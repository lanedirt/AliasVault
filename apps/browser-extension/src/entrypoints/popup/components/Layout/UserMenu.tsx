import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';

/**
 * User menu component.
 */
export const UserMenu: React.FC = () => {
  const authContext = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    /**
     * Handle clicking outside the user menu.
     */
    const handleClickOutside = (event: MouseEvent) : void => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () : void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Toggle the user menu.
   */
  const toggleUserMenu = () : void => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  /**
   * Handle logging out.
   */
  const onLogout = async () : Promise<void> => {
    showLoading();
    navigate('/logout', { replace: true });
    hideLoading();
  };

  return (
    <div className="relative flex items-center">
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={toggleUserMenu}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="sr-only">Open menu</span>
          <svg className="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        {isUserMenuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 z-50 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                {authContext.username}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMenu;