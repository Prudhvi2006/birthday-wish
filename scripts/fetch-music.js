const fs = require('fs');
const path = require('path');

async function download() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const outPath = path.join(publicDir, 'music.mp3');
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 5000) {
    console.log('music.mp3 already present, skipping download.');
    return;
  }
  const fileId = '1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs';
  const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    const ab = await res.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(ab));
    console.log('Downloaded music.mp3 to public folder.');
  } catch (e) {
    console.warn('Could not download from Google Drive, skipping:', e.message || e);
  }
}

download();
