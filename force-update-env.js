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
    
    console.log(`Force updating ${key}...`);
    try {
      // Remove existing variable (ignore error if it doesn't exist)
      try {
        execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore' });
        console.log(`Removed old ${key}`);
      } catch(e) {}
      
      // Add new variable
      execSync(`npx vercel env add ${key} production`, { input: value, stdio: ['pipe', 'inherit', 'ignore'] });
      console.log(`Successfully added new ${key}`);
    } catch (e) {
      console.log(`Failed to update ${key}: ${e.message}`);
    }
  }
}
