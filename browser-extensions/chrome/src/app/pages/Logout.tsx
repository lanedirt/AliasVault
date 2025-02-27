import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Logout page.
 */
const Logout: React.FC = () => {
  const authContext = useAuth();
  const navigate = useNavigate();

  /**
   * Logout and navigate to home page.
   */
  useEffect(() => {
    /**
     * Perform logout via async method to ensure logout is completed before navigating to home page.
     */
    const performLogout = async () : Promise<void> => {
      await authContext.logout();
      navigate('/');
    };

    performLogout();
  }, [authContext, navigate]);

  // Return null since this is just a functional component that handles logout.
  return null;
};

export default Logout;
