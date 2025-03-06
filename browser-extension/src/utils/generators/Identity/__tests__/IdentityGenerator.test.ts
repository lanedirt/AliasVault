import { IdentityGeneratorEn } from '../implementations/IdentityGeneratorEn';
import { IdentityGeneratorNl } from '../implementations/IdentityGeneratorNl';
import { describe, it, expect } from 'vitest';
import { IIdentityGenerator } from '../interfaces/IIdentityGenerator';
import { Gender } from '../types/Gender';
/**
 * Test the identity generator.
 */
const testIdentityGenerator = (
  language: string,
  generator: IIdentityGenerator
) : void => {
  describe(`IdentityGenerator${language}`, () => {
    describe('generateRandomIdentity', () => {
      it('should generate a random gender identity when no gender is specified', async () => {
        const identity = await generator.generateRandomIdentity();

        expect(identity).toBeDefined();
        expect(identity.firstName).toBeTruthy();
        expect(identity.lastName).toBeTruthy();
        expect([Gender.Male, Gender.Female]).toContain(identity.gender);
      });

      it('should generate unique identities on subsequent calls', async () => {
        const identity1 = await generator.generateRandomIdentity();
        const identity2 = await generator.generateRandomIdentity();

        expect(identity1).not.toEqual(identity2);
      });

      it('should generate an identity with all non-empty fields', async () => {
        const identity = await generator.generateRandomIdentity();

        Object.entries(identity).forEach(([, value]) => {
          expect(value).toBeTruthy();
          expect(value).not.toBe('');
          expect(value).not.toBeNull();
          expect(value).not.toBeUndefined();
        });

        // Add length checks for first and last names
        expect(identity.firstName.length).toBeGreaterThan(1);
        expect(identity.lastName.length).toBeGreaterThan(1);
      });
    });
  });
};

// Run tests for each language implementation
describe('Identity Generators', () => {
  testIdentityGenerator('En', new IdentityGeneratorEn());
  testIdentityGenerator('Nl', new IdentityGeneratorNl());
});