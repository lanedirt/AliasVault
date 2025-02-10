import fs from 'fs';
import path from 'path';

/**
 * Vite plugin to load dictionary files for the identity generator and
 * inject the content into the code during the build process.
 *
 * This allows to keep separate dictionary files for improved maintainability
 * but include the contents in the resulting extension code without needing to bundle
 * the files separately.
 */
export default function dictionaryLoader() {
  return {
    name: 'dictionary-loader',
    transform(code: string, id: string) {
      // Check if file matches the expected IdentityGenerator filename pattern.
      // This checks for filenames like IdentityGeneratorEn.ts or IdentityGeneratorNl.ts.
      // To add support for other languages, add a new file with the language code that matches the dictionary file langauge code.
      // E.g. for French, add IdentityGeneratorFr.ts and ensure the dictionary files are present in the '/dictionaries/fr' folder.
      const match = id.match(/IdentityGenerator([A-Za-z]{2})\.ts$/);
      if (match) {
        const lang = match[1].toLowerCase(); // Extract language code and convert to lowercase
        // Load dictionaries from the repository root 'dictionaries' folder
        const dictionaryPath = path.resolve(__dirname, `../../../dictionaries/${lang}`);

        try {
          // Read dictionary files and clean up entries
          const firstNamesMale = fs.readFileSync(path.join(dictionaryPath, 'firstnames_male'), 'utf-8')
            .split('\n')
            .filter(name => name.trim())
            .map(name => name.trim());

          const firstNamesFemale = fs.readFileSync(path.join(dictionaryPath, 'firstnames_female'), 'utf-8')
            .split('\n')
            .filter(name => name.trim())
            .map(name => name.trim());

          const lastNames = fs.readFileSync(path.join(dictionaryPath, 'lastnames'), 'utf-8')
            .split('\n')
            .filter(name => name.trim())
            .map(name => name.trim());

          // Update placeholder replacements to use dynamic language code
          code = code.replace(
            new RegExp(`['"\`]__FIRSTNAMES_MALE_${lang.toUpperCase()}__['"\`]`, 'g'),
            `[${firstNamesMale.map(name => `"${name}"`).join(',')}]`
          );

          code = code.replace(
            new RegExp(`['"\`]__FIRSTNAMES_FEMALE_${lang.toUpperCase()}__['"\`]`, 'g'),
            `[${firstNamesFemale.map(name => `"${name}"`).join(',')}]`
          );

          code = code.replace(
            new RegExp(`['"\`]__LASTNAMES_${lang.toUpperCase()}__['"\`]`, 'g'),
            `[${lastNames.map(name => `"${name}"`).join(',')}]`
          );

          return {
            code,
            map: null
          };
        } catch (error) {
          console.error(`Error loading dictionary files for ${lang}:`, error);
          return null;
        }
      }
    }
  };
}