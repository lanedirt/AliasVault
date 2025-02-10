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
   * Listen for auth logged in changes and redirect to home page if logged in.
   */
  useEffect(() => {
    navigate('/');
  }, [navigate, authContext.isLoggedIn]);

  return null;
};

export default GlobalStateChangeHandler;