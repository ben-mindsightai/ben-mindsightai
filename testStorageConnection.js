// filepath: /Users/Ben/Cursor Docker and MS Visual Studio/ben-mindsightai/testStorageConnection.js
const { BlobServiceClient } = require('@azure/storage-blob');
const { InteractiveBrowserCredential } = require('@azure/identity');

const accountName = 'mindsightaistorage001';
const tenantId = '5e6f22b2-2a3a-4508-9364-320c8689bf5f';

async function testConnection() {
  try {
    const interactiveBrowserCredential = new InteractiveBrowserCredential({
      tenantId
    });
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      interactiveBrowserCredential
    );
    const containerClient = blobServiceClient.getContainerClient('container001');
    await containerClient.createIfNotExists();
    console.log('Connection to storage account succeeded.');
  } catch (error) {
    console.error('Failed to connect to storage account:', error.message);
  }
}

testConnection();