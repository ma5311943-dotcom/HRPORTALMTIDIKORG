const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const candidateImages = [
    '/images/cand_hamza.jpg',
    '/images/cand_zainab.jpg',
    '/images/cand_bilal.jpg',
    '/images/cand_usman.jpg',
    '/images/cand_ayesha.jpg',
    '/images/cand_fatima.jpg',
    '/images/admin_portrait.jpg',
    '/images/mna_portrait.jpg',
    '/images/civil_officer_portrait.jpg',
    '/images/staff_portrait.jpg',
  ];

  if (data.candidates && Array.isArray(data.candidates)) {
    data.candidates.forEach((cand, idx) => {
      cand.photoUrl = candidateImages[idx % candidateImages.length];
    });
  }

  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated data/db.json with local candidate images');
}
