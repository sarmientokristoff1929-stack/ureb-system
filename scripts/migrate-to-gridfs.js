// One-time migration: upload all local uploads/ files into MongoDB GridFS
// Run with: node scripts/migrate-to-gridfs.js

import { MongoClient, GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const MIME_MAP = {
  '.pdf':  'application/pdf',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.txt':  'text/plain',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  console.log('Connecting to MongoDB Atlas...');
  await client.connect();
  const db = client.db('ureb_system');
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  console.log('Connected.\n');

  // Collect all regular files (skip sub-directories like profile-pictures/)
  const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
  const files = entries.filter(e => e.isFile()).map(e => e.name);

  console.log(`Found ${files.length} file(s) in uploads/\n`);

  let skipped = 0;
  let uploaded = 0;
  let failed = 0;

  for (const filename of files) {
    // Skip if already present in GridFS
    const existing = await bucket.find({ filename }).toArray();
    if (existing.length > 0) {
      console.log(`  SKIP  ${filename}  (already in GridFS)`);
      skipped++;
      continue;
    }

    const filePath = path.join(uploadsDir, filename);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    try {
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath);
        const uploadStream = bucket.openUploadStream(filename, { contentType });
        readStream.pipe(uploadStream);
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });
      console.log(`  OK    ${filename}`);
      uploaded++;
    } catch (err) {
      console.error(`  FAIL  ${filename}  —  ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}  Skipped: ${skipped}  Failed: ${failed}`);
  await client.close();
}

migrate().catch(err => {
  console.error('\nMigration error:', err.message);
  process.exit(1);
});
