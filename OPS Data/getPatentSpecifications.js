const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from API_Key.env file
const envPath = path.resolve(__dirname, 'API_Key.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded:', result.parsed);
  if (result.parsed) {
    if (!process.env) {
      process.env = {};
    }
    process.env.CONSUMER_KEY = result.parsed.CONSUMER_KEY;
    process.env.CONSUMER_SECRET = result.parsed.CONSUMER_SECRET;
  } else {
    console.error('result.parsed is undefined');
  }
}

// Debugging: Print environment variables to verify they are loaded
console.log('process.env:', process.env);
console.log('CONSUMER_KEY:', process.env.CONSUMER_KEY);
console.log('CONSUMER_SECRET:', process.env.CONSUMER_SECRET);

// Directory paths
const opsDataDir = __dirname;
const patentSpecificationsDir = path.join(opsDataDir, 'Patent Specifications');
const pdfsDir = path.join(patentSpecificationsDir, 'PDFs');

// Create directories if they don't exist
if (!fs.existsSync(patentSpecificationsDir)) {
  fs.mkdirSync(patentSpecificationsDir, { recursive: true });
  console.log(`Created directory: ${patentSpecificationsDir}`);
} else {
  console.log(`Directory already exists: ${patentSpecificationsDir}`);
}

if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
  console.log(`Created directory: ${pdfsDir}`);
} else {
  console.log(`Directory already exists: ${pdfsDir}`);
}

// Authenticate with OPS to get an access token
async function getAuthToken() {
  const tokenUrl = 'https://ops.epo.org/3.2/auth/accesstoken';
  const consumerKey = process.env.CONSUMER_KEY;
  const secretKey = process.env.CONSUMER_SECRET;

  if (!consumerKey || !secretKey) {
    throw new Error('Missing CONSUMER_KEY or CONSUMER_SECRET in environment variables');
  }

  const credentials = Buffer.from(`${consumerKey}:${secretKey}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: headers,
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Failed to get auth token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

// Fetch the family data for a given patent number
async function getFamilyData(patentNumber, authToken) {
  const url = `https://ops.epo.org/3.2/rest-services/published-data/publication/docdb/${patentNumber}/biblio`;
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  // Debugging: Log the URL and headers
  console.log('Fetching family data with URL:', url);
  console.log('Headers:', headers);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get family data: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching family data for ${patentNumber}:`, error);
    throw error;
  }
}

// Extract patent numbers from family data
function extractPatentNumbers(familyData) {
  const patentNumbers = [];

  if (familyData['ops:world-patent-data'] && familyData['ops:world-patent-data']['exchange-documents'] && familyData['ops:world-patent-data']['exchange-documents']['exchange-document']) {
    const exchangeDocuments = Array.isArray(familyData['ops:world-patent-data']['exchange-documents']['exchange-document'])
      ? familyData['ops:world-patent-data']['exchange-documents']['exchange-document']
      : [familyData['ops:world-patent-data']['exchange-documents']['exchange-document']];
    
    exchangeDocuments.forEach(exchangeDocument => {
      if (exchangeDocument['bibliographic-data'] && exchangeDocument['bibliographic-data']['publication-reference'] && exchangeDocument['bibliographic-data']['publication-reference']['document-id']) {
        exchangeDocument['bibliographic-data']['publication-reference']['document-id'].forEach(docId => {
          if (docId['@document-id-type'] === 'docdb') {
            const patentNumber = `${docId.country.$}/${docId['doc-number'].$}/${docId.kind.$}`;
            patentNumbers.push(patentNumber);
          }
        });
      }
    });
  }

  return patentNumbers;
}

// Make API call to retrieve the patent specification in PDF format
async function getPatentSpecification(patentNumber, authToken, kindCode) {
  const url = `https://ops.epo.org/3.2/rest-services/published-data/images/${patentNumber.split('/')[0]}/${patentNumber.split('/')[1]}/${kindCode}/fullimage?Range=1`;

  // Debugging: Log the URL
  console.log('Fetching patent specification with URL:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get patent specification: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error(`Error fetching patent specification for ${patentNumber} with kind code ${kindCode}:`, error);
    throw error;
  }
}

// Save the PDF file to the specified directory
function savePatentSpecification(patentNumber, pdfBuffer) {
  const filePath = path.join(pdfsDir, `${patentNumber.replace(/\//g, '_')}.pdf`);
  console.log(`Saving PDF to ${filePath}`); // Log the file path
  fs.writeFileSync(filePath, pdfBuffer, { flag: 'w' }); // Overwrite existing file
  console.log(`Patent specification saved to ${filePath}`);
}

// Delay function to avoid hitting rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read the CSV file and extract patent numbers
function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  return records.map(record => record['Key Patent Number']);
}

// Main process function
async function process() {
  const startTime = Date.now(); // Start time for the process
  try {
    const authToken = await getAuthToken();
    console.log('Successfully obtained auth token');

    const seedFilePath = path.join(opsDataDir, 'seed.csv');
    const seedPatents = readCSV(seedFilePath);
    const uniqueSeedPatents = [...new Set(seedPatents)];

    console.log(`Total unique patent numbers in seed CSV: ${uniqueSeedPatents.length}`);

    let downloadedCount = 0;
    const failedPatents = [];
    const skippedPatents = [];

    for (const seedPatent of uniqueSeedPatents) {
      console.log(`Processing seed patent: ${seedPatent}`);
      try {
        const familyData = await getFamilyData(seedPatent, authToken);
        // Save the raw family data to a JSON file
        const familyDataFilePath = path.join(patentSpecificationsDir, `${seedPatent}-family-data.json`);
        fs.writeFileSync(familyDataFilePath, JSON.stringify(familyData, null, 2), { flag: 'w' }); // Overwrite existing file
        console.log(`Family data saved to ${familyDataFilePath}`);

        const patentNumbers = extractPatentNumbers(familyData);

        if (patentNumbers.length === 0) {
          console.log(`No patent numbers found for seed patent: ${seedPatent}`);
          skippedPatents.push(seedPatent);
          continue;
        }

        for (const patentNumber of patentNumbers) {
          console.log(`Processing patent: ${patentNumber}`);
          const kindCodes = [
            'C9', 'C8', 'C4', 'C1', 'C', 
            'B9', 'B8', 'B4', 'B3', 'B2', 'B1', 
            'A9', 'A8', 'A6', 'A5', 'A4', 'A2', 'A1'
          ]; // Start from C9 and work backwards to A1
          let success = false;

          for (const kindCode of kindCodes) {
            try {
              const pdfBuffer = await getPatentSpecification(patentNumber, authToken, kindCode);
              console.log(`PDF buffer length for ${patentNumber} with kind code ${kindCode}: ${pdfBuffer.length}`); // Log the buffer length
              savePatentSpecification(patentNumber, pdfBuffer);
              success = true;
              downloadedCount++;
              break;
            } catch (error) {
              if (error.message.includes('SERVER.EntityNotFound')) {
                console.log(`Kind code ${kindCode} not found for ${patentNumber}, trying next kind code.`);
              } else {
                console.error(`Failed to fetch patent specification for ${patentNumber} with kind code ${kindCode}:`, error);
              }
            }
          }

          if (!success) {
            console.error(`Failed to process patent: ${patentNumber} with all kind codes`);
            failedPatents.push(patentNumber);
          }

          // Add a delay between requests to avoid hitting rate limits
          await delay(1000); // 1 second delay
        }
      } catch (error) {
        console.error(`Failed to process seed patent: ${seedPatent}`, error);
        failedPatents.push(seedPatent);
      }
    }

    const endTime = Date.now(); // End time for the process
    const timeTaken = endTime - startTime; // Time taken in milliseconds
    const minutes = Math.floor(timeTaken / 60000);
    const seconds = ((timeTaken % 60000) / 1000).toFixed(0);

    console.log(`Total patents downloaded: ${downloadedCount}`);
    console.log('All patents processed successfully');
    console.log(`Failed patents: ${failedPatents.length}`);
    if (failedPatents.length > 0) {
      console.log('List of failed patents:');
      failedPatents.forEach(patent => console.log(patent));
    }
    console.log(`Skipped patents: ${skippedPatents.length}`);
    if (skippedPatents.length > 0) {
      console.log('List of skipped patents:');
      skippedPatents.forEach(patent => console.log(patent));
    }
    console.log(`Time taken: ${minutes} minutes and ${seconds} seconds`);
  } catch (error) {
    console.error('Process failed:', error);
    throw error;
  }
}

process().then(console.log).catch(console.error);