declare enum Gender {
    Male = "Male",
    Female = "Female",
    Other = "Other"
}

/**
 * Identity.
 */
type Identity = {
    firstName: string;
    lastName: string;
    gender: Gender;
    birthDate: Date;
    emailPrefix: string;
    nickName: string;
};

/**
 * Generate a username or email prefix.
 */
declare class UsernameEmailGenerator {
    private static readonly MIN_LENGTH;
    private static readonly MAX_LENGTH;
    private readonly symbols;
    /**
     * Generate a username based on an identity.
     */
    generateUsername(identity: Identity): string;
    /**
     * Generate an email prefix based on an identity.
     */
    generateEmailPrefix(identity: Identity): string;
    /**
     * Sanitize an email prefix.
     */
    private sanitizeEmailPrefix;
    /**
     * Get a random symbol.
     */
    private getRandomSymbol;
    /**
     * Generate a random string.
     */
    private generateRandomString;
    /**
     * Generate a secure random integer between 0 (inclusive) and max (exclusive)
     */
    private getSecureRandom;
}

interface IIdentityGenerator {
    generateRandomIdentity(): Identity;
}

/**
 * Base identity generator.
 */
declare abstract class BaseIdentityGenerator implements IIdentityGenerator {
    protected firstNamesMale: string[];
    protected firstNamesFemale: string[];
    protected lastNames: string[];
    private readonly random;
    /**
     * Constructor.
     */
    constructor();
    protected abstract getFirstNamesMaleJson(): string[];
    protected abstract getFirstNamesFemaleJson(): string[];
    protected abstract getLastNamesJson(): string[];
    /**
     * Generate a random date of birth.
     */
    protected generateRandomDateOfBirth(): Date;
    /**
     * Generate a random identity.
     */
    generateRandomIdentity(): Identity;
}

/**
 * Identity generator for English language using English word dictionaries.
 */
declare class IdentityGeneratorEn extends BaseIdentityGenerator {
    /**
     * Get the male first names.
     */
    protected getFirstNamesMaleJson(): string[];
    /**
     * Get the female first names.
     */
    protected getFirstNamesFemaleJson(): string[];
    /**
     * Get the last names.
     */
    protected getLastNamesJson(): string[];
}

/**
 * Identity generator for Dutch language using Dutch word dictionaries.
 */
declare class IdentityGeneratorNl extends BaseIdentityGenerator {
    /**
     * Get the male first names.
     */
    protected getFirstNamesMaleJson(): string[];
    /**
     * Get the female first names.
     */
    protected getFirstNamesFemaleJson(): string[];
    /**
     * Get the last names.
     */
    protected getLastNamesJson(): string[];
}

/**
 * Helper utilities for identity generation that can be used by multiple client applications.
 */
declare class IdentityHelperUtils {
    /**
     * Normalize a birth date for display.
     */
    static normalizeBirthDateForDisplay(birthDate: string | undefined): string;
    /**
     * Normalize a birth date for database.
     */
    static normalizeBirthDateForDb(input: string | undefined): string;
    /**
     * Check if a birth date is valid.
     */
    static isValidBirthDate(input: string | undefined): boolean;
}

/**
 * Creates a new identity generator based on the language.
 * @param language - The language to use for generating the identity (e.g. "en", "nl").
 * @returns A new identity generator instance.
 */
declare const createGenerator: (language: string) => IIdentityGenerator;

export { BaseIdentityGenerator, Gender, type Identity, IdentityGeneratorEn, IdentityGeneratorNl, IdentityHelperUtils, UsernameEmailGenerator, createGenerator };
