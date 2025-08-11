/**
 * Custom error class for API authentication-related errors.
 */
export class LocalAuthError extends Error {
  /**
   * Creates a new instance of LocalAuthError.
   *
   * @param message - The error message.
   */
  public constructor(message: string) {
    super(message);
    this.name = 'LocalAuthError';
  }
}
