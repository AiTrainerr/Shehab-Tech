const fs = require('fs');
let c = fs.readFileSync('src/components/voice-recorder.tsx', 'utf8');
c = c.replace(/onClick=\{\(\) => \{\s*if \(confirm\("Are you sure you want to re-record this sentence\? Your old recording will be overwritten upon upload\."\)\) \{\s*startRecording\(activeSentence\.id\)\s*\}\s*\}\}/, 'onClick={() => startRecording(activeSentence.id)}');
fs.writeFileSync('src/components/voice-recorder.tsx', c);
