/**
 * Generate a random password.
 */
export class PasswordGenerator {
  private readonly lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  private readonly uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly numberChars = '0123456789';
  private readonly specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  private length: number = 18;
  private useLowercase: boolean = true;
  private useUppercase: boolean = true;
  private useNumbers: boolean = true;
  private useSpecial: boolean = true;

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
    if (this.useLowercase) chars += this.lowercaseChars;
    if (this.useUppercase) chars += this.uppercaseChars;
    if (this.useNumbers) chars += this.numberChars;
    if (this.useSpecial) chars += this.specialChars;

    // Ensure at least one character set is selected
    if (chars.length === 0) {
      chars = this.lowercaseChars;
    }

    // Generate password
    for (let i = 0; i < this.length; i++) {
      password += chars[this.getUnbiasedRandomIndex(chars.length)];
    }

    // Ensure password contains at least one character from each selected set
    if (this.useLowercase && !/[a-z]/.exec(password)) {
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      this.lowercaseChars[this.getUnbiasedRandomIndex(this.lowercaseChars.length)] +
                      password.substring(pos + 1);
    }
    if (this.useUppercase && !/[A-Z]/.exec(password)) {
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      this.uppercaseChars[this.getUnbiasedRandomIndex(this.uppercaseChars.length)] +
                      password.substring(pos + 1);
    }
    if (this.useNumbers && !/\d/.exec(password)) {
      const pos = this.getUnbiasedRandomIndex(this.length);
      password = password.substring(0, pos) +
                      this.numberChars[this.getUnbiasedRandomIndex(this.numberChars.length)] +
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
