import React, { createContext, useContext, useState, useMemo } from 'react';
import LoadingSpinnerFullScreen from '@/entrypoints/popup/components/LoadingSpinnerFullScreen';

type LoadingContextType = {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
  isInitialLoading: boolean;
  setIsInitialLoading: (isInitialLoading: boolean) => void;
}

/**
 * Loading context.
 */
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Loading provider
 */
export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * Initial loading state for when extension is first loaded. This initial loading state is
   * hidden by the component that is rendered when the extension is first loaded to prevent
   * multiple loading spinners from being shown.
   */
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  /**
   * Loading state that can be used by other components during normal operation.
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Show loading spinner
   */
  const showLoading = (): void => setIsLoading(true);

  /**
   * Hide loading spinner
   */
  const hideLoading = (): void => setIsLoading(false);

  const value = useMemo(
    () => ({
      isLoading,
      showLoading,
      hideLoading,
      isInitialLoading,
      setIsInitialLoading,
    }),
    [isLoading, isInitialLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      <LoadingSpinnerFullScreen />
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * Hook to use loading state
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};