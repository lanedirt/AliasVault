import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Unlock from './Unlock';
import Login from './Login';
import UnlockSuccess from './UnlockSuccess';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../context/DbContext';

const Home: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const authContext = useAuth();
  const dbContext = useDb();
  const navigate = useNavigate();
  const [isInlineUnlockMode, setIsInlineUnlockMode] = useState(false);
  const needsUnlock = (!authContext.isLoggedIn && authContext.isInitialized) || (!dbContext.dbAvailable && dbContext.dbInitialized);

  useEffect(() => {
    if (isLoggedIn && !needsUnlock && !isInlineUnlockMode) {
      console.log('navigating to credentials');
      navigate('/credentials', { replace: true });
    }
  }, [isLoggedIn, needsUnlock, isInlineUnlockMode, navigate]);


  if (!isLoggedIn) {
    return <Login />;
  }

  if (needsUnlock) {
    return <Unlock />;
  }

  if (isInlineUnlockMode) {
    console.log('isInlineUnlockMode');
    return <UnlockSuccess onClose={() => setIsInlineUnlockMode(false)} />;
  }

  return null;
};

export default Home;