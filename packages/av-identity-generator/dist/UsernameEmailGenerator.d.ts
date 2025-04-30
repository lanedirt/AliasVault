import { Identity } from "./types/Identity";
/**
 * Generate a username or email prefix.
 */
export declare class UsernameEmailGenerator {
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
//# sourceMappingURL=UsernameEmailGenerator.d.ts.map