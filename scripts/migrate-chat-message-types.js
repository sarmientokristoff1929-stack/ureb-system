// One-time migration: split the old shared "student_to_admin"/"reviewer_to_admin" message
// types into the new Messenger-chat-only types ("student_chat_to_admin"/"reviewer_chat_to_admin")
// vs. the automated submission notices (resubmission, review submitted/resubmitted) that must
// keep their original type so they keep showing up in "Files And Messages Submitted".
//
// A message is treated as an automated submission notice (left untouched) if it carries any of
// the fields only those notice-creation code paths set: reviewId, proposalId, relatedProposalId,
// submissionType, or replyToMessageId (the legacy /api/messages/reply attachment-reply feature).
// Everything else with the old type is a genuine manually-composed chat message and gets migrated.
//
// Safe to run multiple times (already-migrated documents no longer match the old type filter).
// Run: node scripts/migrate-chat-message-types.js
//   or: node scripts/migrate-chat-message-types.js --dry-run   (report counts only, no writes)

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ureb_system';
const DRY_RUN = process.argv.includes('--dry-run');

const NOTICE_FIELD_EXCLUSIONS = {
    reviewId: { $exists: false },
    proposalId: { $exists: false },
    relatedProposalId: { $exists: false },
    submissionType: { $exists: false },
    replyToMessageId: { $exists: false },
};

async function migrateDirection(messages, { oldType, newType, label }) {
    const chatFilter = { type: oldType, ...NOTICE_FIELD_EXCLUSIONS };
    const noticeFilter = {
        type: oldType,
        $or: [
            { reviewId: { $exists: true } },
            { proposalId: { $exists: true } },
            { relatedProposalId: { $exists: true } },
            { submissionType: { $exists: true } },
            { replyToMessageId: { $exists: true } },
        ],
    };

    const totalOldType = await messages.countDocuments({ type: oldType });
    const chatCount = await messages.countDocuments(chatFilter);
    const noticeCount = await messages.countDocuments(noticeFilter);

    console.log(`\n[${label}] "${oldType}" documents: ${totalOldType}`);
    console.log(`  -> chat messages to migrate to "${newType}": ${chatCount}`);
    console.log(`  -> automated notices staying as "${oldType}": ${noticeCount}`);

    if (chatCount + noticeCount !== totalOldType) {
        console.warn(
            `  !! mismatch: ${chatCount} + ${noticeCount} != ${totalOldType} — a document matched neither/both filters, investigate before trusting this migration.`
        );
    }

    const samples = await messages.find(chatFilter).limit(3).project({ subject: 1, message: 1, senderEmail: 1, createdAt: 1 }).toArray();
    if (samples.length > 0) {
        console.log('  sample chat messages that will be migrated:');
        samples.forEach((s) => console.log(`    - [${s.createdAt?.toISOString?.() || s.createdAt}] ${s.senderEmail}: ${(s.message || '').slice(0, 60)}`));
    }

    if (DRY_RUN) {
        console.log(`  (dry run — no writes performed)`);
        return { matched: chatCount, modified: 0 };
    }

    const result = await messages.updateMany(chatFilter, { $set: { type: newType } });
    console.log(`  matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    return { matched: result.matchedCount, modified: result.modifiedCount };
}

async function main() {
    const clientOptions =
        uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net')
            ? { tls: true, tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true }
            : {};

    const client = new MongoClient(uri, clientOptions);
    await client.connect();
    const db = client.db('ureb_system');
    const messages = db.collection('messages');

    console.log(DRY_RUN ? 'Running in DRY RUN mode — no changes will be written.' : 'Running migration — this WILL modify the database.');

    const studentResult = await migrateDirection(messages, {
        oldType: 'student_to_admin',
        newType: 'student_chat_to_admin',
        label: 'Researcher -> Admin',
    });

    const reviewerResult = await migrateDirection(messages, {
        oldType: 'reviewer_to_admin',
        newType: 'reviewer_chat_to_admin',
        label: 'Reviewer -> Admin',
    });

    console.log('\nSummary:');
    console.log(`  Researcher chat messages migrated: ${studentResult.modified}`);
    console.log(`  Reviewer chat messages migrated: ${reviewerResult.modified}`);

    await client.close();
    console.log('Done.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
