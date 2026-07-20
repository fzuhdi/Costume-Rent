const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/fzuhd/OneDrive/Documents/Project/Costume-Rent/frontend/src/components';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Undo previous bad replace
  content = content.replace(/<Modal>\s*<Modal\.Backdrop>/g, '<Modal.Backdrop>');
  content = content.replace(/<\/Modal\.Backdrop>\s*<\/Modal>/g, '</Modal.Backdrop>');

  let replaced = false;
  content = content.replace(/<Modal\.Backdrop([^>]*isOpen=[^>]*)>/g, (match, p1) => {
    replaced = true;
    return `<Modal${p1}>\n      <Modal.Backdrop>`;
  });
  
  if (replaced) {
    content = content.replace(/<\/Modal\.Backdrop>/g, '<\/Modal.Backdrop>\n    <\/Modal>');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

function walk(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const full = path.join(dirPath, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.jsx')) fixFile(full);
  }
}

walk(dir);
