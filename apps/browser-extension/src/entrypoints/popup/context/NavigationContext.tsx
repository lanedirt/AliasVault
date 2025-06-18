import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendMessage } from 'webext-bridge/popup';

import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useLoading } from '@/entrypoints/popup/context/LoadingContext';

import { storage } from '#imports';

const LAST_VISITED_PAGE_KEY = 'session:lastVisitedPage';
const LAST_VISITED_TIME_KEY = 'session:lastVisitedTime';
const NAVIGATION_HISTORY_KEY = 'session:navigationHistory';
const PAGE_MEMORY_DURATION = 120 * 1000; // 2 minutes in milliseconds

type NavigationHistoryEntry = {
  pathname: string;
  search: string;
  hash: string;
};

type NavigationContextType = {
  storeCurrentPage: () => Promise<void>;
  restoreLastPage: () => Promise<void>;
  isFullyInitialized: boolean;
  requiresAuth: boolean;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

/**
 * Navigation provider component that handles storing and restoring the last visited page,
 * as well as managing initialization and auth state redirects.
 */
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInlineUnlockMode, setIsInlineUnlockMode] = useState(false);
  const { setIsInitialLoading } = useLoading();

  // Auth and DB state
  const { isInitialized: authInitialized, isLoggedIn } = useAuth();
  const { dbInitialized, dbAvailable } = useDb();

  // Derived state
  const isFullyInitialized = authInitialized && dbInitialized;
  const requiresAuth = isFullyInitialized && (!isLoggedIn || !dbAvailable || isInlineUnlockMode);

  /**
   * Store the current page path, timestamp, and navigation history in storage.
   */
  const storeCurrentPage = useCallback(async (): Promise<void> => {
    // Pages that are not allowed to be stored as these are auth conditional pages.
    const notAllowedPaths = ['/', '/login', '/unlock', '/unlock-success', '/auth-settings'];

    // Only store the page if we're fully initialized and don't need auth
    if (isFullyInitialized && !requiresAuth && !notAllowedPaths.includes(location.pathname)) {
      // Get the current history entries from the session history
      const historyEntries: NavigationHistoryEntry[] = [];
      if (window.history.state?.usr?.history) {
        historyEntries.push(...window.history.state.usr.history);
      }
      // Add current location if not already in history
      const currentEntry = {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      };
      if (!historyEntries.some(entry => entry.pathname === currentEntry.pathname)) {
        historyEntries.push(currentEntry);
      }

      await Promise.all([
        storage.setItem(LAST_VISITED_PAGE_KEY, location.pathname),
        storage.setItem(LAST_VISITED_TIME_KEY, Date.now()),
        storage.setItem(NAVIGATION_HISTORY_KEY, historyEntries),
      ]);
    }
  }, [location, isFullyInitialized, requiresAuth]);

  /**
   * Restore the last visited page and navigation history if it was visited within the memory duration.
   */
  const restoreLastPage = useCallback(async (): Promise<void> => {
    // Only restore if we're fully initialized and don't need auth
    if (!isFullyInitialized || requiresAuth) {
      return;
    }

    const [lastPage, lastVisitTime, savedHistory] = await Promise.all([
      storage.getItem(LAST_VISITED_PAGE_KEY) as Promise<string>,
      storage.getItem(LAST_VISITED_TIME_KEY) as Promise<number>,
      storage.getItem(NAVIGATION_HISTORY_KEY) as Promise<NavigationHistoryEntry[]>,
    ]);

    if (lastPage && lastVisitTime) {
      const timeSinceLastVisit = Date.now() - lastVisitTime;
      if (timeSinceLastVisit <= PAGE_MEMORY_DURATION) {
        // Restore the navigation history
        if (savedHistory?.length) {
          // First navigate to credentials page as the base
          navigate('/credentials', { replace: true });

          // Then restore the history stack
          for (const entry of savedHistory) {
            navigate(entry.pathname + entry.search + entry.hash);
          }
          return;
        }

        // Fallback to simple navigation if no history
        navigate('/credentials', { replace: true });
        navigate(lastPage, { replace: true });
        return;
      }
    }

    // Duration has expired, clear all stored navigation data
    await Promise.all([
      storage.removeItem(LAST_VISITED_PAGE_KEY),
      storage.removeItem(LAST_VISITED_TIME_KEY),
      storage.removeItem(NAVIGATION_HISTORY_KEY),
      sendMessage('CLEAR_PERSISTED_FORM_VALUES', null, 'background'),
    ]);

    // Navigate to the credentials page as default entry page.
    navigate('/credentials', { replace: true });
  }, [navigate, isFullyInitialized, requiresAuth]);

  // Handle initialization and auth state changes
  useEffect(() => {
    // Check for inline unlock mode
    const urlParams = new URLSearchParams(window.location.search);
    const inlineUnlock = urlParams.get('mode') === 'inline_unlock';
    setIsInlineUnlockMode(inlineUnlock);

    if (isFullyInitialized) {
      setIsInitialLoading(false);

      if (requiresAuth) {
        const allowedPaths = ['/login', '/unlock', '/unlock-success', '/auth-settings'];
        if (allowedPaths.includes(location.pathname)) {
          // Do not override the navigation if the current path is in the allowed paths.
          return;
        }

        // Determine which auth page to show
        if (!isLoggedIn) {
          navigate('/login', { replace: true });
        } else if (!dbAvailable) {
          navigate('/unlock', { replace: true });
        } else if (inlineUnlock) {
          navigate('/unlock-success', { replace: true });
        }
      } else if (!isInitialized) {
        // First initialization, try to restore last page or go to credentials
        restoreLastPage().then(() => {
          setIsInitialized(true);
        });
      }
    }
  }, [isFullyInitialized, requiresAuth, isLoggedIn, dbAvailable, isInitialized, navigate, restoreLastPage, setIsInitialLoading, location.pathname]);

  // Store the current page whenever it changes
  useEffect(() => {
    if (isInitialized) {
      storeCurrentPage();
    }
  }, [location.pathname, isInitialized, storeCurrentPage]);

  const contextValue = useMemo(() => ({
    storeCurrentPage,
    restoreLastPage,
    isFullyInitialized,
    requiresAuth
  }), [storeCurrentPage, restoreLastPage, isFullyInitialized, requiresAuth]);

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
