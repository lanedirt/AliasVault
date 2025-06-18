import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage } from 'webext-bridge/popup';

import { storage } from '#imports';

const LAST_VISITED_PAGE_KEY = 'session:lastVisitedPage';
const LAST_VISITED_TIME_KEY = 'session:lastVisitedTime';
const PAGE_MEMORY_DURATION = 120 * 1000; // 2 minutes in milliseconds

type NavigationContextType = {
  storeCurrentPage: () => Promise<void>;
  restoreLastPage: () => Promise<void>;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Navigation provider component that handles storing and restoring the last visited page.
 */
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Store the current page path and timestamp in storage.
   */
  const storeCurrentPage = useCallback(async (): Promise<void> => {
    await storage.setItem(LAST_VISITED_PAGE_KEY, location.pathname);
    await storage.setItem(LAST_VISITED_TIME_KEY, Date.now());
  }, [location.pathname]);

  /**
   * Restore the last visited page if it was visited within the memory duration.
   */
  const restoreLastPage = useCallback(async (): Promise<void> => {
    const lastPage = await storage.getItem(LAST_VISITED_PAGE_KEY) as string;
    const lastVisitTime = await storage.getItem(LAST_VISITED_TIME_KEY) as number;

    if (lastPage && lastVisitTime) {
      const timeSinceLastVisit = Date.now() - lastVisitTime;
      if (timeSinceLastVisit <= PAGE_MEMORY_DURATION) {
        navigate(lastPage);
      } else {
        // Duration has expired, clear the last visited page and time.
        await storage.removeItem(LAST_VISITED_PAGE_KEY);
        await storage.removeItem(LAST_VISITED_TIME_KEY);

        // Clear persisted form values if they exist.
        await sendMessage('CLEAR_PERSISTED_FORM_VALUES', null, 'background');
      }
    }
  }, [navigate]);

  // Store the current page whenever it changes
  useEffect(() => {
    if (isInitialized) {
      storeCurrentPage();
    }
  }, [location.pathname, isInitialized, storeCurrentPage]);

  // Restore the last page on initial load
  useEffect(() => {
    if (!isInitialized) {
      restoreLastPage();
      setIsInitialized(true);
    }
  }, [isInitialized, restoreLastPage]);

  const contextValue = useMemo(() => ({
    storeCurrentPage,
    restoreLastPage
  }), [storeCurrentPage, restoreLastPage]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to access the navigation context.
 * @returns The navigation context
 */
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
