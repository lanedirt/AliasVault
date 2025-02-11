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
  const { isLoggedIn } = useAuth();
  const authContext = useAuth();
  const dbContext = useDb();
  const navigate = useNavigate();
  const { setIsInitialLoading } = useLoading();
  const [isInlineUnlockMode, setIsInlineUnlockMode] = useState(false);
  const needsUnlock = (!authContext.isLoggedIn && authContext.isInitialized) || (!dbContext.dbAvailable && dbContext.dbInitialized);

  useEffect(() => {
    // Detect if the user is coming from the unlock page with mode=inline_unlock
    const urlParams = new URLSearchParams(window.location.search);
    const isInlineUnlockMode = urlParams.get('mode') === 'inline_unlock';
    setIsInlineUnlockMode(isInlineUnlockMode);

    if (isLoggedIn && !needsUnlock && !isInlineUnlockMode) {
      navigate('/credentials', { replace: true });
    }
  }, [isLoggedIn, needsUnlock, isInlineUnlockMode, navigate]);

  // Set initial loading state to false once the page is loaded until here.
  setIsInitialLoading(false);

  if (!isLoggedIn) {
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