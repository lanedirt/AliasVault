import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";
import * as path from 'path';

export class IdentityGeneratorNl extends BaseIdentityGenerator {
  protected getFirstNamesMaleFilePath(): string {
    return path.join(__dirname, 'dictionaries/nl/firstnames_male');
  }

  protected getFirstNamesFemaleFilePath(): string {
    return path.join(__dirname, 'dictionaries/nl/firstnames_female');
  }

  protected getLastNamesFilePath(): string {
    return path.join(__dirname, 'dictionaries/nl/lastnames');
  }
}
