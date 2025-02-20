import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useMinDurationLoading } from './hooks/useMinDurationLoading';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import AuthSettings from './pages/AuthSettings';
import CredentialsList from './pages/CredentialsList';
import EmailsList from './pages/EmailsList';
import LoadingSpinner from './components/LoadingSpinner';
import Home from './pages/Home';
import './style.css';
import CredentialDetails from './pages/CredentialDetails';
import EmailDetails from './pages/EmailDetails';
import Settings from './pages/Settings';
import GlobalStateChangeHandler from './components/GlobalStateChangeHandler';
import { useLoading } from './context/LoadingContext';

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
    { path: '/emails', element: <EmailsList />, showBackButton: false },
    { path: '/emails/:id', element: <EmailDetails />, showBackButton: true, title: 'Email details' },
    { path: '/settings', element: <Settings />, showBackButton: false },
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
      authContext.clearGlobalMessage();
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
            height: 'calc(100vh - 120px)',
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
