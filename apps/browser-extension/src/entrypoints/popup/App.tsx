import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import GlobalStateChangeHandler from '@/entrypoints/popup/components/GlobalStateChangeHandler';
import BottomNav from '@/entrypoints/popup/components/Layout/BottomNav';
import Header from '@/entrypoints/popup/components/Layout/Header';
import LoadingSpinner from '@/entrypoints/popup/components/LoadingSpinner';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import AuthSettings from '@/entrypoints/popup/pages/AuthSettings';
import CredentialDetails from '@/entrypoints/popup/pages/CredentialDetails';
import CredentialEdit from '@/entrypoints/popup/pages/CredentialEdit';
import CredentialsList from '@/entrypoints/popup/pages/CredentialsList';
import EmailDetails from '@/entrypoints/popup/pages/EmailDetails';
import EmailsList from '@/entrypoints/popup/pages/EmailsList';
import Home from '@/entrypoints/popup/pages/Home';
import Logout from '@/entrypoints/popup/pages/Logout';
import Settings from '@/entrypoints/popup/pages/Settings';

import { useMinDurationLoading } from '@/hooks/useMinDurationLoading';
import '@/entrypoints/popup/style.css';

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
  const { isInitialLoading } = useLoading();
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);
  const [message, setMessage] = useState<string | null>(null);

  // Add these route configurations
  const routes: RouteConfig[] = [
    { path: '/', element: <Home />, showBackButton: false },
    { path: '/auth-settings', element: <AuthSettings />, showBackButton: true, title: 'Settings' },
    { path: '/credentials', element: <CredentialsList />, showBackButton: false },
    { path: '/credentials/:id', element: <CredentialDetails />, showBackButton: true, title: 'Credential details' },
    { path: '/credentials/:id/edit', element: <CredentialEdit />, showBackButton: true, title: 'Edit credential' },
    { path: '/emails', element: <EmailsList />, showBackButton: false },
    { path: '/emails/:id', element: <EmailDetails />, showBackButton: true, title: 'Email details' },
    { path: '/settings', element: <Settings />, showBackButton: false },
    { path: '/logout', element: <Logout />, showBackButton: false },
  ];

  useEffect(() => {
    if (!isInitialLoading) {
      setIsLoading(false);
    }
  }, [isInitialLoading, setIsLoading]);

  /**
   * Print global message if it exists.
   */
  useEffect(() => {
    if (authContext.globalMessage) {
      setMessage(authContext.globalMessage);
    } else {
      setMessage(null);
    }
  }, [authContext, authContext.globalMessage]);

  return (
    <Router>
      <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-900 flex flex-col">
        {isLoading && (
          <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        <GlobalStateChangeHandler />
        <Header
          routes={routes}
        />

        <main
          className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900"
          style={{
            paddingTop: '64px',
            height: 'calc(100% - 120px)',
            maxHeight: '600px',
          }}
        >
          <div className="p-4 mb-16">
            {message && (
              <p className="text-red-500 mb-4">{message}</p>
            )}
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

        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
