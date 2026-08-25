// One-time backfill: /api/send-message-to-student historically inserted "admin_to_student"
// chat messages with only `sentAt`, no `createdAt`. The conversation thread is sorted with
// `.sort({ createdAt: 1, sentAt: 1, _id: 1 })`, and Mongo treats a missing `createdAt` as the
// lowest possible value in ascending order — so every affected admin message sorted before any
// student reply that had a real `createdAt`, regardless of actual send time. This made admin
// messages (most visibly ones with file attachments, since sending a file always goes through
// this endpoint) appear stuck at the top of the thread instead of interleaving chronologically.
//
// The endpoint itself is already fixed to set `createdAt` going forward. This script backfills
// existing documents by copying `sentAt` into `createdAt` where `createdAt` is missing.
//
// Safe to run multiple times (already-backfilled documents no longer match the filter).
// Run: node scripts/backfill-admin-message-createdat.js
//   or: node scripts/backfill-admin-message-createdat.js --dry-run   (report counts only, no writes)

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ureb_system';
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const clientOptions =
    uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net')
      ? { tls: true, tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true }
      : {};

  const client = new MongoClient(uri, clientOptions);
  await client.connect();
  const db = client.db('ureb_system');
  const messages = db.collection('messages');

  console.log(DRY_RUN ? 'Running in DRY RUN mode — no changes will be written.' : 'Running backfill — this WILL modify the database.');

  const filter = {
    type: 'admin_to_student',
    createdAt: { $exists: false },
    sentAt: { $exists: true },
  };

  const affected = await messages.countDocuments(filter);
  console.log(`\n"admin_to_student" messages missing createdAt: ${affected}`);

  const samples = await messages.find(filter).limit(3).project({ recipientEmail: 1, message: 1, sentAt: 1 }).toArray();
  if (samples.length > 0) {
    console.log('  sample messages that will be backfilled:');
    samples.forEach((s) => console.log(`    - [${s.sentAt?.toISOString?.() || s.sentAt}] -> ${s.recipientEmail}: ${(s.message || '').slice(0, 60)}`));
  }

  if (DRY_RUN) {
    console.log('\n(dry run — no writes performed)');
    await client.close();
    return;
  }

  const result = await messages.updateMany(filter, [{ $set: { createdAt: '$sentAt' } }]);
  console.log(`\nmatched: ${result.matchedCount}, modified: ${result.modifiedCount}`);

  await client.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
