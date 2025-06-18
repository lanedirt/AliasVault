import React from 'react';
import { Navigate } from 'react-router-dom';

import { useNavigation } from '@/entrypoints/popup/context/NavigationContext';

/**
 * Home page that shows the correct page based on the user's authentication state.
 * Most of the navigation logic is now handled by NavigationContext.
 */
const Home: React.FC = () => {
  const { isFullyInitialized } = useNavigation();

  if (!isFullyInitialized) {
    return null;
  }

  return <Navigate to="/credentials" replace />;
};

export default Home;