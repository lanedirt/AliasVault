import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/entrypoints/popup/context/AuthContext';

/**
 * Global state change handler component which listens for global state changes and e.g. redirects user to login
 * page if login state changes.
 */
const GlobalStateChangeHandler: React.FC = () => {
  const authContext = useAuth();
  const navigate = useNavigate();
  const lastLoginState = useRef(authContext.isLoggedIn);
  const initialRender = useRef(true);

  /**
   * Listen for auth logged in changes and redirect to home page if logged in state changes to handle logins and logouts.
   */
  useEffect(() => {
    // Only navigate when auth state is different from the last state we acted on.
    if (lastLoginState.current !== authContext.isLoggedIn) {
      lastLoginState.current = authContext.isLoggedIn;

      /**
       * Skip the first auth state change to avoid redirecting when popup opens for the first time
       * which already causes the auth state to change from false to true.
       */
      if (initialRender.current) {
        initialRender.current = false;
        return;
      }

      // Redirect to home page if logged in state changes.
      navigate('/');
    }
  }, [authContext.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default GlobalStateChangeHandler;