import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";

export class IdentityGeneratorNl extends BaseIdentityGenerator {
  protected getFirstNamesMaleJson(): string[] {
    return '__FIRSTNAMES_MALE_NL__';  // This will be replaced by dictionary-loader
  }

  protected getFirstNamesFemaleJson(): string[]  {
    return '__FIRSTNAMES_FEMALE_NL__';  // This will be replaced by dictionary-loader
  }

  protected getLastNamesJson(): string[] {
    return '__LASTNAMES_NL__';  // This will be replaced by dictionary-loader
  }
}
