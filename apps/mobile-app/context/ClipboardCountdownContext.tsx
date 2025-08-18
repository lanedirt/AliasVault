import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

type ClipboardCountdownContextType = {
  activeFieldId: string | null;
  setActiveField: (fieldId: string | null | ((prev: string | null) => string | null)) => void;
}

const ClipboardCountdownContext = createContext<ClipboardCountdownContextType | undefined>(undefined);

/**
 * Clipboard countdown context provider.
 */
export const ClipboardCountdownProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const setActiveField = useCallback((fieldId: string | null | ((prev: string | null) => string | null)) => {
    if (typeof fieldId === 'function') {
      setActiveFieldId(fieldId);
    } else {
      setActiveFieldId(fieldId);
    }
  }, []);

  const value = useMemo(() => ({ activeFieldId, setActiveField }), [activeFieldId, setActiveField]);

  return (
    <ClipboardCountdownContext.Provider value={value}>
      {children}
    </ClipboardCountdownContext.Provider>
  );
};

/**
 * Clipboard countdown context hook.
 */
export const useClipboardCountdown = (): ClipboardCountdownContextType => {
  const context = useContext(ClipboardCountdownContext);
  if (!context) {
    throw new Error('useClipboardCountdown must be used within ClipboardCountdownProvider');
  }
  return context;
};
