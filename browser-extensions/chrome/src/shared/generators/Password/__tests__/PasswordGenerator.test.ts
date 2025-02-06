import { PasswordGenerator } from '../PasswordGenerator';
import { describe, it, expect, beforeEach } from 'vitest';

describe('PasswordGenerator', () => {
  let generator: PasswordGenerator;

  beforeEach(() => {
    generator = new PasswordGenerator();
  });

  it('generates password with default settings', () => {
    const password = generator.generateRandomPassword();

    // Default length is 18
    expect(password.length).toBe(18);

    // Should contain at least one of each character type by default
    expect(password).toMatch(/[a-z]/);  // lowercase
    expect(password).toMatch(/[A-Z]/);  // uppercase
    expect(password).toMatch(/[0-9]/);  // numbers
    expect(password).toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/); // special
  });

  it('respects custom length setting', () => {
    const customLength = 24;
    const password = generator.setLength(customLength).generateRandomPassword();
    expect(password.length).toBe(customLength);
  });

  it('respects lowercase setting', () => {
    const password = generator.useLowercaseLetters(false).generateRandomPassword();
    expect(password).not.toMatch(/[a-z]/);
  });

  it('respects uppercase setting', () => {
    const password = generator.useUppercaseLetters(false).generateRandomPassword();
    expect(password).not.toMatch(/[A-Z]/);
  });

  it('respects numbers setting', () => {
    const password = generator.useNumericCharacters(false).generateRandomPassword();
    expect(password).not.toMatch(/[0-9]/);
  });

  it('respects special characters setting', () => {
    const password = generator.useSpecialCharacters(false).generateRandomPassword();
    expect(password).not.toMatch(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/);
  });

  it('generates different passwords on subsequent calls', () => {
    const password1 = generator.generateRandomPassword();
    const password2 = generator.generateRandomPassword();
    expect(password1).not.toBe(password2);
  });

  it('handles minimum character requirements', () => {
    let hasLower = false;
    let hasUpper = false;
    let hasNumber = false;
    let hasSpecial = false;

    // Generate 20 passwords and check if at least one contains all required characters
    for (let i = 0; i < 20; i++) {
      const password = generator.generateRandomPassword();

      hasLower = hasLower || /[a-z]/.test(password);
      hasUpper = hasUpper || /[A-Z]/.test(password);
      hasNumber = hasNumber || /[0-9]/.test(password);
      hasSpecial = hasSpecial || /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);

      // Break early if we've found all character types
      if (hasLower && hasUpper && hasNumber && hasSpecial) {
        break;
      }
    }

    // Assert that we found at least one password with each character type
    expect(hasLower).toBe(true);
    expect(hasUpper).toBe(true);
    expect(hasNumber).toBe(true);
    expect(hasSpecial).toBe(true);
  });

  it('falls back to lowercase when all options disabled', () => {
    const password = generator
      .useLowercaseLetters(false)
      .useUppercaseLetters(false)
      .useNumericCharacters(false)
      .useSpecialCharacters(false)
      .generateRandomPassword();

    // Should fall back to lowercase
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('maintains method chaining', () => {
    const result = generator
      .setLength(20)
      .useLowercaseLetters(true)
      .useUppercaseLetters(true)
      .useNumericCharacters(true)
      .useSpecialCharacters(true);

    expect(result).toBe(generator);
  });
});