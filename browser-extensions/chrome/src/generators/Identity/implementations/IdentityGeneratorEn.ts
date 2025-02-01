import { BaseIdentityGenerator } from "./base/BaseIdentityGenerator";
import * as path from 'path';

export class IdentityGeneratorEn extends BaseIdentityGenerator {
  protected getFirstNamesMaleFilePath(): string {
    return path.join(__dirname, '../dictionaries/en/firstnames_male.txt');
  }

  protected getFirstNamesFemaleFilePath(): string {
    return path.join(__dirname, '../dictionaries/en/firstnames_female.txt');
  }

  protected getLastNamesFilePath(): string {
    return path.join(__dirname, '../dictionaries/en/lastnames.txt');
  }
}
