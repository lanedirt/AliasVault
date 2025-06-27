import { UsernameEmailGenerator } from '../../utils/UsernameEmailGenerator';
import { Gender } from '../../types/Gender';
import { IIdentityGenerator } from '../../interfaces/IIdentityGenerator';
import { Identity } from '../../types/Identity';

/**
 * Base identity generator.
 */
export abstract class IdentityGenerator implements IIdentityGenerator {
  protected firstNamesMale: string[] = [];
  protected firstNamesFemale: string[] = [];
  protected lastNames: string[] = [];
  private readonly random = Math.random;

  /**
   * Constructor.
   */
  public constructor() {
    // Each implementing class should provide these as static JSON strings
    this.firstNamesMale = this.getFirstNamesMaleJson();
    this.firstNamesFemale = this.getFirstNamesFemaleJson();
    this.lastNames = this.getLastNamesJson();
  }

  protected abstract getFirstNamesMaleJson(): string[];
  protected abstract getFirstNamesFemaleJson(): string[];
  protected abstract getLastNamesJson(): string[];

  /**
   * Generate a random date of birth.
   */
  protected generateRandomDateOfBirth(): Date {
    const today = new Date();
    const minAge = 21;
    const maxAge = 65;

    const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());

    const timestamp = minDate.getTime() + (this.random() * (maxDate.getTime() - minDate.getTime()));
    return new Date(timestamp);
  }

  /**
   * Generate a random identity.
   */
  public generateRandomIdentity(gender?: string | 'random'): Identity {
    const identity: Identity = {
      firstName: '',
      lastName: '',
      gender: Gender.Male,
      birthDate: new Date(),
      emailPrefix: '',
      nickName: ''
    };

    // Determine gender
    let selectedGender: Gender;
    if (gender === 'random' || gender === undefined) {
      // Random selection (default behavior)
      selectedGender = this.random() < 0.5 ? Gender.Male : Gender.Female;
    } else {
      // Use specified gender
      if (gender === 'male') {
        selectedGender = Gender.Male;
      } else if (gender === 'female') {
        selectedGender = Gender.Female;
      } else {
        selectedGender = Gender.Male;
      }
    }

    // Set gender and appropriate first name
    identity.gender = selectedGender;
    if (selectedGender === Gender.Male) {
      identity.firstName = this.firstNamesMale[Math.floor(this.random() * this.firstNamesMale.length)];
    } else if (selectedGender === Gender.Female) {
      identity.firstName = this.firstNamesFemale[Math.floor(this.random() * this.firstNamesFemale.length)];
    } else {
      // For Gender.Other, randomly choose from either list
      const usesMaleNames = this.random() < 0.5;
      identity.firstName = usesMaleNames
        ? this.firstNamesMale[Math.floor(this.random() * this.firstNamesMale.length)]
        : this.firstNamesFemale[Math.floor(this.random() * this.firstNamesFemale.length)];
    }

    identity.lastName = this.lastNames[Math.floor(this.random() * this.lastNames.length)];
    identity.birthDate = this.generateRandomDateOfBirth();

    const generator = new UsernameEmailGenerator();
    identity.emailPrefix = generator.generateEmailPrefix(identity);
    identity.nickName = generator.generateUsername(identity);

    return identity;
  }
}