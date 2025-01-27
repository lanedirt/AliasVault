import { useState, useEffect } from 'react';

/**
 * Hook that ensures a loading state persists for a minimum duration before being set to false.
 * This improves the user experience by preventing the loading state from flickering.
 *
 * @param initialState - Initial loading state
 * @param minDuration - Minimum duration in milliseconds
 * @returns [isLoading, setIsLoading] - Loading state and setter
 */
export const useMinDurationLoading = (
  initialState: boolean = false,
  minDuration: number = 300
): [boolean, (loading: boolean) => void] => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [internalLoading, setInternalLoading] = useState(initialState);

  useEffect(() => {
    if (internalLoading) {
      setIsLoading(true);
      setLoadingStartTime(Date.now());
    } else if (loadingStartTime) {
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minDuration - elapsedTime);

      if (remainingTime === 0) {
        setIsLoading(false);
      } else {
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    }
  }, [internalLoading, loadingStartTime, minDuration]);

  return [isLoading, setInternalLoading];
};