const fs = require('fs');
const https = require('https');
const path = require('path');

const WEIGHTS_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const WEIGHTS_DIR = path.join(__dirname, '../weights');

const files = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

if (!fs.existsSync(WEIGHTS_DIR)) {
  fs.mkdirSync(WEIGHTS_DIR, { recursive: true });
}

async function downloadFile(filename) {
  const dest = path.join(WEIGHTS_DIR, filename);
  if (fs.existsSync(dest)) {
    console.log(`Skipping ${filename} - already exists`);
    return;
  }
  
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${filename}...`);
    const file = fs.createWriteStream(dest);
    https.get(WEIGHTS_URL + filename, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${filename}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const file of files) {
    try {
      await downloadFile(file);
    } catch (e) {
      console.error(e.message);
    }
  }
  console.log('All weights downloaded.');
}

downloadAll();
