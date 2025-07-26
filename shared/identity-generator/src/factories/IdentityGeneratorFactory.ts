import { IdentityGenerator } from "src/implementations/base/IdentityGenerator";
import { IdentityGeneratorEn } from "src/implementations/IdentityGeneratorEn";
import { IdentityGeneratorNl } from "src/implementations/IdentityGeneratorNl";

/**
 * Creates a new identity generator based on the language.
 * @param language - The language to use for generating the identity (e.g. "en", "nl").
 * @returns A new identity generator instance.
 */
export const CreateIdentityGenerator = (language: string): IdentityGenerator => {
  switch (language) {
    case 'en':
      return new IdentityGeneratorEn();
    case 'nl':
      return new IdentityGeneratorNl();
  }

  throw new Error(`Unsupported language: ${language}`);
};
