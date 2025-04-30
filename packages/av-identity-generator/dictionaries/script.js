const fs = require('fs');
const path = require('path');

const inputDir = path.resolve(__dirname, 'en'); // adjust this path
const outputDir = inputDir; // overwrite in place, or change if you want to separate

fs.readdirSync(inputDir).forEach((file) => {
  if (file.endsWith('.txt')) {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const items = content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(item => `"${item.replace(/"/g, '\\"')}"`);

    const arrayString = `export default [\n  ${items.join(',\n  ')}\n];\n`;

    const outputFileName = file.replace(/\.txt$/, '.ts');
    const outputPath = path.join(outputDir, outputFileName);

    fs.writeFileSync(outputPath, arrayString, 'utf-8');

    console.log(`✅ Converted ${file} → ${outputFileName}`);
  }
});