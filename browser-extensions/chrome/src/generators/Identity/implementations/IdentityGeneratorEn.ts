import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";

export class IdentityGeneratorEn extends BaseIdentityGenerator {
  protected getFirstNamesMaleJson(): string[] {
    return '__FIRSTNAMES_MALE_EN__';  // This will be replaced by dictionary-loader
  }

  protected getFirstNamesFemaleJson(): string[] {
    return '__FIRSTNAMES_FEMALE_EN__';  // This will be replaced by dictionary-loader
  }

  protected getLastNamesJson(): string[] {
    return '__LASTNAMES_EN__';  // This will be replaced by dictionary-loader
  }
}
