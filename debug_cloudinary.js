require('dotenv').config(); 
const https = require('https');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Test with a known user ID - Sara Mohammed
const SARA_ID = 'c4d76e3a-483c-4926-9a86-6a1405907e7f';

function cloudinarySearch(expression) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
    const body = JSON.stringify({ 
      expression: expression,
      max_results: 5
    });
    
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/resources/search`,
      method: 'POST',
      headers: { 
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Also try listing by folder directly
function cloudinaryListFolder(prefix) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
    const path = `/v1_1/${CLOUD_NAME}/resources/video?type=upload&prefix=${encodeURIComponent(prefix)}&max_results=5`;
    
    const options = {
      hostname: 'api.cloudinary.com',
      path: path,
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Cloud:', CLOUD_NAME, '| Key:', API_KEY);
  
  // Try multiple search strategies
  console.log('\n--- Test 1: Search by userId ---');
  const r1 = await cloudinarySearch(`public_id:*${SARA_ID}*`);
  console.log('Result:', JSON.stringify(r1).substring(0, 300));

  console.log('\n--- Test 2: List folder shehab-tech/recordings ---');
  const r2 = await cloudinaryListFolder('shehab-tech/recordings');
  console.log('Result:', JSON.stringify(r2).substring(0, 500));

  console.log('\n--- Test 3: Search all videos in shehab-tech folder ---');
  const r3 = await cloudinarySearch(`folder:shehab-tech\\/recordings`);
  console.log('Result:', JSON.stringify(r3).substring(0, 500));
}

main().catch(e => console.error('Error:', e.message));
