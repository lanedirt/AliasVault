import { useState, useEffect, useCallback, useRef } from 'react';

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
): [boolean, (value: boolean) => void] => {
  const [isLoading, setIsLoading] = useState(initialState);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  const setLoadingState = useCallback((value: boolean) => {
    if (value) {
      // Starting to load
      setIsLoading(true);
      startTimeRef.current = Date.now();
    } else {
      // Finishing loading - ensure minimum duration
      const elapsedTime = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const remainingTime = Math.max(0, minDuration - elapsedTime);

      if (remainingTime === 0) {
        setIsLoading(false);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    }
  }, [minDuration]);

  // Handle initial loading state only once
  useEffect(() => {
    if (initialState) {
      setIsLoading(true);
      startTimeRef.current = Date.now();
    }
  }, []); // Empty dependency array ensures this only runs once

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [isLoading, setLoadingState];
};