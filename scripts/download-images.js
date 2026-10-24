const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  {
    name: 'mna_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'mpa_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'chairperson_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'uc_chairman_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'councilor_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'civil_officer_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'committee_head_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'staff_portrait.jpg',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'cand_ayesha.jpg',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'cand_bilal.jpg',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'cand_fatima.jpg',
    url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'cand_zainab.jpg',
    url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'cand_usman.jpg',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'assembly_hall.jpg',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'pakistan_flag.jpg',
    url: 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=1200&auto=format&fit=crop&q=80',
  }
];

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, item.name);
    const file = fs.createWriteStream(dest);
    https.get(item.url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectedResponse) => {
          redirectedResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Saved ${item.name}`);
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Saved ${item.name}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of images) {
    try {
      await download(item);
    } catch (e) {
      console.error(`Failed ${item.name}`, e);
    }
  }
  console.log('All image assets downloaded successfully!');
}

run();
