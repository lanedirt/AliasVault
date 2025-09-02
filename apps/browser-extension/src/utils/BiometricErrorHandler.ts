import PlatformUtility from '@/utils/PlatformUtility';

/**
 * Error handler for biometric authentication.
 */
export default class BiometricErrorHandler {
  /**
   * Get a user-friendly error message for a biometric authentication error.
   * 
   * @param error The error object
   * @returns A user-friendly error message
   */
  public static getErrorMessage(error: unknown): string {
    if (!error) {
      return 'An unknown error occurred during biometric authentication.';
    }

    const biometricName = PlatformUtility.getBiometricDisplayName();

    // Handle DOMException errors
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'AbortError':
          return `${biometricName} authentication was cancelled.`;
        case 'NotAllowedError':
          return `${biometricName} authentication was not allowed. This could be due to too many failed attempts.`;
        case 'NotSupportedError':
          return `${biometricName} is not supported on this device.`;
        case 'SecurityError':
          return `${biometricName} authentication failed due to a security error.`;
        default:
          return `${biometricName} authentication failed: ${error.message}`;
      }
    }

    // Handle Error objects
    if (error instanceof Error) {
      if (error.message.includes('user verification')) {
        return `${biometricName} verification failed. Please try again.`;
      }
      
      if (error.message.includes('timeout')) {
        return `${biometricName} authentication timed out. Please try again.`;
      }
      
      return `${biometricName} authentication failed: ${error.message}`;
    }

    // Handle string errors
    if (typeof error === 'string') {
      return `${biometricName} authentication failed: ${error}`;
    }

    // Default error message
    return `${biometricName} authentication failed. Please try again or use your password.`;
  }

  /**
   * Check if an error is a user cancellation.
   * 
   * @param error The error object
   * @returns True if the error is a user cancellation, false otherwise
   */
  public static isUserCancellation(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return true;
    }

    if (error instanceof Error && error.message.includes('user cancelled')) {
      return true;
    }

    return false;
  }

  /**
   * Check if an error indicates that biometric authentication is not available.
   * 
   * @param error The error object
   * @returns True if the error indicates that biometric authentication is not available, false otherwise
   */
  public static isBiometricUnavailable(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'NotSupportedError') {
      return true;
    }

    if (error instanceof Error && (
      error.message.includes('not supported') || 
      error.message.includes('not available')
    )) {
      return true;
    }

    return false;
  }
}

