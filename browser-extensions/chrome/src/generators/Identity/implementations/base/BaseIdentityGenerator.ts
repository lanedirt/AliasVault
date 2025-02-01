import { UsernameEmailGenerator } from '../../UsernameEmailGenerator';
import { Gender } from '../../types/Gender';
import { IIdentityGenerator } from '../../interfaces/IIdentityGenerator';
import { Identity } from '../../types/Identity';
import * as fs from 'fs';

export abstract class BaseIdentityGenerator implements IIdentityGenerator {
  private firstNamesMale: string[] = [];
  private firstNamesFemale: string[] = [];
  private lastNames: string[] = [];
  private random = Math.random;

  constructor() {
    this.loadNameLists();
  }

  // Methods to be overridden by implementations to specify file paths
  protected abstract getFirstNamesMaleFilePath(): string;
  protected abstract getFirstNamesFemaleFilePath(): string;
  protected abstract getLastNamesFilePath(): string;

  private loadNameLists(): void {
    try {
      // Load male first names
      const maleNamesPath = this.getFirstNamesMaleFilePath();
      const maleNamesContent = fs.readFileSync(maleNamesPath, 'utf8');
      this.firstNamesMale = maleNamesContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Load female first names
      const femaleNamesPath = this.getFirstNamesFemaleFilePath();
      const femaleNamesContent = fs.readFileSync(femaleNamesPath, 'utf8');
      this.firstNamesFemale = femaleNamesContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Load last names
      const lastNamesPath = this.getLastNamesFilePath();
      const lastNamesContent = fs.readFileSync(lastNamesPath, 'utf8');
      this.lastNames = lastNamesContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } catch (error) {
      throw new Error(`Failed to load name lists: ${error.message}`);
    }
  }

  protected generateRandomDateOfBirth(): Date {
    const today = new Date();
    const minAge = 21;
    const maxAge = 65;

    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());

    const timestamp = minDate.getTime() + (this.random() * (maxDate.getTime() - minDate.getTime()));
    return new Date(timestamp);
  }

  async generateRandomIdentity(): Promise<Identity> {
    const identity: Identity = {
      firstName: '',
      lastName: '',
      gender: Gender.Male,
      birthDate: new Date(),
      emailPrefix: '',
      nickName: ''
    };

    // Determine gender
    if (this.random() < 0.5) {
      identity.firstName = this.firstNamesMale[Math.floor(this.random() * this.firstNamesMale.length)];
      identity.gender = Gender.Male;
    } else {
      identity.firstName = this.firstNamesFemale[Math.floor(this.random() * this.firstNamesFemale.length)];
      identity.gender = Gender.Female;
    }

    identity.lastName = this.lastNames[Math.floor(this.random() * this.lastNames.length)];
    identity.birthDate = this.generateRandomDateOfBirth();

    const generator = new UsernameEmailGenerator();
    identity.emailPrefix = generator.generateEmailPrefix(identity);
    identity.nickName = generator.generateUsername(identity);

    return identity;
  }
}