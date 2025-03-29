const xml2js = require('xml2js');
const Database = require('better-sqlite3');
const db = new Database('patents.db'.concat(new Date().toISOString()));
const fs = require('fs');
const csv = require('csv-parse/sync');
require('dotenv').config();

async function getAuthToken() {
  const tokenUrl = 'https://ops.epo.org/3.2/auth/accesstoken';
  const consumerKey = 'caSB26pOqKCAB3QXTf37grQDQlboWXuuimOB2kzgAG8dySHH';
  const secretKey = 'NrYNHltOrk23iZmG5v0S7DcPe86oioyLYiVVFiY750CJMslyhGG0UfcPlVrav8MA';
  
  const credentials = Buffer.from(`${consumerKey}:${secretKey}`).toString('base64');
  console.log(credentials);

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
    console.log(data);
    return data.access_token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}

// Function to parse CSV and seed the database
function seedFromCSV() {
  const fileContent = fs.readFileSync('seed.csv', 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  // Prepare statements
  const insertPatentStmt = db.prepare(`
    INSERT INTO seed_patents (patent)
    VALUES (?)
    RETURNING id
  `);

  const insertIngredientStmt = db.prepare(`
    INSERT INTO seed_patents_ingredients (patent_id, ingredient)
    VALUES (?, ?)
  `);

  // Process each record in a transaction
  const transaction = db.transaction((records) => {
    for (const record of records) {
      // Skip the Source column and use Key Patent Number
      const patentNumber = record['Key Patent Number'];
      const ingredients = record['Standardised Active Ingredients'];

      // Insert the patent and get its ID
      const {lastInsertRowid: patentId} = insertPatentStmt.run(patentNumber);

      // Split ingredients by comma, considering the special case where ingredients contain semicolons
      const ingredientsList = ingredients.split(',').map(i => i.trim());

      // Insert each ingredient
      for (const ingredient of ingredientsList) {
        insertIngredientStmt.run(patentId, ingredient);
      }
    }
  });

  // Execute the transaction
  transaction(records);
  console.log('Database seeded successfully from CSV');
}

// Drop existing tables and create new schema
db.exec(`
  DROP TABLE IF EXISTS legal_events;
  DROP TABLE IF EXISTS patent_relations;
  DROP TABLE IF EXISTS patents;
  DROP TABLE IF EXISTS seed_patents_ingredients;
  DROP TABLE IF EXISTS seed_patents;

  CREATE TABLE seed_patents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patent TEXT NOT NULL UNIQUE
  );

  CREATE TABLE seed_patents_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patent_id INTEGER NOT NULL,
    ingredient TEXT NOT NULL,
    FOREIGN KEY (patent_id) REFERENCES seed_patents(id)
  );

  CREATE TABLE patents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patent TEXT NOT NULL
  );

  CREATE TABLE patent_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seed_patent_id INTEGER NOT NULL,
    related_patent_id INTEGER NOT NULL,
    FOREIGN KEY (seed_patent_id) REFERENCES seed_patents(id),
    FOREIGN KEY (related_patent_id) REFERENCES patents(id)
  );

  CREATE TABLE legal_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patent_id INTEGER NOT NULL,
    event_title TEXT,
    event_description TEXT,
    FOREIGN KEY (patent_id) REFERENCES patents(id)
  );
`);

// Seed the database from CSV
seedFromCSV();

// First, copy seed patents to patents table
db.exec(`
  INSERT OR IGNORE INTO patents (patent)
  SELECT patent FROM seed_patents;
`);

const extractPublicationReference = (familyMember) => {
  const pubRefs = familyMember['publication-reference'];
  if (!pubRefs) return null;

  for (const ref of pubRefs) {
    const docIds = ref['document-id'];
    for (const docId of docIds) {
      if (docId.$['document-id-type'] === 'epodoc') {
        return {
          docNumber: docId['doc-number'][0],
          date: docId['date']?.[0]
        };
      }
    }
  }
  return null;
};

const extractLegalEvents = (familyMember) => {
  const legalEvents = [];
  const legals = familyMember['ops:legal'] || [];

  for (const legal of legals) {
    const event = {
      code: legal.$.code,
      legalEventDescription: '',
      countryCode: '',
      filingPublishedDocument: '',
      documentNumber: '',
      kindCode: '',
      iprType: '',
      gazetteDate: '',
      legalEventCode1: '',
      dateLastExchanged: '',
      dateFirstCreated: '',
      expirationDate: null
    };

    // Combine pre lines for legal event description
    if (legal['ops:pre']) {
      event.legalEventDescription = legal['ops:pre']
        .map(pre => pre._)
        .join(' ');
      
      // Extract expiration date from legal event description
      const datePatterns = [
        // Extension date pattern
        /Extension DATE\s+(\d{8})/i,
        // Effective date pattern
        /Effective DATE[:\s]+(\d{8})/i,
        // General date patterns
        /(?:EXPIRED|LAPSED).*?(\d{4}-\d{2}-\d{2})/i,
        /EXPIRED.*?(\d{8})/i,
        /LAPSED.*?(\d{8})/i,
        /PATENT EXPIRED.*?(\d{8})/i,
        // Any labeled date pattern
        /(?:Extension|Expiry|Term|Filing|Effective|Expiration)\s+(?:DATE|Date|date)[:\s]+(\d{8})/i,
        // Fallback: any 8-digit number that looks like a date
        /\b(\d{8})\b/
      ];

      for (const pattern of datePatterns) {
        const match = event.legalEventDescription.match(pattern);
        if (match) {
          // Convert date to YYYY-MM-DD format if it's in YYYYMMDD format
          const dateStr = match[1];
          event.expirationDate = dateStr.length === 8 
            ? dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
            : dateStr;
          
          // Log the found date and pattern for debugging
          console.log('Found date:', {
            pattern: pattern.toString(),
            originalDate: dateStr,
            convertedDate: event.expirationDate,
            description: event.legalEventDescription
          });
          
          break;
        }
      }
    }

    // Extract L***EP fields
    for (const key in legal) {
      if (key.startsWith('ops:L')) {
        const field = legal[key][0];
        switch (key) {
          case 'ops:L001EP':
            event.countryCode = field._;
            break;
          case 'ops:L002EP':
            event.filingPublishedDocument = field._;
            break;
          case 'ops:L003EP':
            event.documentNumber = field._;
            break;
          case 'ops:L004EP':
            event.kindCode = field._;
            break;
          case 'ops:L005EP':
            event.iprType = field._;
            break;
          case 'ops:L007EP':
            event.gazetteDate = field._;
            break;
          case 'ops:L008EP':
            event.legalEventCode1 = field._;
            break;
          case 'ops:L018EP':
            event.dateLastExchanged = field._;
            break;
          case 'ops:L019EP':
            event.dateFirstCreated = field._;
            break;
        }
      }
    }

    legalEvents.push(event);
  }

  return legalEvents;
};

const processPatentFamily = async (xmlData) => {
  try {
    const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });
    const result = await parser.parseStringPromise(xmlData);
    
    if (!result || !result['ops:world-patent-data'] || !result['ops:world-patent-data']['ops:patent-family']) {
      console.error('Unexpected XML structure:', result);
      throw new Error('Unexpected XML structure');
    }
    
    const familyMembers = result['ops:world-patent-data']['ops:patent-family'][0]['ops:family-member'];
    if (!Array.isArray(familyMembers)) {
      console.error('No family members found in the response');
      return [];
    }
    
    const processedData = [];

    for (const member of familyMembers) {
      const pubRef = extractPublicationReference(member);
      const legalEvents = extractLegalEvents(member);

      if (pubRef) {
        processedData.push({
          patent: pubRef.docNumber,
          legalEvents: legalEvents.map(event => ({
            title: event.code,
            description: event.legalEventDescription
          }))
        });
      }
    }

    return processedData;
  } catch (error) {
    console.error('Error processing XML:', error);
    throw error;
  }
};

const storeData = (processedData, seedPatentId) => {
  const insertPatentStmt = db.prepare(`
    INSERT OR IGNORE INTO patents (patent)
    VALUES (?)
    RETURNING id
  `);

  const insertRelationStmt = db.prepare(`
    INSERT OR IGNORE INTO patent_relations (seed_patent_id, related_patent_id)
    VALUES (?, ?)
  `);

  const insertLegalEventStmt = db.prepare(`
    INSERT INTO legal_events (patent_id, event_title, event_description)
    VALUES (?, ?, ?)
  `);

  const getPatentIdStmt = db.prepare(`
    SELECT id FROM patents WHERE patent = ?
  `);

  // Use a transaction for better performance and data integrity
  const transaction = db.transaction((data) => {
    for (const member of data) {
      // Insert or get patent
      try{
        const trimmedPatent = member.patent.match(/^[A-Z]{2,}\d+/i)[0].toUpperCase();

        let patentResult = getPatentIdStmt.get(trimmedPatent);
        let patentId;
        
        if (!patentResult) {
          patentResult = insertPatentStmt.get(trimmedPatent);
          patentId = patentResult?.id;
        } else {
          patentId = patentResult.id;
        }

        if (patentId) {
          // Insert relation
          insertRelationStmt.run(seedPatentId, patentId);

          // Insert legal events
          for (const event of member.legalEvents) {
            insertLegalEventStmt.run(
              patentId,
              event.title,
              event.description
            );
          }
        }
      } catch (error) {
        console.log('member pattent doesnt conform to regex',member.patent);
        process.exit(1);
      }
    }
  });

  // Execute the transaction
  try {
    transaction(processedData);
    console.log('Data stored successfully in SQLite database');
  } catch (error) {
    console.error('Error in database transaction:', error);
    throw error;
  }
};

const makeApiCall = async (patentNumber, authToken) => {
  try {
    const response = await fetch(`https://ops.epo.org/3.2/rest-services/family/publication/epodoc/${patentNumber}/legal`, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return null; // Return null instead of throwing an error
    }
    
    const xmlData = await response.text();
    console.log('Raw XML Response:', xmlData); // Debug log
    
    const processedData = await processPatentFamily(xmlData);
    console.log('Processed Data:', JSON.stringify(processedData, null, 2));
    return processedData;
  } catch (error) {
    console.error('API call failed:', error);
    return null; // Return null instead of throwing an error
  }
};

async function process() {
  try {
    const authToken = await getAuthToken();
    console.log('Successfully obtained auth token');
    
    // Get all seed patents
    const seedPatents = db.prepare('SELECT id, patent FROM seed_patents').all();
    
    // Get already processed patents to avoid duplicates
    const processedPatents = new Set(
      db.prepare(`
        SELECT DISTINCT p.patent 
        FROM patents p 
        JOIN patent_relations pr ON p.id = pr.related_patent_id
      `).pluck().all()
    );
    
    for (const seedPatent of seedPatents) {
      if (processedPatents.has(seedPatent.patent)) {
        console.log(`Skipping already processed patent: ${seedPatent.patent}`);
        continue;
      }
      
      console.log(`Processing seed patent: ${seedPatent.patent}`);
      const data = await makeApiCall(seedPatent.patent, authToken);
      if (data) {
        storeData(data, seedPatent.id);
        
        // Add all family members to processed set
        data.forEach(member => processedPatents.add(member.patent));
      } else {
        console.error(`Failed to process seed patent: ${seedPatent.patent}`);
      }
    }
    
    return 'All patents processed successfully';
  } catch (error) {
    console.error('Process failed:', error);
    throw error;
  }
}

process().then(console.log).catch(console.error);