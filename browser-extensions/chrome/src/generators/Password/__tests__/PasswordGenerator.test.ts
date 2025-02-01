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
        expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // special
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
        expect(password).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });

    it('generates different passwords on subsequent calls', () => {
        const password1 = generator.generateRandomPassword();
        const password2 = generator.generateRandomPassword();
        expect(password1).not.toBe(password2);
    });

    it('handles minimum character requirements', () => {
        // Generate multiple passwords to ensure consistency
        for (let i = 0; i < 100; i++) {
            const password = generator.generateRandomPassword();

            // Each password should contain at least one character from each enabled set
            expect(password).toMatch(/[a-z]/);
            expect(password).toMatch(/[A-Z]/);
            expect(password).toMatch(/[0-9]/);
            expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
        }
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