import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useDb } from './context/DbContext';
import { useWebApi } from './context/WebApiContext';
import { useMinDurationLoading } from './hooks/useMinDurationLoading';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import Settings from './pages/Settings';
import CredentialsList from './pages/CredentialsList';
import EmailsList from './pages/EmailsList';
import LoadingSpinner from './components/LoadingSpinner';
import Home from './pages/Home';
import './styles/app.css';
import CredentialDetails from './pages/CredentialDetails';
// Add this type definition at the top level
type RouteConfig = {
  path: string;
  element: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
};

const App: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [clientUrl, setClientUrl] = useState('https://app.aliasvault.net');
  const [currentTab, setCurrentTab] = useState<'credentials' | 'emails'>('credentials');
  const [isLoading, setIsLoading] = useMinDurationLoading(true, 150);

  // Add these route configurations
  const routes: RouteConfig[] = [
    { path: '/', element: <Home />, showBackButton: false },
    { path: '/settings', element: <Settings />, showBackButton: true, title: 'Settings' },
    { path: '/credentials', element: <CredentialsList />, showBackButton: false },
    { path: '/credentials/:id', element: <CredentialDetails />, showBackButton: true, title: 'Credential Details' },
    { path: '/emails', element: <EmailsList />, showBackButton: false },
  ];

  /**
   * Set loading state to false when auth and db are initialized.
   */
  useEffect(() => {
    if (authContext.isInitialized && dbContext.dbInitialized) {
      setIsLoading(false);
    }
  }, [authContext.isInitialized, dbContext.dbInitialized, setIsLoading]);

  console.log('authContext.isLoggedIn', authContext.isInitialized);
  console.log('dbContext.dbInitialized', dbContext.dbInitialized);
  console.log('isLoading', isLoading);

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
          authContext={authContext}
          clientUrl={clientUrl}
          handleRefresh={async () => {}}
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
