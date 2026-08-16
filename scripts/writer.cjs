const fs = require('fs');
const path = require('path');

module.exports = function writeBase64(relPath, base64Str) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, Buffer.from(base64Str, 'base64').toString('utf8'), 'utf8');
  console.log('Successfully wrote:', relPath);
};
