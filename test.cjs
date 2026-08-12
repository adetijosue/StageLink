const fs = require('fs');
const s = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
try {
  console.log('messages:', Object.keys(s.components.schemas.messages.properties));
} catch(e) { console.log('No messages in components'); }
try {
  console.log('followers:', Object.keys(s.components.schemas.followers.properties));
} catch(e) { console.log('No followers in components'); }
