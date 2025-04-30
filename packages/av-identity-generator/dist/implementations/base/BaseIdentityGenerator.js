import { UsernameEmailGenerator } from '../../UsernameEmailGenerator';
import { Gender } from '../../types/Gender';
/**
 * Base identity generator.
 */
export class BaseIdentityGenerator {
    /**
     * Constructor.
     */
    constructor() {
        this.firstNamesMale = [];
        this.firstNamesFemale = [];
        this.lastNames = [];
        this.random = Math.random;
        // Each implementing class should provide these as static JSON strings
        this.firstNamesMale = this.getFirstNamesMaleJson();
        this.firstNamesFemale = this.getFirstNamesFemaleJson();
        this.lastNames = this.getLastNamesJson();
    }
    /**
     * Generate a random date of birth.
     */
    generateRandomDateOfBirth() {
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
    async generateRandomIdentity() {
        const identity = {
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
        }
        else {
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
