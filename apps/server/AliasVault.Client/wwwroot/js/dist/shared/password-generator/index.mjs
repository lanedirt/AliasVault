// <auto-generated>
// This file was automatically generated. Do not edit manually.


// src/utils/PasswordGenerator.ts
var PasswordGenerator = class {
  /**
   * Create a new instance of PasswordGenerator.
   * @param settings Optional password settings to initialize with.
   */
  constructor(settings) {
    this.lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    this.uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.numberChars = "0123456789";
    this.specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    this.ambiguousChars = "Il1O0o";
    this.length = 18;
    this.useLowercase = true;
    this.useUppercase = true;
    this.useNumbers = true;
    this.useSpecial = true;
    this.useNonAmbiguous = false;
    if (settings) {
      this.applySettings(settings);
    }
  }
  /**
   * Apply password settings to this generator.
   */
  applySettings(settings) {
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
  setLength(length) {
    this.length = length;
    return this;
  }
  /**
   * Set if lowercase letters should be used.
   */
  useLowercaseLetters(use) {
    this.useLowercase = use;
    return this;
  }
  /**
   * Set if uppercase letters should be used.
   */
  useUppercaseLetters(use) {
    this.useUppercase = use;
    return this;
  }
  /**
   * Set if numeric characters should be used.
   */
  useNumericCharacters(use) {
    this.useNumbers = use;
    return this;
  }
  /**
   * Set if special characters should be used.
   */
  useSpecialCharacters(use) {
    this.useSpecial = use;
    return this;
  }
  /**
   * Set if only non-ambiguous characters should be used.
   */
  useNonAmbiguousCharacters(use) {
    this.useNonAmbiguous = use;
    return this;
  }
  /**
   * Get a random index from the crypto module.
   */
  getUnbiasedRandomIndex(max) {
    const limit = Math.floor(2 ** 32 / max) * max;
    while (true) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const value = array[0];
      if (value < limit) {
        return value % max;
      }
    }
  }
  /**
   * Generate a random password.
   */
  generateRandomPassword() {
    const chars = this.buildCharacterSet();
    let password = this.generateInitialPassword(chars);
    password = this.ensureRequirements(password);
    return password;
  }
  /**
   * Build character set based on selected options.
   */
  buildCharacterSet() {
    let chars = "";
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
    if (chars.length === 0) {
      chars = this.lowercaseChars;
    }
    if (this.useNonAmbiguous) {
      chars = this.removeAmbiguousCharacters(chars);
    }
    return chars;
  }
  /**
   * Remove ambiguous characters from a character set.
   */
  removeAmbiguousCharacters(chars) {
    for (const ambChar of this.ambiguousChars) {
      chars = chars.replace(ambChar, "");
    }
    return chars;
  }
  /**
   * Generate initial random password.
   */
  generateInitialPassword(chars) {
    let password = "";
    for (let i = 0; i < this.length; i++) {
      password += chars[this.getUnbiasedRandomIndex(chars.length)];
    }
    return password;
  }
  /**
   * Ensure the generated password meets all specified requirements.
   */
  ensureRequirements(password) {
    if (this.useLowercase && !/[a-z]/.exec(password)) {
      password = this.addCharacterFromSet(
        password,
        this.getSafeCharacterSet(this.lowercaseChars, true)
      );
    }
    if (this.useUppercase && !/[A-Z]/.exec(password)) {
      password = this.addCharacterFromSet(
        password,
        this.getSafeCharacterSet(this.uppercaseChars, true)
      );
    }
    if (this.useNumbers && !/\d/.exec(password)) {
      password = this.addCharacterFromSet(
        password,
        this.getSafeCharacterSet(this.numberChars, false)
      );
    }
    if (this.useSpecial && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.exec(password)) {
      password = this.addCharacterFromSet(
        password,
        this.specialChars
      );
    }
    return password;
  }
  /**
   * Get a character set with ambiguous characters removed if needed.
   */
  getSafeCharacterSet(charSet, isAlpha) {
    if (!this.useNonAmbiguous) {
      return charSet;
    }
    let safeSet = charSet;
    for (const ambChar of this.ambiguousChars) {
      if (!isAlpha && !/\d/.test(ambChar)) {
        continue;
      }
      let charToRemove = ambChar;
      if (isAlpha) {
        if (charSet === this.lowercaseChars) {
          charToRemove = ambChar.toLowerCase();
        } else {
          charToRemove = ambChar.toUpperCase();
        }
      }
      safeSet = safeSet.replace(charToRemove, "");
    }
    return safeSet;
  }
  /**
   * Add a character from the given set at a random position in the password.
   */
  addCharacterFromSet(password, charSet) {
    const pos = this.getUnbiasedRandomIndex(this.length);
    const char = charSet[this.getUnbiasedRandomIndex(charSet.length)];
    return password.substring(0, pos) + char + password.substring(pos + 1);
  }
};

// src/factories/PasswordGeneratorFactory.ts
var CreatePasswordGenerator = (settings) => {
  return new PasswordGenerator(settings);
};
export {
  CreatePasswordGenerator,
  PasswordGenerator
};
//# sourceMappingURL=index.mjs.map