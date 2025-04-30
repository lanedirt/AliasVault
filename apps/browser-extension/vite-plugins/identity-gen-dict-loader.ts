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
export default function identityGenDictLoader() {
  return {
    name: 'identity-gen-dict-loader',
    transform(code: string, id: string) {
      // Check if file matches the expected IdentityGenerator filename pattern.
      // This checks for filenames like IdentityGeneratorEn.ts or IdentityGeneratorNl.ts.
      // To add support for other languages, add a new file with the language code that matches the dictionary file langauge code.
      // E.g. for French, add IdentityGeneratorFr.ts and ensure the dictionary files are present in the '/dictionaries/fr' folder.
      const match = id.match(/IdentityGenerator([A-Za-z]{2})\.ts$/);
      if (match) {
        const lang = match[1].toLowerCase();

        // Define paths
        const parentDictPath = path.resolve(__dirname, '..', '..', '..', 'dictionaries');
        const localDictPath = path.resolve(__dirname, '..', 'dictionaries');

        // Ensure local dictionary directory exists
        if (!fs.existsSync(localDictPath)) {
          fs.mkdirSync(localDictPath, { recursive: true });
        }

        // Firefox requires the complete source code when submitting extensions.
        // In our monorepo setup, dictionary files are stored at the root level
        // to be shared across different packages. However, for Firefox submission,
        // we need these dictionaries to be present within the browser-extension
        // directory itself.

        // Therefore, we first check if dictionaries exist in the parent (root) directory
        // and copy them to the local browser-extension directory if found.
        if (fs.existsSync(parentDictPath)) {
          // Recursively copy the entire dictionaries folder
          fs.cpSync(parentDictPath, localDictPath, {
            recursive: true,
            force: true
          });
        } else {
          console.log('No parent dictionaries folder found, using local version instead. This is expected when running the firefox build separately.');
        }

        try {
          // Use local dictionary path for reading files
          const dictionaryPath = path.join(localDictPath, lang);

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

          const placeholderReplacements = [
            {
              pattern: `__FIRSTNAMES_MALE_${lang.toUpperCase()}__`,
              values: firstNamesMale
            },
            {
              pattern: `__FIRSTNAMES_FEMALE_${lang.toUpperCase()}__`,
              values: firstNamesFemale
            },
            {
              pattern: `__LASTNAMES_${lang.toUpperCase()}__`,
              values: lastNames
            }
          ];

          // Perform replacements
          for (const { pattern, values } of placeholderReplacements) {
            const regexPattern = new RegExp("['\"\\`]" + pattern + "['\"\\`]", 'g');
            const replacement = '[' + values.map(name => '"' + name + '"').join(',') + ']';
            code = code.replace(regexPattern, replacement);
          }

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