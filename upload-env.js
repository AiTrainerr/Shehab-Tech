const { execSync } = require('child_process');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#') && !line.startsWith('VERCEL')) {
    const splitIndex = line.indexOf('=');
    if (splitIndex === -1) continue;
    
    const key = line.substring(0, splitIndex).trim();
    let value = line.substring(splitIndex + 1).trim();
    
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    
    console.log(`Adding ${key}...`);
    try {
      execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'ignore'] });
    } catch (e) {
      console.log(`Failed to add ${key} (might already exist)`);
    }
  }
}
