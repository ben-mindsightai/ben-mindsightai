const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Directory paths
const opsDataDir = __dirname;
const seedFilePath = path.join(opsDataDir, 'seed.csv');
const pdfsDir = path.join(opsDataDir, 'Patent Specifications', 'PDFs');

// Read the CSV file and extract patent numbers
function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  return records.map(record => record['Key Patent Number']);
}

// Count the number of unique patent numbers in the seed CSV file
const seedPatents = readCSV(seedFilePath);
const uniqueSeedPatents = [...new Set(seedPatents)];
console.log(`Total unique patent numbers in seed CSV: ${uniqueSeedPatents.length}`);

// Count the number of downloaded PDF files
const downloadedFiles = fs.readdirSync(pdfsDir).filter(file => file.endsWith('.pdf'));
console.log(`Total downloaded PDF files: ${downloadedFiles.length}`);

// Compare the counts
if (uniqueSeedPatents.length === downloadedFiles.length) {
  console.log('All patents from the seed CSV file were downloaded successfully.');
} else {
  console.log(`Some patents were not downloaded. Missing count: ${uniqueSeedPatents.length - downloadedFiles.length}`);
}