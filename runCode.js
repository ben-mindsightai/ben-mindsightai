const xml2js = require('xml2js');
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const db = new Database('patents.db');

// Drop existing tables and recreate them with the new schema
db.exec(`
  DROP TABLE IF EXISTS legal_events;
  DROP TABLE IF EXISTS publication_references;

  CREATE TABLE publication_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_number TEXT UNIQUE NOT NULL,
    date TEXT
  );

  CREATE TABLE legal_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publication_ref_id INTEGER,
    code TEXT,
    legal_event_description TEXT,
    country_code TEXT,
    filing_published_document TEXT,
    document_number TEXT,
    kind_code TEXT,
    ipr_type TEXT,
    gazette_date TEXT,
    legal_event_code1 TEXT,
    date_last_exchanged TEXT,
    date_first_created TEXT,
    expiration_date TEXT,
    FOREIGN KEY (publication_ref_id) REFERENCES publication_references(id)
  );
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

    // Debug log to see the structure
    console.log('XML Structure:', JSON.stringify(result, null, 2));

    // Check if we have the expected structure
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

      processedData.push({
        publicationReference: pubRef,
        legalEvents: legalEvents
      });
    }

    return processedData;
  } catch (error) {
    console.error('Error processing XML:', error);
    console.error('Raw XML data:', xmlData);
    throw error;
  }
};

const storeData = (processedData) => {
  const insertPublicationStmt = db.prepare(`
    INSERT OR REPLACE INTO publication_references (doc_number, date)
    VALUES (?, ?)
    RETURNING id
  `);

  const insertLegalEventStmt = db.prepare(`
    INSERT INTO legal_events (
      publication_ref_id, code, legal_event_description,
      country_code, filing_published_document, document_number,
      kind_code, ipr_type, gazette_date, legal_event_code1,
      date_last_exchanged, date_first_created, expiration_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Get publication reference by doc number
  const getPublicationStmt = db.prepare(`
    SELECT id FROM publication_references WHERE doc_number = ?
  `);

  // Use a transaction for better performance and data integrity
  const transaction = db.transaction((data) => {
    for (const member of data) {
      if (!member.publicationReference || !member.publicationReference.docNumber) {
        console.log('Skipping member without valid publication reference');
        continue;
      }

      // Try to get existing publication reference or insert new one
      let pubId;
      const existingPub = getPublicationStmt.get(member.publicationReference.docNumber);

      if (existingPub) {
        pubId = existingPub.id;
      } else {
        const pubResult = insertPublicationStmt.get(
          member.publicationReference.docNumber,
          member.publicationReference.date
        );
        pubId = pubResult.id;
      }

      // Insert legal events
      if (pubId && member.legalEvents) {
        for (const event of member.legalEvents) {
          try {
            insertLegalEventStmt.run(
              pubId,
              event.code,
              event.legalEventDescription,
              event.countryCode,
              event.filingPublishedDocument,
              event.documentNumber,
              event.kindCode,
              event.iprType,
              event.gazetteDate,
              event.legalEventCode1,
              event.dateLastExchanged,
              event.dateFirstCreated,
              event.expirationDate
            );
          } catch (error) {
            console.error('Error inserting legal event:', error);
            console.error('Event data:', event);
          }
        }
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

const makeApiCall = async () => {
  try {
    const response = await fetch('https://ops.epo.org/3.2/rest-services/family/publication/epodoc/US8163723/legal', {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Authorization': `Bearer yG7Gl5ZV9CJY1B3EGgayIAeQHSpb`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();
    console.log('Raw XML Response:', xmlData); // Debug log

    const processedData = await processPatentFamily(xmlData);
    console.log('Processed Data:', JSON.stringify(processedData, null, 2));
    storeData(processedData);
    return processedData;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Execute the function
makeApiCall();