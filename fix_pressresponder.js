const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/fzuhd/OneDrive/Documents/Project/Costume-Rent/frontend/src/components';

const targetFiles = [
  'AddPaymentModal.jsx',
  'ConfirmActionModal.jsx',
  'ExcelImportModal.jsx',
  'ExtendRentModal.jsx',
  'ImagePreviewModal.jsx',
  'MarkBookedModal.jsx',
  'MarkRentedModal.jsx',
  'MarkReturnedModal.jsx',
  'POS\\POSCheckoutModal.jsx',
  'RentDetail\\RentDetailActivityLog.jsx'
];

targetFiles.forEach(file => {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) return;
  let content = fs.readFileSync(full, 'utf8');
  if (content.includes('Hidden Trigger')) return;
  
  let replaced = false;
  content = content.replace(/(<Modal[^>]*isOpen[^>]*>)/, (match) => {
    replaced = true;
    return match + '\n      <Button className="hidden">Hidden Trigger</Button>';
  });
  
  if (replaced) {
    fs.writeFileSync(full, content);
    console.log('Fixed', full);
  }
});
