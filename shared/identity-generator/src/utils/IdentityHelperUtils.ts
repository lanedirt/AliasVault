/**
 * Helper utilities for identity generation that can be used by multiple client applications.
 */
export class IdentityHelperUtils {
  /**
   * Normalize a birth date for display.
   */
  public static normalizeBirthDateForDisplay(birthDate: string | undefined): string {
    if (!birthDate || birthDate.startsWith('0001-01-01')) {
      return '';
    }

    return birthDate.split('T')[0]; // Strip time
  }

  /**
   * Normalize a birth date for database.
   */
  public static normalizeBirthDateForDb(input: string | undefined): string {
    if (!input || input.trim() === '') {
      return '0001-01-01T00:00:00.000Z';
    }

    const trimmed = input.trim();

    // Try to parse the date
    const parsedDate = new Date(trimmed);
    if (isNaN(parsedDate.getTime())) {
      return '0001-01-01T00:00:00.000Z';
    }

    // If input already includes time, return as is (assume it's valid ISO format)
    if (trimmed.includes('T')) {
      return trimmed;
    }

    // If only date was provided (e.g., "1983-08-12"), add default time
    return `${trimmed}T00:00:00.000Z`;
  }

  /**
   * Check if a birth date is valid.
   */
  public static isValidBirthDate(input: string | undefined): boolean {
    if (!input || input.trim() === '') {
      return false;
    }

    const date = new Date(input);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    // Check if the year is valid
    const yearValid = date.getFullYear() > 1 && date.getFullYear() < 9999;
    return yearValid;
  }
}
