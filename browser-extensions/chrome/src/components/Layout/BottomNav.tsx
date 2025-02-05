import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDb } from '../../context/DbContext';

/**
 * Bottom nav props.
 */
type BottomNavProps = {
  currentTab: 'credentials' | 'emails';
  setCurrentTab: (tab: 'credentials' | 'emails') => void;
}

/**
 * Bottom nav component.
 */
const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const authContext = useAuth();
  const dbContext = useDb();
  const navigate = useNavigate();

  /**
   * Handle tab change.
   */
  const handleTabChange = (tab: 'credentials' | 'emails') : void => {
    setCurrentTab(tab);
    navigate(`/${tab}`);
  };

  if (!authContext.isLoggedIn || !dbContext.dbAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-around items-center h-14">
        <button
          onClick={() => handleTabChange('credentials')}
          className={`flex flex-col items-center justify-center w-1/2 h-full ${
            currentTab === 'credentials' ? 'text-primary-600 dark:text-primary-500' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="text-xs mt-1">Credentials</span>
        </button>
        <button
          onClick={() => handleTabChange('emails')}
          className={`flex flex-col items-center justify-center w-1/2 h-full ${
            currentTab === 'emails' ? 'text-primary-600 dark:text-primary-500' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs mt-1">Emails</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;