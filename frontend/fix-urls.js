const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('http://localhost:4000')) {
        content = content.replace(/"http:\/\/localhost:4000([^"]*)"/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:4000\'}$1`');
        content = content.replace(/`http:\/\/localhost:4000([^`]*)`/g, '`${process.env.NEXT_PUBLIC_API_URL || \'http://localhost:4000\'}$1`');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
console.log('Finished URL replacement.');
