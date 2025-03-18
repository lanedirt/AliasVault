import { PasswordSettings } from '../../types/PasswordSettings';

/**
 * Generate a random password.
 */
export class PasswordGenerator {
  private readonly lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  private readonly uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly numberChars = '0123456789';
  private readonly specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private readonly ambiguousChars = 'Il1O0';

  private length: number = 18;
  private useLowercase: boolean = true;
  private useUppercase: boolean = true;
  private useNumbers: boolean = true;
  private useSpecial: boolean = true;
  private useNonAmbiguous: boolean = false;

  /**
   * Create a new instance of PasswordGenerator
   * @param settings Optional password settings to initialize with
   */
  public constructor(settings?: PasswordSettings) {
    if (settings) {
      this.applySettings(settings);
    }
  }

  /**
   * Apply password settings to this generator
   */
  public applySettings(settings: PasswordSettings): this {
    this.length = settings.Length;
    this.useLowercase = settings.UseLowercase;
    this.useUppercase = settings.UseUppercase;
    this.useNumbers = settings.UseNumbers;
    this.useSpecial = settings.UseSpecialChars;
    this.useNonAmbiguous = settings.UseNonAmbiguousChars;
    return this;
  }

  /**
   * Set the length of the password.
   */
  public setLength(length: number): this {
    this.length = length;
    return this;
  }

  /**
   * Set if lowercase letters should be used.
   */
  public useLowercaseLetters(use: boolean): this {
    this.useLowercase = use;
    return this;
  }

  /**
   * Set if uppercase letters should be used.
   */
  public useUppercaseLetters(use: boolean): this {
    this.useUppercase = use;
    return this;
  }

  /**
   * Set if numeric characters should be used.
   */
  public useNumericCharacters(use: boolean): this {
    this.useNumbers = use;
    return this;
  }

  /**
   * Set if special characters should be used.
   */
  public useSpecialCharacters(use: boolean): this {
    this.useSpecial = use;
    return this;
  }

  /**
   * Set if only non-ambiguous characters should be used.
   */
  public useNonAmbiguousCharacters(use: boolean): this {
    this.useNonAmbiguous = use;
    return this;
  }

  /**
   * Get a random index from the crypto module.
   */
  private getUnbiasedRandomIndex(max: number): number {
    // Calculate the largest multiple of max that fits within Uint32
    const limit = Math.floor((2 ** 32) / max) * max;

    while (true) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const value = array[0];

      // Reject values that would introduce bias
      if (value < limit) {
        return value % max;
      }
    }
  }

  /**
   * Generate a random password.
   */
  public generateRandomPassword(): string {
    let chars = '';
    let password = '';

    // Build character set based on options
    if (this.useLowercase) {
      chars += this.lowercaseChars;
    }
    if (this.useUppercase) {
      chars += this.uppercaseChars;
    }
    if (this.useNumbers) {
      chars += this.numberChars;
    }
    if (this.useSpecial) {
      chars += this.specialChars;
    }

    // Ensure at least one character set is selected
    if (chars.length === 0) {
      chars = this.lowercaseChars;
    }

    // Remove ambiguous characters if needed
    if (this.useNonAmbiguous) {
      for (const ambChar of this.ambiguousChars) {
        chars = chars.replace(ambChar, '');
      }
    }

    // Generate password
    for (let i = 0; i < this.length; i++) {
      password += chars[this.getUnbiasedRandomIndex(chars.length)];
    }

    // Ensure password contains at least one character from each selected set
    if (this.useLowercase && !/[a-z]/.exec(password)) {
      let lowercaseCharsToUse = this.lowercaseChars;
      if (this.useNonAmbiguous) {
        for (const ambChar of this.ambiguousChars) {
          lowercaseCharsToUse = lowercaseCharsToUse.replace(ambChar.toLowerCase(), '');
        }
      }
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      lowercaseCharsToUse[this.getUnbiasedRandomIndex(lowercaseCharsToUse.length)] +
                      password.substring(pos + 1);
    }
    if (this.useUppercase && !/[A-Z]/.exec(password)) {
      let uppercaseCharsToUse = this.uppercaseChars;
      if (this.useNonAmbiguous) {
        for (const ambChar of this.ambiguousChars) {
          uppercaseCharsToUse = uppercaseCharsToUse.replace(ambChar.toUpperCase(), '');
        }
      }
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      uppercaseCharsToUse[this.getUnbiasedRandomIndex(uppercaseCharsToUse.length)] +
                      password.substring(pos + 1);
    }
    if (this.useNumbers && !/\d/.exec(password)) {
      let numberCharsToUse = this.numberChars;
      if (this.useNonAmbiguous) {
        for (const ambChar of this.ambiguousChars) {
          if (/\d/.test(ambChar)) {
            numberCharsToUse = numberCharsToUse.replace(ambChar, '');
          }
        }
      }
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      numberCharsToUse[this.getUnbiasedRandomIndex(numberCharsToUse.length)] +
                      password.substring(pos + 1);
    }
    if (this.useSpecial && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.exec(password)) {
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      this.specialChars[this.getUnbiasedRandomIndex(this.specialChars.length)] +
                      password.substring(pos + 1);
    }

    return password;
  }
}
