/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') && !dirFile.includes('.next') && !dirFile.includes('node_modules')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const allFiles = walkSync('src');
const skipFiles = [
  'src\\app\\dashboard\\page.tsx',
  'src\\app\\crm\\page.tsx',
  'src\\app\\crm\\[id]\\page.tsx',
  'src\\components\\layout\\Sidebar.tsx',
  'src\\components\\layout\\Header.tsx',
  // include unix paths just in case
  'src/app/dashboard/page.tsx',
  'src/app/crm/page.tsx',
  'src/app/crm/[id]/page.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/Header.tsx'
];

allFiles.forEach(file => {
  if (skipFiles.some(skip => file.replace(/\\/g, '/').includes(skip.replace(/\\/g, '/')))) {
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(/\btext-sm\b/g, "text-base");
  content = content.replace(/\btext-xs\b/g, "text-sm");
  content = content.replace(/text-\[10px\]/g, "text-xs");
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
});
