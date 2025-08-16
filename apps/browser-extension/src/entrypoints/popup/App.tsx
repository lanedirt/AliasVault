import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { ClipboardCountdownBar } from '@/entrypoints/popup/components/ClipboardCountdownBar';
import BottomNav from '@/entrypoints/popup/components/Layout/BottomNav';
import Header from '@/entrypoints/popup/components/Layout/Header';
import LoadingSpinner from '@/entrypoints/popup/components/LoadingSpinner';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useHeaderButtons } from '@/entrypoints/popup/context/HeaderButtonsContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';
import { NavigationProvider } from '@/entrypoints/popup/context/NavigationContext';
import AuthSettings from '@/entrypoints/popup/pages/AuthSettings';
import CredentialAddEdit from '@/entrypoints/popup/pages/CredentialAddEdit';
import CredentialDetails from '@/entrypoints/popup/pages/CredentialDetails';
import CredentialsList from '@/entrypoints/popup/pages/CredentialsList';
import EmailDetails from '@/entrypoints/popup/pages/EmailDetails';
import EmailsList from '@/entrypoints/popup/pages/EmailsList';
import Index from '@/entrypoints/popup/pages/Index';
import Login from '@/entrypoints/popup/pages/Login';
import Logout from '@/entrypoints/popup/pages/Logout';
import Reinitialize from '@/entrypoints/popup/pages/Reinitialize';
import Settings from '@/entrypoints/popup/pages/Settings';
import Unlock from '@/entrypoints/popup/pages/Unlock';
import UnlockSuccess from '@/entrypoints/popup/pages/UnlockSuccess';
import Upgrade from '@/entrypoints/popup/pages/Upgrade';

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
  const { t } = useTranslation();
  const authContext = useAuth();
  const { isInitialLoading } = useLoading();
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);
  const [message, setMessage] = useState<string | null>(null);
  const { headerButtons } = useHeaderButtons();

  // Move routes definition to useMemo to prevent recreation on every render
  const routes: RouteConfig[] = React.useMemo(() => [
    { path: '/', element: <Index />, showBackButton: false },
    { path: '/reinitialize', element: <Reinitialize />, showBackButton: false },
    { path: '/login', element: <Login />, showBackButton: false },
    { path: '/unlock', element: <Unlock />, showBackButton: false },
    { path: '/unlock-success', element: <UnlockSuccess />, showBackButton: false },
    { path: '/upgrade', element: <Upgrade />, showBackButton: false },
    { path: '/auth-settings', element: <AuthSettings />, showBackButton: true, title: t('settings.title') },
    { path: '/credentials', element: <CredentialsList />, showBackButton: false },
    { path: '/credentials/add', element: <CredentialAddEdit />, showBackButton: true, title: t('credentials.addCredential') },
    { path: '/credentials/:id', element: <CredentialDetails />, showBackButton: true, title: t('credentials.credentialDetails') },
    { path: '/credentials/:id/edit', element: <CredentialAddEdit />, showBackButton: true, title: t('credentials.editCredential') },
    { path: '/emails', element: <EmailsList />, showBackButton: false },
    { path: '/emails/:id', element: <EmailDetails />, showBackButton: true, title: t('emails.title') },
    { path: '/settings', element: <Settings />, showBackButton: false },
    { path: '/logout', element: <Logout />, showBackButton: false },
  ], [t]);

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
      <NavigationProvider>
        <div className="min-h-screen min-w-[350px] bg-white dark:bg-gray-900 flex flex-col max-h-[600px]">
          {isLoading && (
            <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}

          <ClipboardCountdownBar />
          <Header
            routes={routes}
            rightButtons={headerButtons}
          />

          <main
            className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900"
            style={{
              paddingTop: '64px',
              height: 'calc(100% - 120px)',
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
      </NavigationProvider>
    </Router>
  );
};

export default App;
