import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";
import * as path from 'path';

export class IdentityGeneratorEn extends BaseIdentityGenerator {
  protected getFirstNamesMaleFilePath(): string {
    return path.join(__dirname, 'dictionaries/en/firstnames_male');
  }

  protected getFirstNamesFemaleFilePath(): string {
    return path.join(__dirname, 'dictionaries/en/firstnames_female');
  }

  protected getLastNamesFilePath(): string {
    return path.join(__dirname, 'dictionaries/en/lastnames');
  }
}
