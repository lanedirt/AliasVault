import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Unlock from './Unlock';
import Login from './Login';
import UnlockSuccess from './UnlockSuccess';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { useLoading } from '../context/LoadingContext';
import { useWebApi } from '../context/WebApiContext';

/**
 * Home page that shows the correct page based on the user's authentication state.
 */
const Home: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const navigate = useNavigate();
  const webApi = useWebApi();
  const { setIsInitialLoading } = useLoading();
  const [isInlineUnlockMode, setIsInlineUnlockMode] = useState(false);
  const initialized = authContext.isInitialized && dbContext.dbInitialized;
  const needsUnlock = initialized && (!authContext.isLoggedIn || !dbContext.dbAvailable);

  useEffect(() => {
    // Detect if the user is coming from the unlock page with mode=inline_unlock
    const urlParams = new URLSearchParams(window.location.search);
    const isInlineUnlockMode = urlParams.get('mode') === 'inline_unlock';
    setIsInlineUnlockMode(isInlineUnlockMode);

    // Do a status check to see if the auth tokens are still valid, if not, redirect to the login page.
    const checkStatus = async () => {
      const status = await webApi.get('Status');
      if (status.status !== 0) {
        authContext.logout();
      }
    };

    if (initialized && !needsUnlock) {
      navigate('/credentials', { replace: true });
    }
  }, [initialized,needsUnlock, isInlineUnlockMode, navigate]);

  // Set initial loading state to false once the page is loaded until here.
  setIsInitialLoading(false);

  if (!authContext.isLoggedIn) {
    return <Login />;
  }

  if (needsUnlock) {
    return <Unlock />;
  }

  if (isInlineUnlockMode) {
    return <UnlockSuccess onClose={() => setIsInlineUnlockMode(false)} />;
  }

  return null;
};

export default Home;