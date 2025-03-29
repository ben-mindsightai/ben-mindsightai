require('dotenv').config();
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const querystring = require('querystring');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mindsightaistorage001';
const containerName = process.env.STORAGE_CONTAINER_NAME || 'container001';
const tenantId = process.env.TENANT_ID || '5e6f22b2-2a3a-4508-9364-320c8689bf5f';
const apiKey = process.env.OPS_API_KEY || 'caSB26pOqKCAB3QXTf37grQDQlboWXuuimOB2kzgAG8dySHH';
const apiSecret = process.env.OPS_API_SECRET || 'NrYNHltOrk23iZmG5v0S7DcPe86oioyLYiVVFiY750CJMslyhGG0UfcPlVrav8MA';

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  const getAccessToken = async () => {
    const response = await fetch('https://ops.epo.org/3.2/auth/accesstoken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64')
      },
      body: querystring.stringify({
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log('Error obtaining access token:', errorText);
      throw new Error(`Failed to obtain access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  };

  const makeApiCall = async (accessToken) => {
    const response = await fetch('https://ops.epo.org/3.2/rest-services/family/publication/epodoc/US8163723/legal', {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();
    context.log('Raw XML Response:', xmlData); // Debug log

    const processedData = await processPatentFamily(xmlData);
    context.log('Processed Data:', JSON.stringify(processedData, null, 2));
    await storeData(processedData);
    return processedData;
  };

  const processPatentFamily = async (xmlData) => {
    try {
      const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });
      const result = await parser.parseStringPromise(xmlData);

      // Debug log to see the structure
      context.log('XML Structure:', JSON.stringify(result, null, 2));

      // Check if we have the expected structure
      if (!result || !result['ops:world-patent-data'] || !result['ops:world-patent-data']['ops:patent-family']) {
        context.log('Unexpected XML structure:', result);
        throw new Error('Unexpected XML structure');
      }

      const familyMembers = result['ops:world-patent-data']['ops:patent-family'][0]['ops:family-member'];
      if (!Array.isArray(familyMembers)) {
        context.log('No family members found in the response');
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
      context.log('Error processing XML:', error);
      context.log('Raw XML data:', xmlData);
      throw error;
    }
  };

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
            context.log('Found date:', {
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

  const storeData = async (processedData) => {
    const defaultAzureCredential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      defaultAzureCredential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient('patents.json');
    const data = JSON.stringify(processedData, null, 2);
    await blockBlobClient.upload(data, data.length);

    context.log('Data stored successfully in Azure Blob Storage');
  };

  try {
    const accessToken = await getAccessToken();
    const data = await makeApiCall(accessToken);
    context.res = {
      status: 200,
      body: data
    };
  } catch (error) {
    context.log('Error:', error);
    context.res = {
      status: 500,
      body: 'Internal Server Error'
    };
  }
};dotenv').config();
const xml2js = require('xml2js');
const fetch = require('node-fetch');
const querystring = require('querystring');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

const accountName = process.env.STORAGE_ACCOUNT_NAME || 'mindsightaistorage001';
const containerName = process.env.STORAGE_CONTAINER_NAME || 'container001';
const tenantId = process.env.TENANT_ID || '5e6f22b2-2a3a-4508-9364-320c8689bf5f';
const apiKey = process.env.OPS_API_KEY || 'caSB26pOqKCAB3QXTf37grQDQlboWXuuimOB2kzgAG8dySHH';
const apiSecret = process.env.OPS_API_SECRET || 'NrYNHltOrk23iZmG5v0S7DcPe86oioyLYiVVFiY750CJMslyhGG0UfcPlVrav8MA';

module.exports = async function (context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');

  const getAccessToken = async () => {
    const response = await fetch('https://ops.epo.org/3.2/auth/accesstoken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64')
      },
      body: querystring.stringify({
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log('Error obtaining access token:', errorText);
      throw new Error(`Failed to obtain access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  };

  const makeApiCall = async (accessToken) => {
    const response = await fetch('https://ops.epo.org/3.2/rest-services/family/publication/epodoc/US8163723/legal', {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      context.log('API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();
    context.log('Raw XML Response:', xmlData); // Debug log

    const processedData = await processPatentFamily(xmlData);
    context.log('Processed Data:', JSON.stringify(processedData, null, 2));
    await storeData(processedData);
    return processedData;
  };

  const processPatentFamily = async (xmlData) => {
    try {
      const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: false });
      const result = await parser.parseStringPromise(xmlData);

      // Debug log to see the structure
      context.log('XML Structure:', JSON.stringify(result, null, 2));

      // Check if we have the expected structure
      if (!result || !result['ops:world-patent-data'] || !result['ops:world-patent-data']['ops:patent-family']) {
        context.log('Unexpected XML structure:', result);
        throw new Error('Unexpected XML structure');
      }

      const familyMembers = result['ops:world-patent-data']['ops:patent-family'][0]['ops:family-member'];
      if (!Array.isArray(familyMembers)) {
        context.log('No family members found in the response');
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
      context.log('Error processing XML:', error);
      context.log('Raw XML data:', xmlData);
      throw error;
    }
  };

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
            context.log('Found date:', {
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

  const storeData = async (processedData) => {
    const defaultAzureCredential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      defaultAzureCredential
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blockBlobClient = containerClient.getBlockBlobClient('patents.json');
    const data = JSON.stringify(processedData, null, 2);
    await blockBlobClient.upload(data, data.length);

    context.log('Data stored successfully in Azure Blob Storage');
  };

  try {
    const accessToken = await getAccessToken();
    const data = await makeApiCall(accessToken);
    context.res = {
      status: 200,
      body: data
    };
  } catch (error) {
    context.log('Error:', error);
    context.res = {
      status: 500,
      body: 'Internal Server Error'
    };
  }
};
