import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './app/context/AuthContext';
import { useDb } from './app/context/DbContext';
import { useMinDurationLoading } from './app/hooks/useMinDurationLoading';
import Header from './app/components/Layout/Header';
import BottomNav from './app/components/Layout/BottomNav';
import Settings from './app/pages/Settings';
import CredentialsList from './app/pages/CredentialsList';
import EmailsList from './app/pages/EmailsList';
import LoadingSpinner from './app/components/LoadingSpinner';
import Home from './app/pages/Home';
import './app/style.css';
import CredentialDetails from './app/pages/CredentialDetails';
import EmailDetails from './app/pages/EmailDetails';

/**
 * Route configuration.
 */
type RouteConfig = {
  path: string;
  element: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
};

/**
 * App component.
 */
const App: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'credentials' | 'emails'>('credentials');
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);

  // Add these route configurations
  const routes: RouteConfig[] = [
    { path: '/', element: <Home />, showBackButton: false },
    { path: '/settings', element: <Settings />, showBackButton: true, title: 'Settings' },
    { path: '/credentials', element: <CredentialsList />, showBackButton: false },
    { path: '/credentials/:id', element: <CredentialDetails />, showBackButton: true, title: 'Credential details' },
    { path: '/emails', element: <EmailsList />, showBackButton: false },
    { path: '/emails/:id', element: <EmailDetails />, showBackButton: true, title: 'Email details' },
  ];

  /**
   * Set loading state to false when auth and db are initialized.
   */
  useEffect(() => {
    if (authContext.isInitialized && dbContext.dbInitialized) {
      setIsLoading(false);
    }
  }, [authContext.isInitialized, dbContext.dbInitialized, setIsLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-900 flex flex-col">
        <div className="flex-1 overflow-y-auto" style={{ paddingTop: '64px' }}>
          <div className="p-4 mt-20 dark:bg-gray-900 h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-900 flex flex-col">
        <Header
          toggleUserMenu={() => setIsUserMenuOpen(!isUserMenuOpen)}
          isUserMenuOpen={isUserMenuOpen}
          routes={routes}
        />

        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingTop: '64px',
            height: 'calc(100vh - 120px)',
          }}
        >
          <div className="p-4 dark:bg-gray-900 mb-16">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Routes>
          </div>
        </main>

        <BottomNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </div>
    </Router>
  );
};

export default App;
