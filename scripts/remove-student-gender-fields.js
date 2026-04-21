// One-time cleanup: remove legacy `gender` and `sex` from all documents in `students`.
// Safe to run multiple times (MongoDB ignores $unset on missing fields).
// Run: node scripts/remove-student-gender-fields.js
//   or: npm run db:unset-gender

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ureb_system';

async function main() {
  const clientOptions =
    uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net')
      ? {
          tls: true,
          tlsAllowInvalidCertificates: true,
          tlsAllowInvalidHostnames: true,
        }
      : {};

  const client = new MongoClient(uri, clientOptions);
  await client.connect();
  const db = client.db('ureb_system');
  const students = db.collection('students');

  const total = await students.countDocuments({});
  const filter = {
    $or: [{ gender: { $exists: true } }, { sex: { $exists: true } }],
  };
  const hadLegacyFields = await students.countDocuments(filter);
  console.log(`Total student documents: ${total}`);
  console.log(`With gender or sex field (before): ${hadLegacyFields}`);

  const result = await students.updateMany({}, { $unset: { gender: '', sex: '' } });
  console.log(`Matched (all students): ${result.matchedCount}`);
  console.log(
    `Modified: ${result.modifiedCount}` +
      (result.modifiedCount === 0
        ? ' — no changes needed (fields already absent on every document).'
        : ' — removed gender/sex from those documents.')
  );

  await client.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
