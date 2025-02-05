import { Identity } from "./types/Identity";

/**
 *
 */
export class UsernameEmailGenerator {
  private static readonly MIN_LENGTH = 6;
  private static readonly MAX_LENGTH = 20;
  private readonly symbols: string[] = ['.', '-'];

  /**
   *
   */
  public generateUsername(identity: Identity): string {
    // Generate username based on email prefix but strip all non-alphanumeric characters
    let username = this.generateEmailPrefix(identity);
    username = username.replace(/[^a-zA-Z0-9]/g, '');

    // Adjust length
    if (username.length < UsernameEmailGenerator.MIN_LENGTH) {
      username += this.generateRandomString(UsernameEmailGenerator.MIN_LENGTH - username.length);
    } else if (username.length > UsernameEmailGenerator.MAX_LENGTH) {
      username = username.substring(0, UsernameEmailGenerator.MAX_LENGTH);
    }

    return username;
  }

  /**
   *
   */
  public generateEmailPrefix(identity: Identity): string {
    const parts: string[] = [];

    switch (Math.floor(Math.random() * 4)) {
      case 0:
        // First initial + last name
        parts.push(identity.firstName.substring(0, 1).toLowerCase() + identity.lastName.toLowerCase());
        break;
      case 1:
        // Full name
        parts.push((identity.firstName + identity.lastName).toLowerCase());
        break;
      case 2:
        // First name + last initial
        parts.push(identity.firstName.toLowerCase() + identity.lastName.substring(0, 1).toLowerCase());
        break;
      case 3:
        // First 3 chars of first name + last name
        parts.push(identity.firstName.substring(0, Math.min(3, identity.firstName.length)).toLowerCase() + identity.lastName.toLowerCase());
        break;
    }

    // Add birth year variations
    if (Math.floor(Math.random() * 3) !== 0) {
      switch (Math.floor(Math.random() * 2)) {
        case 0:
          parts.push(identity.birthDate.getFullYear().toString().substring(2));
          break;
        case 1:
          parts.push(identity.birthDate.getFullYear().toString());
          break;
      }
    } else if (Math.floor(Math.random() * 2) === 0) {
      // Add random numbers for more uniqueness
      parts.push((Math.floor(Math.random() * 990) + 10).toString());
    }

    // Join parts with random symbols, possibly multiple
    let emailPrefix = parts.join(this.getRandomSymbol());

    // Add extra random symbol at random position
    if (Math.floor(Math.random() * 2) === 0) {
      const position = Math.floor(Math.random() * emailPrefix.length);
      emailPrefix = emailPrefix.slice(0, position) + this.getRandomSymbol() + emailPrefix.slice(position);
    }

    emailPrefix = this.sanitizeEmailPrefix(emailPrefix);

    // Adjust length
    if (emailPrefix.length < UsernameEmailGenerator.MIN_LENGTH) {
      emailPrefix += this.generateRandomString(UsernameEmailGenerator.MIN_LENGTH - emailPrefix.length);
    } else if (emailPrefix.length > UsernameEmailGenerator.MAX_LENGTH) {
      emailPrefix = emailPrefix.substring(0, UsernameEmailGenerator.MAX_LENGTH);
    }

    return emailPrefix;
  }

  /**
   *
   */
  private sanitizeEmailPrefix(input: string): string {
    // Remove any character that's not a letter, number, dot, underscore, or hyphen including special characters
    let sanitized = input.replace(/[^a-zA-Z0-9._-]/g, '');

    // Remove consecutive dots, underscores, or hyphens
    sanitized = sanitized.replace(/[-_.]{2,}/g, (match) => match[0]);

    // Ensure it doesn't start or end with a dot, underscore, or hyphen
    sanitized = sanitized.replace(/^[-._]+|[-._]+$/g, '');

    return sanitized;
  }

  /**
   *
   */
  private getRandomSymbol(): string {
    return Math.floor(Math.random() * 3) === 0 ? this.symbols[Math.floor(Math.random() * this.symbols.length)] : '';
  }

  /**
   *
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }
}
