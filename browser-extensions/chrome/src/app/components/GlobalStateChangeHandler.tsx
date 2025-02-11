import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Global state change handler component which listens for global state changes and e.g. redirects user to login
 * page if login state changes.
 */
const GlobalStateChangeHandler: React.FC = () => {
  const authContext = useAuth();
  const navigate = useNavigate();

  /**
   * Listen for auth logged in changes and redirect to home page if logged in state changes to handle logins and logouts.
   */
  useEffect(() => {
    navigate('/');
  }, [authContext.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default GlobalStateChangeHandler;