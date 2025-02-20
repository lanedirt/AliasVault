import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Unlock from './Unlock';
import Login from './Login';
import UnlockSuccess from './UnlockSuccess';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { useLoading } from '../context/LoadingContext';

/**
 * Home page that shows the correct page based on the user's authentication state.
 */
const Home: React.FC = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const navigate = useNavigate();
  const { setIsInitialLoading } = useLoading();
  const [isInlineUnlockMode, setIsInlineUnlockMode] = useState(false);

  // Initialization state.
  const isFullyInitialized = authContext.isInitialized && dbContext.dbInitialized;
  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;
  const requireLoginOrUnlock = isFullyInitialized && (!isAuthenticated || !isDatabaseAvailable || isInlineUnlockMode);

  useEffect(() => {
    // Detect if the user is coming from the unlock page with mode=inline_unlock.
    const urlParams = new URLSearchParams(window.location.search);
    const isInlineUnlockMode = urlParams.get('mode') === 'inline_unlock';
    setIsInlineUnlockMode(isInlineUnlockMode);

    // Redirect to credentials if fully initialized and doesn't need unlock.
    if (isFullyInitialized && !requireLoginOrUnlock) {
      navigate('/credentials', { replace: true });
    }
  }, [isFullyInitialized, requireLoginOrUnlock, isInlineUnlockMode, navigate]);

  // Show loading state if not fully initialized or when about to redirect to credentials.
  if (!isFullyInitialized || (isFullyInitialized && !requireLoginOrUnlock)) {
    // Global loading spinner will be shown by the parent component.
    console.log('Home: not fully initialized');
    return null;
  }

  setIsInitialLoading(false);

  if (!isAuthenticated) {
    console.log('Home: not authenticated');
    return <Login />;
  }

  if (!isDatabaseAvailable) {
    console.log('isFullyInitialized', isFullyInitialized);
    console.log('isAuthenticated', isAuthenticated);
    console.log('isDatabaseAvailable', isDatabaseAvailable);
    console.log('isInlineUnlockMode', isInlineUnlockMode);
    console.log('requireLoginOrUnlock', requireLoginOrUnlock);
    console.log('Home: not database available');
    return <Unlock />;
  }

  if (isInlineUnlockMode) {
    console.log('Home: inline unlock mode');
    return <UnlockSuccess onClose={() => setIsInlineUnlockMode(false)} />;
  }

  return null;
};

export default Home;