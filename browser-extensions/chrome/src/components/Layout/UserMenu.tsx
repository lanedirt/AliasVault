import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../../context/LoadingContext';

interface UserMenuProps {
  username: string;
  onRefresh?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  username,
  onRefresh,
}) => {
  const authContext = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const onLogout = async () => {
    showLoading();
    console.log('logging out');
    await authContext.logout();
    console.log('redirecting to home');
    navigate('/', { replace: true });
    // Delay for 100ms for improved UX
    await new Promise(resolve => setTimeout(resolve, 100));
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
                {username}
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