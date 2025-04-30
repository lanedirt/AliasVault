/**
 * Generate a username or email prefix.
 */
export class UsernameEmailGenerator {
    constructor() {
        this.symbols = ['.', '-'];
    }
    /**
     * Generate a username based on an identity.
     */
    generateUsername(identity) {
        // Generate username based on email prefix but strip all non-alphanumeric characters
        let username = this.generateEmailPrefix(identity);
        username = username.replace(/[^a-zA-Z0-9]/g, '');
        // Adjust length
        if (username.length < UsernameEmailGenerator.MIN_LENGTH) {
            username += this.generateRandomString(UsernameEmailGenerator.MIN_LENGTH - username.length);
        }
        else if (username.length > UsernameEmailGenerator.MAX_LENGTH) {
            username = username.substring(0, UsernameEmailGenerator.MAX_LENGTH);
        }
        return username;
    }
    /**
     * Generate an email prefix based on an identity.
     */
    generateEmailPrefix(identity) {
        const parts = [];
        switch (this.getSecureRandom(4)) {
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
        if (this.getSecureRandom(3) !== 0) {
            switch (this.getSecureRandom(2)) {
                case 0:
                    parts.push(identity.birthDate.getFullYear().toString().substring(2));
                    break;
                case 1:
                    parts.push(identity.birthDate.getFullYear().toString());
                    break;
            }
        }
        else if (this.getSecureRandom(2) === 0) {
            // Add random numbers for more uniqueness
            parts.push((this.getSecureRandom(990) + 10).toString());
        }
        // Join parts with random symbols, possibly multiple
        let emailPrefix = parts.join(this.getRandomSymbol());
        // Add extra random symbol at random position
        if (this.getSecureRandom(2) === 0) {
            const position = this.getSecureRandom(emailPrefix.length);
            emailPrefix = emailPrefix.slice(0, position) + this.getRandomSymbol() + emailPrefix.slice(position);
        }
        emailPrefix = this.sanitizeEmailPrefix(emailPrefix);
        // Adjust length
        if (emailPrefix.length < UsernameEmailGenerator.MIN_LENGTH) {
            emailPrefix += this.generateRandomString(UsernameEmailGenerator.MIN_LENGTH - emailPrefix.length);
        }
        else if (emailPrefix.length > UsernameEmailGenerator.MAX_LENGTH) {
            emailPrefix = emailPrefix.substring(0, UsernameEmailGenerator.MAX_LENGTH);
        }
        return emailPrefix;
    }
    /**
     * Sanitize an email prefix.
     */
    sanitizeEmailPrefix(input) {
        // Remove any character that's not a letter, number, dot, underscore, or hyphen including special characters
        let sanitized = input.replace(/[^a-zA-Z0-9._-]/g, '');
        // Remove consecutive dots, underscores, or hyphens
        sanitized = sanitized.replace(/[-_.]{2,}/g, (match) => match[0]);
        // Remove leading and trailing dots, underscores, or hyphens
        sanitized = sanitized.replace(/^[-._]+/, ''); // Remove from start
        sanitized = sanitized.replace(/[-._]*$/, ''); // Remove from end
        return sanitized;
    }
    /**
     * Get a random symbol.
     */
    getRandomSymbol() {
        return this.getSecureRandom(3) === 0 ? this.symbols[this.getSecureRandom(this.symbols.length)] : '';
    }
    /**
     * Generate a random string.
     */
    generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars.charAt(this.getSecureRandom(chars.length))).join('');
    }
    /**
     * Generate a secure random integer between 0 (inclusive) and max (exclusive)
     */
    getSecureRandom(max) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    }
}
UsernameEmailGenerator.MIN_LENGTH = 6;
UsernameEmailGenerator.MAX_LENGTH = 20;
