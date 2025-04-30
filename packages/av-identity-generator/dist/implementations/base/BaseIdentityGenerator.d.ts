import { IIdentityGenerator } from '../../interfaces/IIdentityGenerator';
import { Identity } from '../../types/Identity';
/**
 * Base identity generator.
 */
export declare abstract class BaseIdentityGenerator implements IIdentityGenerator {
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
    generateRandomIdentity(): Promise<Identity>;
}
//# sourceMappingURL=BaseIdentityGenerator.d.ts.map