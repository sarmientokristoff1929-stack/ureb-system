import express from 'express';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Signs/verifies the admin session token issued at login (see /api/auth/login).
// Reuses SESSION_SECRET, which already exists in .env for exactly this purpose.
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.warn('[SECURITY] SESSION_SECRET is not set — admin-authenticated routes will reject every request until it is configured.');
}

function signAuthToken(payload) {
  if (!SESSION_SECRET) return null;
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '30d' });
}

// Blocks any request that isn't carrying a valid admin session token.
// Responds like a route that doesn't exist at all, rather than 401/403,
// so scanning/probing tools (or a stray Postman request) can't even tell
// the endpoint is there.
function requireAdminAuth(req, res, next) {
  const notFound = () => res.status(404).type('text/plain').send(`Cannot ${req.method} ${req.originalUrl}`);

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!SESSION_SECRET || !token) return notFound();

  try {
    const payload = jwt.verify(token, SESSION_SECRET);
    if (payload.role !== 'admin') return notFound();
    req.authUser = payload;
    next();
  } catch {
    notFound();
  }
}

// Startup log to confirm server version
console.log('******************************************');
console.log('*** SERVER v2.0 - GENDER FIX ACTIVE  ***');
console.log('******************************************');

// Middleware & Security Hardening
app.use(cors());

// Global Security Response Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request body parser
app.use(express.json());

// Version endpoint to verify deployment
app.get('/api/version', (req, res) => {
  res.json({ version: '2.0-gender-fix', genderSupport: true, timestamp: new Date().toISOString() });
});

// Cloudflare Turnstile verification (Login / Register bot protection).
// Fails closed: a missing secret key or a failed/absent token both reject the request —
// this endpoint never silently allows a request through unverified.
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const verifyTurnstileToken = async (token) => {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not configured — rejecting request');
    return { success: false, 'error-codes': ['missing-secret-key'] };
  }
  if (!token) {
    return { success: false, 'error-codes': ['missing-input-response'] };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', process.env.TURNSTILE_SECRET_KEY);
    params.append('response', token);

    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    return await verifyRes.json();
  } catch (error) {
    console.error('[turnstile] siteverify request failed:', error);
    return { success: false, 'error-codes': ['internal-error'] };
  }
};

// Rejects the request with 403 if the Turnstile token is missing/invalid.
// Returns true (and has already sent the response) when the request was rejected,
// so callers can `if (await rejectIfTurnstileInvalid(req, res)) return;`.
const rejectIfTurnstileInvalid = async (req, res) => {
  const outcome = await verifyTurnstileToken(req.body?.turnstileToken);
  if (!outcome.success) {
    console.log('[turnstile] verification failed:', outcome['error-codes']);
    res.status(403).json({ success: false, error: 'Security verification failed. Please complete the challenge and try again.' });
    return true;
  }
  return false;
};

// Login rate limiting — locks an account out after 3 consecutive failed
// attempts (incorrect email or incorrect password) to slow down brute-force /
// credential-stuffing attempts. Keyed by normalized email rather than IP, so
// the lockout protects the targeted account no matter where the requests
// come from. Resets automatically once the lockout window elapses, and
// immediately on any successful login.
const MAX_LOGIN_ATTEMPTS = 3;
const LOGIN_LOCKOUT_MS = 4 * 60 * 60 * 1000; // 4 hours
const loginAttempts = new Map(); // normalized email -> { count, lockUntil }

const normalizeLoginKey = (email) => (email || '').trim().toLowerCase();

// Returns whether the account is currently locked out, and for how much
// longer. Clears expired lockouts as a side effect so the map doesn't hold
// stale entries forever.
const getLoginLockStatus = (email) => {
  const key = normalizeLoginKey(email);
  const entry = loginAttempts.get(key);
  if (!entry) return { locked: false };
  if (entry.lockUntil && entry.lockUntil > Date.now()) {
    return { locked: true, retryAfterMs: entry.lockUntil - Date.now() };
  }
  if (entry.lockUntil) {
    loginAttempts.delete(key);
  }
  return { locked: false };
};

// Records a failed attempt and locks the account once the threshold is hit.
// Returns the number of attempts remaining before lockout (0 if now locked).
const registerFailedLoginAttempt = (email) => {
  const key = normalizeLoginKey(email);
  const entry = loginAttempts.get(key) || { count: 0, lockUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockUntil = Date.now() + LOGIN_LOCKOUT_MS;
  }
  loginAttempts.set(key, entry);
  return Math.max(0, MAX_LOGIN_ATTEMPTS - entry.count);
};

const clearLoginAttempts = (email) => {
  loginAttempts.delete(normalizeLoginKey(email));
};

const formatLockoutMessage = (retryAfterMs) => {
  const hours = Math.max(1, Math.ceil(retryAfterMs / (60 * 60 * 1000)));
  return `Too many failed login attempts. Please try again after ${hours} hour${hours === 1 ? '' : 's'}.`;
};

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ureb_system';
let client;
let db;
let gfsBucket;

export const connectToDatabase = async () => {
  try {
    if (!client) {
      // MongoDB connection with proper SSL configuration
      const options = {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // Use IPv4, skip IPv6
      };

      client = new MongoClient(uri, options);
      await client.connect();
      db = client.db('ureb_system');
      gfsBucket = new GridFSBucket(db, { bucketName: 'uploads' });
      console.log('✅ Connected to MongoDB database');
    }
    return db;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
};

// Initialize database connection and run migrations
connectToDatabase().then(async (db) => {
  try {
    const reviewers = db.collection('reviewers');
    const students = db.collection('students');
    const users = db.collection('users');

    // Migration: Add 'title' field to existing reviewers that don't have it
    await reviewers.updateMany({ title: { $exists: false } }, { $set: { title: '' } });

    // Migration: Add 'reviewerType' field to existing reviewers that don't have it
    await reviewers.updateMany({ reviewerType: { $exists: false } }, { $set: { reviewerType: '' } });

    // Migration: Normalize department codes (Old codes to New codes)
    const deptMap = {
      'FNAS': 'FNAHS',
      'SEIC': 'SIEC',
      'Faculty of Agriculture and Life Science': 'FALS',
      'Faculty of Agriculture and Life Sciences': 'FALS',
      'Faculty of Teacher Education': 'FTED',
      'Faculty of Advance and International Studies': 'FAIS',
      'Faculty of Nursing and Allied Health Science': 'FNAHS',
      'Faculty of Nursing and Allied Health Sciences': 'FNAHS',
      'Faculty of Business Management': 'FBM',
      'Faculty of Criminology Justice Education': 'FCJE',
      'Faculty of Computing, Engineering, Technology': 'FACET',
      'Faculty of Humanities, Social Science & Communication': 'FHUSOCOM',
      'San Isidro Extension Campus': 'SIEC',
      'BanayBanay Extension Campus': 'BEC',
      'Cateel Extension Campus': 'CEC',
      'Baganga Extension Campus': 'BGEC',
      'Tarragona Extension Campus': 'TEC',
      'National Service Training Program': 'NSTP',
      'Indigenous Community Studies': 'ICS'
    };

    for (const [oldDept, newDept] of Object.entries(deptMap)) {
      await reviewers.updateMany({ department: oldDept }, { $set: { department: newDept } });
      await students.updateMany({ department: oldDept }, { $set: { department: newDept } });
      await users.updateMany({ department: oldDept }, { $set: { department: newDept } });
    }

    console.log('✅ Department normalization migration completed');
  } catch (error) {
    console.error('Migration error:', error);
  }
}).catch(console.error);

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer — memory storage (files buffered in RAM, then pushed to GridFS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
});

// Upload a single file buffer to GridFS; returns the stored filename.
// `metadata` records who sent the file and what it belongs to (senderName,
// senderEmail, source, proposalId, etc.) so files in uploads.files can be
// traced back to their owner later — e.g. to spot orphaned/useless files.
async function uploadToGridFS(file, metadata = {}) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
  return new Promise((resolve, reject) => {
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        fieldname: file.fieldname,
        uploadedAt: new Date(),
        ...metadata,
      },
    });
    uploadStream.end(file.buffer);
    uploadStream.on('finish', () => resolve(filename));
    uploadStream.on('error', reject);
  });
}

// Profile picture multer config (memory storage for GridFS, images only, 2 MB)
const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ok = /jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase())
      && /image\//.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});

// Upload profile picture buffer to GridFS
async function uploadProfilePicToGridFS(file, userId, metadata = {}) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `avatar-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`;
  return new Promise((resolve, reject) => {
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        source: 'profile-picture',
        userId,
        uploadedAt: new Date(),
        ...metadata,
      },
    });
    uploadStream.end(file.buffer);
    uploadStream.on('finish', () => resolve(filename));
    uploadStream.on('error', reject);
  });
}

// Delete file from GridFS by filename
async function deleteFromGridFS(filename) {
  try {
    const files = await gfsBucket.find({ filename }).toArray();
    for (const file of files) {
      await gfsBucket.delete(file._id);
    }
  } catch (err) {
    console.error('Error deleting from GridFS:', err);
  }
}

// Shared nodemailer transporter (created once, reused for all emails)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  pool: true,          // keep connection pool alive
  maxConnections: 5,
  rateLimit: true
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Serve downloadable template files
const templatesDir = path.join(__dirname, 'templates');
app.use('/api/templates', express.static(templatesDir));

// Resolve a filename: local disk first (checks multiple paths), then GridFS fallback
async function resolveFile(filename) {
  const candidatePaths = [
    path.join(uploadsDir, filename),
    path.join(process.cwd(), 'uploads', filename),
  ];
  for (const diskPath of candidatePaths) {
    if (fs.existsSync(diskPath)) {
      console.log('[resolveFile] found on disk:', diskPath);
      return { source: 'disk', diskPath };
    }
  }
  try {
    const gridFiles = await gfsBucket.find({ filename }).toArray();
    if (gridFiles.length) return { source: 'gridfs', meta: gridFiles[0] };
  } catch (err) {
    console.error('GridFS lookup error for', filename, err.message);
  }
  console.log('[resolveFile] NOT FOUND:', filename, '| uploadsDir:', uploadsDir, '| cwd:', process.cwd());
  return null;
}

const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.txt': 'text/plain',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// Diagnostic endpoint — disabled in production for security
app.get('/api/debug-paths', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const testFile = 'urebForm16-1772010333565-744759165.pdf';
  const testPath = path.join(uploadsDir, testFile);
  res.json({
    __dirname,
    uploadsDir,
    testPath,
    testExists: fs.existsSync(testPath),
    uploadsDirExists: fs.existsSync(uploadsDir)
  });
});

// Download endpoint — disk first, then GridFS fallback (Sanitized against path traversal)
app.get('/api/download/*', async (req, res) => {
  const rawParam = req.params[0] || '';
  // Strip path directory components to prevent path traversal attacks (../)
  const filename = path.basename(rawParam);
  const originalName = req.query.name ? path.basename(req.query.name) : filename;
  console.log('[download] requested:', filename);
  try {
    const resolved = await resolveFile(filename);
    console.log('[download] resolved:', resolved ? resolved.source : 'NOT FOUND', resolved?.diskPath || '');
    if (!resolved) return res.status(404).json({ error: 'File not found' });
    const mime = resolved.meta?.contentType
      || MIME_MAP[path.extname(filename).toLowerCase()]
      || 'application/octet-stream';
    res.setHeader('Content-Disposition', `attachment; filename="${originalName.replace(/"/g, '')}"`);
    res.setHeader('Content-Type', mime);
    if (resolved.source === 'gridfs') {
      gfsBucket.openDownloadStreamByName(filename).pipe(res);
    } else {
      const stream = fs.createReadStream(resolved.diskPath);
      stream.on('error', (err) => {
        console.error('[download] stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Read error' });
      });
      stream.pipe(res);
    }
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// View endpoint — disk first, then GridFS fallback, inline for browser rendering (Sanitized)
app.get('/api/view/*', async (req, res) => {
  const rawParam = req.params[0] || '';
  const filename = path.basename(rawParam);
  console.log('[view] requested filename:', filename);
  try {
    const resolved = await resolveFile(filename);
    console.log('[view] resolved:', resolved);
    if (!resolved) return res.status(404).json({ error: 'File not found' });
    const mime = resolved.meta?.contentType
      || MIME_MAP[path.extname(filename).toLowerCase()]
      || 'application/octet-stream';
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Type', mime);
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    if (resolved.source === 'gridfs') {
      gfsBucket.openDownloadStreamByName(filename).pipe(res);
    } else {
      const stream = fs.createReadStream(resolved.diskPath);
      stream.on('error', (err) => {
        console.error('[view] stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Read error' });
      });
      stream.pipe(res);
    }
  } catch (err) {
    console.error('View error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Collections
const collections = {
  users: 'users',
  students: 'students',
  reviewers: 'reviewers',
  proposals: 'proposals',
  reviews: 'reviews',
  messages: 'messages',
  notifications: 'notifications',
  assignments: 'assignments',
  user_hidden_items: 'user_hidden_items'
};

// A Researcher/Reviewer counts as "active" for the Admin Dashboard's realtime
// stat cards if a heartbeat was received within this window. The frontend
// pings every 60s while a Researcher/Reviewer tab is open, so this must be
// comfortably larger than that interval to tolerate a couple of missed beats.
const ACTIVE_SESSION_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

const STUDENT_ASSIGNMENT_FILE_KEYS = [
  'proposal', 'approvalSheet', 'urebForm2', 'applicationForm6',
  'accomplishedForm8', 'accomplishedForm10A', 'instrumentTool', 'ethicsReviewFee',
  'sampleForm1', 'sampleForm2',
];

const ADMIN_ASSIGNMENT_FILE_KEYS = [
  'urebForm16', 'urebForm10B', 'urebForm11', 'urebForm2', 'urebForm6',
  'urebForm7', 'urebForm8A', 'urebForm10A', 'approvedProposal',
  'questionnaire', 'attachment', 'adminAttachment',
];

const pickFilesByKeys = (filesObj, keys) => {
  const out = {};
  if (!filesObj || typeof filesObj !== 'object') return out;
  for (const key of keys) {
    if (filesObj[key]) out[key] = filesObj[key];
  }
  return out;
};

const pickStudentAssignmentFiles = (filesObj) => pickFilesByKeys(filesObj, STUDENT_ASSIGNMENT_FILE_KEYS);
const pickAdminAssignmentFiles = (filesObj) => {
  const picked = pickFilesByKeys(filesObj, ADMIN_ASSIGNMENT_FILE_KEYS);
  // The admin UI lets admins add any number of attachment slots, submitted under
  // dynamically-generated field names (attachment_0, attachment_<timestamp>_<n>, ...)
  // that don't match the fixed whitelist above. Without this, those files would be
  // silently dropped on the next reassignment since they'd never be "preserved".
  if (filesObj && typeof filesObj === 'object') {
    for (const key of Object.keys(filesObj)) {
      if (/^attachment(_|$)/.test(key) && filesObj[key]) picked[key] = filesObj[key];
    }
  }
  return picked;
};

const normalizeProposalFileFields = (proposal) => {
  if (!proposal) return proposal;

  const studentFiles = pickStudentAssignmentFiles(proposal.studentFiles || proposal.files || {});
  const adminFiles = pickAdminAssignmentFiles(proposal.adminFiles || proposal.files || {});

  return {
    ...proposal,
    studentFiles,
    adminFiles,
    files: { ...studentFiles, ...adminFiles },
  };
};

const normalizeProposalResponse = (proposal) =>
  normalizeStudentProposalAdminSeen(normalizeProposalFileFields(proposal));

const escapeRegexEmail = (email) => String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const emailRegexFilter = (email) => ({
  $regex: new RegExp(`^${escapeRegexEmail(email)}$`, 'i'),
});

const getAdminInboxRecipientEmails = (adminEmail) => {
  const recipients = new Set(['admin', String(adminEmail || '').trim()]);
  if (process.env.GMAIL_EMAIL) recipients.add(String(process.env.GMAIL_EMAIL).trim());
  return Array.from(recipients).filter(Boolean);
};

// "reviewer_to_admin" messages (the auto-generated "review submitted"/"review resubmitted"
// notices) and the "*_chat_to_admin" Messenger chat types (see below) are addressed to admin
// only — they must never echo back into the sender's own Messages inbox, which is meant to
// show admin's replies to them, not their own outgoing messages.
const excludeReviewerToAdminEcho = {
  type: { $in: ['reviewer_to_admin', 'reviewer_chat_to_admin', 'student_chat_to_admin'] },
};

const buildUserInboxQuery = (userEmail) => ({
  $and: [
    {
      $or: [
        { recipientEmail: emailRegexFilter(userEmail) },
        { senderEmail: emailRegexFilter(userEmail) },
      ],
    },
    { $nor: [excludeReviewerToAdminEcho] },
  ],
});

// Messenger chat messages ("student_chat_to_admin"/"reviewer_chat_to_admin", written by the
// admin<->researcher and admin<->reviewer chat send endpoints) are excluded here on purpose —
// they live only in the new chat UI. "Files And Messages Submitted" keeps showing everything
// else addressed to admin: the "student_to_admin"/"reviewer_to_admin" auto-generated notices
// (review submitted/resubmitted, file resubmissions) that carry actual submitted files.
const excludeChatOnlyTypesFromAdminInbox = {
  type: { $in: ['student_chat_to_admin', 'reviewer_chat_to_admin'] },
};

const buildAdminInboxQuery = (adminEmail) => {
  const recipients = getAdminInboxRecipientEmails(adminEmail);
  return {
    $and: [
      {
        $or: [
          { type: 'student_to_admin' },
          { type: 'reviewer_to_admin' },
          ...recipients.map((r) => ({ recipientEmail: emailRegexFilter(r) })),
        ],
      },
      {
        $nor: recipients.map((r) => ({ senderEmail: emailRegexFilter(r) })),
      },
      { $nor: [excludeChatOnlyTypesFromAdminInbox] },
    ],
  };
};

const isAdminAccount = async (db, email) => {
  if (!email) return false;
  const cleanEmail = String(email).trim().toLowerCase();

  // Explicit admin identifiers
  if (cleanEmail === 'admin' || cleanEmail === 'administrator' || cleanEmail === 'admin@ureb.local') return true;
  if (process.env.GMAIL_EMAIL && cleanEmail === process.env.GMAIL_EMAIL.trim().toLowerCase()) return true;

  // Check reviewers collection
  const reviewers = db.collection(collections.reviewers);
  const isReviewer = await reviewers.findOne({
    $or: [
      { email: emailRegexFilter(email) },
      { gmail: emailRegexFilter(email) }
    ]
  }, { projection: { _id: 1 } });
  if (isReviewer) return false;

  // Check students collection
  const students = db.collection(collections.students);
  const isStudent = await students.findOne({
    $or: [
      { email: emailRegexFilter(email) },
      { gmail: emailRegexFilter(email) }
    ]
  }, { projection: { _id: 1 } });
  if (isStudent) return false;

  // Check users collection for role
  const users = db.collection(collections.users);
  const user = await users.findOne({
    $or: [
      { email: emailRegexFilter(email) },
      { gmail: emailRegexFilter(email) }
    ]
  });
  if (user) {
    const role = String(user.role || '').toLowerCase().trim();
    if (role === 'reviewer' || role === 'student') return false;
    if (role === 'admin' || role === 'superadmin' || role === 'super-admin' || role === 'administrator' || role === 'root') return true;
  }

  return false;
};

const buildProposalIdMatchers = (proposalId) => {
  const matchers = [{ proposalId }, { proposalId: proposalId.toString() }];
  if (ObjectId.isValid(String(proposalId)) && String(new ObjectId(proposalId)) === String(proposalId)) {
    matchers.push({ proposalId: new ObjectId(proposalId) });
  }
  return matchers;
};

const mapProposalStatusToAssignmentStatus = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (normalized === 'completed') return 'Completed';
  if (normalized === 'under review') return 'Under Review';
  if (normalized === 'pending') return 'Pending';
  return status;
};

// Matchers for the proposal DOCUMENT itself (matched by _id or protocolCode) —
// unlike buildProposalIdMatchers, which matches the `proposalId` foreign-key
// field stored on assignment documents.
const buildProposalDocMatchers = (ref) => {
  const matchers = [];
  const str = String(ref || '').trim();
  if (!str) return matchers;

  if (ObjectId.isValid(str) && String(new ObjectId(str)) === str) {
    matchers.push({ _id: new ObjectId(str) });
  }

  matchers.push({ protocolCode: str });
  const normalizedProtocol = str.toUpperCase().replace(/\s+/g, '');
  if (normalizedProtocol !== str) {
    matchers.push({ protocolCode: normalizedProtocol });
  }

  return matchers;
};

const buildProposalRefMatchers = (proposalRef) => {
  const matchers = [];
  const ref = String(proposalRef || '').trim();
  if (!ref) return matchers;

  if (ObjectId.isValid(ref) && String(new ObjectId(ref)) === ref) {
    matchers.push(...buildProposalIdMatchers(ref));
  }

  const normalizedProtocol = ref.toUpperCase().replace(/\s+/g, '');
  if (normalizedProtocol) {
    matchers.push({ protocolCode: normalizedProtocol });
  }
  if (ref !== normalizedProtocol) {
    matchers.push({ protocolCode: ref });
  }

  return matchers;
};

const syncStudentAssignmentsForProposalStatus = async (db, proposalRef, status) => {
  const proposalMatchers = buildProposalRefMatchers(proposalRef);
  if (!proposalMatchers.length) return { matchedCount: 0, modifiedCount: 0 };

  const assignments = db.collection(collections.assignments);
  const assignmentStatus = mapProposalStatusToAssignmentStatus(status);

  return assignments.updateMany(
    {
      $and: [
        { $or: proposalMatchers },
        studentAssignmentFilter(),
      ],
    },
    { $set: { status: assignmentStatus, updatedAt: new Date() } }
  );
};

const markReviewerAssignmentsUnderReview = async (db, { proposalId, protocolCode, reviewerEmail, decision }) => {
  if (!reviewerEmail) return { matchedCount: 0, modifiedCount: 0 };

  const assignments = db.collection(collections.assignments);
  const isSecondary = String(decision || '').toLowerCase() === 'secondary_file';
  const normalizedProtocol = String(protocolCode || '').toUpperCase().replace(/\s+/g, '');

  const proposalMatchers = [];
  if (proposalId) {
    proposalMatchers.push(...buildProposalIdMatchers(proposalId));
  }
  if (normalizedProtocol) {
    proposalMatchers.push({ protocolCode: normalizedProtocol });
  }
  if (!proposalMatchers.length) return { matchedCount: 0, modifiedCount: 0 };

  const pendingStatusMatch = {
    $or: [
      { status: { $regex: /^pending$/i } },
      { status: { $exists: false } },
      { status: '' },
    ],
  };

  const buildUpdateQuery = (sourceFilter) => {
    const clauses = [
      { $or: proposalMatchers },
      { reviewerEmail: emailRegexFilter(reviewerEmail) },
      pendingStatusMatch,
    ];
    if (sourceFilter) clauses.splice(2, 0, sourceFilter);
    return { $and: clauses };
  };

  let result = await assignments.updateMany(
    buildUpdateQuery(isSecondary ? adminAssignmentFilter() : studentAssignmentFilter()),
    { $set: { status: 'Under Review', updatedAt: new Date() } }
  );

  if (result.matchedCount === 0 && !isSecondary) {
    result = await assignments.updateMany(
      buildUpdateQuery(null),
      { $set: { status: 'Under Review', updatedAt: new Date() } }
    );
  }

  return result;
};

const inferAssignmentSource = (assignment) => {
  if (assignment.assignmentSource === 'student' || assignment.assignmentSource === 'admin') {
    return assignment.assignmentSource;
  }
  const keys = Object.keys(assignment.assignedFiles || {});
  if (keys.some((k) => STUDENT_ASSIGNMENT_FILE_KEYS.includes(k))) return 'student';
  if (String(assignment.assignedBy || '').toLowerCase() === 'admin') return 'admin';
  return 'student';
};

const studentAssignmentFilter = () => ({
  $or: [
    { assignmentSource: 'student' },
    { assignmentSource: { $exists: false }, assignedBy: { $ne: 'admin' } },
  ],
});

const adminAssignmentFilter = () => ({
  $or: [
    { assignmentSource: 'admin' },
    { assignmentSource: { $exists: false }, assignedBy: 'admin' },
  ],
});

const ensureStudentAssignmentForProposal = async (db, proposal) => {
  const prelimEmail = proposal.preliminaryReviewer || proposal.reviewers?.reviewer1;
  if (!prelimEmail || !proposal._id) return null;

  const assignments = db.collection(collections.assignments);
  const reviewers = db.collection(collections.reviewers);
  const proposalMatchers = buildProposalIdMatchers(proposal._id);

  const existingStudent = await assignments.findOne({
    $and: [
      { reviewerEmail: emailRegexFilter(prelimEmail) },
      { $or: proposalMatchers },
      studentAssignmentFilter(),
    ],
  });
  if (existingStudent) return existingStudent;

  const studentFiles = pickStudentAssignmentFiles(proposal.studentFiles || proposal.files || {});
  if (Object.keys(studentFiles).length === 0) return null;

  const reviewer = await reviewers.findOne({ email: emailRegexFilter(prelimEmail) });
  const resolvedEmail = reviewer?.email || String(prelimEmail).trim();
  const resolvedName = proposal.preliminaryReviewerName
    || reviewer?.name
    || `${reviewer?.firstName || ''} ${reviewer?.lastName || ''}`.trim()
    || resolvedEmail;
  const baseDate = proposal.submissionDate || proposal.createdAt || new Date();

  const doc = {
    proposalId: proposal._id,
    reviewerId: reviewer?._id || null,
    reviewerEmail: resolvedEmail,
    reviewerName: resolvedName,
    protocolCode: null,
    researchTitle: proposal.researchTitle || 'Untitled Proposal',
    proponent: proposal.proponent || proposal.studentName || 'Unknown',
    assignedFiles: studentFiles,
    reviewPeriod: {
      startDate: baseDate,
      endDate: new Date(new Date(baseDate).getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    status: 'Pending',
    assignedBy: 'Student',
    assignmentSource: 'student',
    studentEmail: proposal.studentEmail || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await assignments.insertOne(doc);
  console.log(`[repair] Recreated student assignment for proposal ${proposal._id} → ${resolvedEmail}`);
  return doc;
};

const ensureReviewerAssignmentsForProposal = async (db, proposal) => {
  if (!proposal || !proposal._id) return;
  const assignments = db.collection(collections.assignments);
  const reviewers = db.collection(collections.reviewers);
  const proposalMatchers = buildProposalIdMatchers(proposal._id);

  // 1. Preliminary Reviewer
  const prelimEmail = proposal.preliminaryReviewer || proposal.reviewers?.reviewer1;
  if (prelimEmail) {
    const existingStudent = await assignments.findOne({
      $and: [
        { reviewerEmail: emailRegexFilter(prelimEmail) },
        { $or: proposalMatchers },
      ],
    });
    if (!existingStudent) {
      await ensureStudentAssignmentForProposal(db, proposal);
    }
  }

  // 2. Secondary Reviewer 1 (Chair)
  const sec1Email = proposal.secondaryReviewer1 || proposal.reviewers?.reviewer2;
  if (sec1Email) {
    const existingSec1 = await assignments.findOne({
      $and: [
        { reviewerEmail: emailRegexFilter(sec1Email) },
        { $or: proposalMatchers },
      ],
    });
    const allFiles = {
      ...pickStudentAssignmentFiles(proposal.studentFiles || proposal.files || {}),
      ...pickAdminAssignmentFiles(proposal.adminFiles || proposal.files || {}),
      ...(proposal.files || {}),
    };
    if (!existingSec1) {
      const reviewer = await reviewers.findOne({ email: emailRegexFilter(sec1Email) });
      const resolvedEmail = reviewer?.email || String(sec1Email).trim();
      const resolvedName = reviewer?.name
        || `${reviewer?.firstName || ''} ${reviewer?.lastName || ''}`.trim()
        || resolvedEmail;
      const startDate = proposal.reviewPeriod?.startDate || proposal.startDate || proposal.createdAt || new Date();
      const endDate = proposal.reviewPeriod?.endDate || proposal.endDate || new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000);

      await assignments.insertOne({
        proposalId: proposal._id,
        reviewerId: reviewer?._id || null,
        reviewerEmail: resolvedEmail,
        reviewerName: resolvedName,
        reviewerRole: 'Chair',
        secondaryReviewer1: sec1Email,
        secondaryReviewer2: sec2Email,
        protocolCode: proposal.protocolCode || null,
        researchTitle: proposal.researchTitle || 'Untitled Proposal',
        proponent: proposal.proponent || proposal.studentName || 'Unknown',
        studentEmail: proposal.studentEmail || '',
        initialReviewDecision: proposal.initialReviewDecision || null,
        assignedFiles: allFiles,
        reviewPeriod: { startDate: new Date(startDate), endDate: new Date(endDate) },
        status: 'Pending',
        assignedBy: 'admin',
        assignmentSource: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[repair] Auto-created assignment for Chair ${sec1Email} on proposal ${proposal._id}`);
    } else {
      const mergedFiles = { ...allFiles, ...(existingSec1.assignedFiles || {}) };
      if (Object.keys(mergedFiles).length !== Object.keys(existingSec1.assignedFiles || {}).length) {
        await assignments.updateOne(
          { _id: existingSec1._id },
          { $set: { assignedFiles: mergedFiles, protocolCode: proposal.protocolCode || existingSec1.protocolCode, updatedAt: new Date() } }
        );
      }
    }
  }

  // 3. Secondary Reviewer 2 (Member)
  const sec2Email = proposal.secondaryReviewer2 || proposal.reviewers?.reviewer3;
  if (sec2Email && sec2Email !== sec1Email) {
    const existingSec2 = await assignments.findOne({
      $and: [
        { reviewerEmail: emailRegexFilter(sec2Email) },
        { $or: proposalMatchers },
      ],
    });
    const allFiles = {
      ...pickStudentAssignmentFiles(proposal.studentFiles || proposal.files || {}),
      ...pickAdminAssignmentFiles(proposal.adminFiles || proposal.files || {}),
      ...(proposal.files || {}),
    };
    if (!existingSec2) {
      const reviewer = await reviewers.findOne({ email: emailRegexFilter(sec2Email) });
      const resolvedEmail = reviewer?.email || String(sec2Email).trim();
      const resolvedName = reviewer?.name
        || `${reviewer?.firstName || ''} ${reviewer?.lastName || ''}`.trim()
        || resolvedEmail;
      const startDate = proposal.reviewPeriod?.startDate || proposal.startDate || proposal.createdAt || new Date();
      const endDate = proposal.reviewPeriod?.endDate || proposal.endDate || new Date(new Date(startDate).getTime() + 14 * 24 * 60 * 60 * 1000);

      await assignments.insertOne({
        proposalId: proposal._id,
        reviewerId: reviewer?._id || null,
        reviewerEmail: resolvedEmail,
        reviewerName: resolvedName,
        reviewerRole: 'Member',
        secondaryReviewer1: sec1Email,
        secondaryReviewer2: sec2Email,
        protocolCode: proposal.protocolCode || null,
        researchTitle: proposal.researchTitle || 'Untitled Proposal',
        proponent: proposal.proponent || proposal.studentName || 'Unknown',
        studentEmail: proposal.studentEmail || '',
        initialReviewDecision: proposal.initialReviewDecision || null,
        assignedFiles: allFiles,
        reviewPeriod: { startDate: new Date(startDate), endDate: new Date(endDate) },
        status: 'Pending',
        assignedBy: 'admin',
        assignmentSource: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[repair] Auto-created assignment for Member ${sec2Email} on proposal ${proposal._id}`);
    } else {
      const mergedFiles = { ...allFiles, ...(existingSec2.assignedFiles || {}) };
      if (Object.keys(mergedFiles).length !== Object.keys(existingSec2.assignedFiles || {}).length) {
        await assignments.updateOne(
          { _id: existingSec2._id },
          { $set: { assignedFiles: mergedFiles, protocolCode: proposal.protocolCode || existingSec2.protocolCode, updatedAt: new Date() } }
        );
      }
    }
  }
};

const cleanDuplicateAssignments = async (db, reviewerEmail) => {
  if (!reviewerEmail) return;
  try {
    const assignments = db.collection(collections.assignments);
    const list = await assignments.find({
      reviewerEmail: emailRegexFilter(reviewerEmail),
    }).sort({ updatedAt: -1, createdAt: -1 }).toArray();

    const seen = new Set();
    for (const item of list) {
      const pId = item.proposalId ? String(item.proposalId).trim() : '';
      const pTitle = item.researchTitle ? String(item.researchTitle).trim().toLowerCase() : '';
      const pCode = item.protocolCode ? String(item.protocolCode).trim().toUpperCase() : '';
      const key = pId || pTitle || pCode || String(item._id);

      if (seen.has(key)) {
        await assignments.deleteOne({ _id: item._id });
        console.log(`[cleanup] Deleted duplicate assignment ${item._id} for reviewer ${reviewerEmail}`);
      } else {
        seen.add(key);
      }
    }
  } catch (err) {
    console.error('Error cleaning duplicate assignments:', err);
  }
};

const assignPreliminaryToStudentProposal = async (db, proposalId, department, preliminaryReviewerEmail) => {
  if (!ObjectId.isValid(String(proposalId))) {
    throw new Error('Invalid proposal ID');
  }

  const objectId = new ObjectId(proposalId);
  const proposals = db.collection(collections.proposals);
  const assignments = db.collection(collections.assignments);
  const reviewers = db.collection(collections.reviewers);
  const notifications = db.collection(collections.notifications);

  const proposal = await proposals.findOne({ _id: objectId });
  if (!proposal) throw new Error('Proposal not found');
  if (!proposal.studentEmail || !String(proposal.studentEmail).trim()) {
    throw new Error('This proposal is not a student submission');
  }

  const reviewer = await reviewers.findOne({ email: emailRegexFilter(preliminaryReviewerEmail) });
  if (!reviewer) throw new Error('Reviewer not found');

  const reviewerType = String(reviewer.reviewerType || '').toLowerCase();
  if (reviewerType === 'secondary') {
    throw new Error('Selected reviewer must be a preliminary reviewer');
  }

  const deptNorm = String(department || '').trim();
  const reviewerDept = String(reviewer.department || '').trim();
  if (deptNorm && reviewerDept
    && deptNorm.toUpperCase() !== reviewerDept.toUpperCase()) {
    throw new Error('Reviewer does not belong to the selected department');
  }

  const resolvedEmail = reviewer.email;
  const resolvedName = reviewer.name
    || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim()
    || resolvedEmail;

  await proposals.updateOne(
    { _id: objectId },
    {
      $set: {
        department: deptNorm,
        preliminaryReviewer: resolvedEmail,
        preliminaryReviewerName: resolvedName,
        status: 'Under Review',
        reviewers: {
          reviewer1: resolvedEmail,
          reviewer2: proposal.reviewers?.reviewer2 || null,
          reviewer3: proposal.reviewers?.reviewer3 || null,
        },
        updatedAt: new Date(),
      },
    }
  );

  const proposalMatchers = buildProposalIdMatchers(objectId);
  await assignments.deleteMany({
    $and: [{ $or: proposalMatchers }, studentAssignmentFilter()],
  });

  const updatedProposal = await proposals.findOne({ _id: objectId });
  const assignment = await ensureStudentAssignmentForProposal(db, updatedProposal);

  await notifications.insertOne({
    type: 'assignment',
    title: 'New Research Assigned',
    message: `You have been assigned "${updatedProposal.researchTitle || 'Untitled'}" for preliminary review (submitted by ${updatedProposal.proponent || updatedProposal.studentEmail}).`,
    proposalId: objectId.toString(),
    recipientEmail: resolvedEmail,
    read: false,
    createdAt: new Date(),
  });

  return { proposal: updatedProposal, assignment };
};

// API Routes

// Health / warmup ping
app.get('/api/ping', (req, res) => {
  res.json({ ok: true });
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for email: ${email}`);

    const lockStatus = getLoginLockStatus(email);
    if (lockStatus.locked) {
      console.log(`[AUTH] Login blocked — account locked: ${email}`);
      return res.status(429).json({ success: false, error: formatLockoutMessage(lockStatus.retryAfterMs), locked: true });
    }

    if (await rejectIfTurnstileInvalid(req, res)) return;

    const db = getDatabase();
    const users = db.collection(collections.users);
    const students = db.collection(collections.students);
    const reviewers = db.collection(collections.reviewers);

    // Check in users collection first (this includes admin users)
    let user = await users.findOne({ email });
    let userType = 'user';

    if (user) {
      console.log(`Found user in users collection: ${JSON.stringify({ email: user.email, role: user.role, name: user.name })}`);
    }

    // If not found in users, check students collection
    if (!user) {
      user = await findStudentByLoginEmail(students, email);
      userType = 'student';
      if (user) {
        console.log(`Found user in students collection: ${JSON.stringify({ email: user.email, gmail: user.gmail })}`);
      }
    }

    // If not found in users or students, check reviewers collection
    if (!user) {
      user = await reviewers.findOne({ email });
      userType = 'reviewer';
      if (user) {
        console.log(`Found user in reviewers collection: ${JSON.stringify({ email: user.email, role: user.role })}`);
      }
    }

    if (!user) {
      console.log(`User not found: ${email}`);
      const remaining = registerFailedLoginAttempt(email);
      if (remaining === 0) {
        return res.status(429).json({ success: false, error: formatLockoutMessage(LOGIN_LOCKOUT_MS), field: 'email', locked: true });
      }
      return res.json({
        success: false,
        error: `Incorrect email. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your account is temporarily locked.`,
        field: 'email',
      });
    }

    if (user.password !== password) {
      console.log(`Password mismatch for: ${email}`);
      const remaining = registerFailedLoginAttempt(email);
      if (remaining === 0) {
        return res.status(429).json({ success: false, error: formatLockoutMessage(LOGIN_LOCKOUT_MS), field: 'password', locked: true });
      }
      return res.json({
        success: false,
        error: `Incorrect password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before your account is temporarily locked.`,
        field: 'password',
      });
    }

    // Successful credential check — clear any prior failed-attempt history.
    clearLoginAttempts(email);

    // Check if student account is disabled
    if (userType === 'student' && user.disabled === true) {
      console.log(`Disabled account login attempt: ${email}`);
      return res.json({ success: false, error: 'Your account has been disabled. Please contact the administrator.' });
    }

    // Update last login time
    if (userType === 'user') {
      await users.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
    } else if (userType === 'student') {
      await students.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
    } else if (userType === 'reviewer') {
      await reviewers.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
    }

    // Ensure proper role is set for routing
    let role = user.role;
    if (userType === 'user' && !role) {
      // Default to 'admin' if user is in users collection but no role is specified
      role = 'admin';
      console.log(`Defaulting role to 'admin' for user: ${email}`);
    } else if (userType === 'student') {
      role = 'student';
    } else if (userType === 'reviewer') {
      role = 'reviewer';
    } else if (userType === 'user') {
      // Handle various admin roles - normalize them to 'admin' for frontend routing
      if (role === 'superadmin' || role === 'super-admin' || role === 'root' || role === 'administrator') {
        role = 'admin';
        console.log(`Normalizing ${user.role} role to 'admin' for user: ${email}`);
      }
    }

    console.log(`Login successful for ${email}: role=${role}, userType=${userType}`);

    // Build user response with profile picture for students
    const userResponse = {
      email: user.email || user.gmail || email,
      name: user.name || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' ') || user.email || email,
      role: role,
      originalRole: user.role || role,
      userType: userType,
      lastLogin: new Date()
    };

    // Include profile picture for students and reviewers (from GridFS)
    console.log('[DEBUG] Login - user.profilePictureGridFS:', user.profilePictureGridFS);
    if (userType === 'student' && user.profilePictureGridFS) {
      userResponse.profilePicture = `/api/student/profile/picture/${user.profilePictureGridFS}`;
      console.log('[DEBUG] Login - Added student profilePicture to response:', userResponse.profilePicture);
    } else if (userType === 'reviewer' && user.profilePictureGridFS) {
      userResponse.profilePicture = `/api/reviewer/profile/picture/${user.profilePictureGridFS}`;
      console.log('[DEBUG] Login - Added reviewer profilePicture to response:', userResponse.profilePicture);
    } else if (userType === 'user' && user.profilePictureGridFS) {
      userResponse.profilePicture = `/api/admin/profile/picture/${user.profilePictureGridFS}`;
      console.log('[DEBUG] Login - Added admin profilePicture to response:', userResponse.profilePicture);
    }

    // Admin session token — required by requireAdminAuth on admin-only bulk-data routes.
    if (role === 'admin') {
      userResponse.token = signAuthToken({ email: userResponse.email, role, userType });
    }

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Heartbeat — called periodically by logged-in Researcher/Reviewer clients so the
// Admin Dashboard's "Active Researchers" / "Active Reviewers" stat cards can show
// who is actually online right now (see ACTIVE_SESSION_WINDOW_MS).
app.post('/api/auth/heartbeat', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'email and role are required' });
    }

    const db = getDatabase();
    const now = new Date();

    if (role === 'student') {
      const students = db.collection(collections.students);
      const student = await findStudentByLoginEmail(students, email);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Researcher not found' });
      }
      await students.updateOne({ _id: student._id }, { $set: { lastActive: now } });
    } else if (role === 'reviewer') {
      const reviewers = db.collection(collections.reviewers);
      const result = await reviewers.updateOne({ email }, { $set: { lastActive: now } });
      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, error: 'Reviewer not found' });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported role for heartbeat' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Sign-off — called on explicit logout, or via sendBeacon when the tab/browser
// closes, so a Researcher/Reviewer drops out of the Admin Dashboard's "Active"
// counts immediately instead of waiting out ACTIVE_SESSION_WINDOW_MS.
app.post('/api/auth/signoff', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'email and role are required' });
    }

    const db = getDatabase();

    if (role === 'student') {
      const students = db.collection(collections.students);
      const student = await findStudentByLoginEmail(students, email);
      if (student) {
        await students.updateOne({ _id: student._id }, { $unset: { lastActive: '' } });
      }
    } else if (role === 'reviewer') {
      const reviewers = db.collection(collections.reviewers);
      await reviewers.updateOne({ email }, { $unset: { lastActive: '' } });
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported role for signoff' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Signoff error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Student Registration
app.post('/api/auth/register', async (req, res) => {
  console.log('========== REGISTRATION REQUEST RECEIVED ==========');
  try {
    // Log all keys in req.body to verify gender is present
    console.log('[DEBUG] Request body keys:', Object.keys(req.body));
    console.log('[DEBUG] Raw req.body.gender:', req.body.gender);
    console.log('[DEBUG] Server /api/auth/register - full req.body:', JSON.stringify(req.body, null, 2));

    const { firstName, middleName, lastName, suffix, sex, gender, researcherType, department, program, email, password, role } = req.body;

    const emailNorm = (email || '').trim().toLowerCase();
    const sexNorm = ((sex || gender) != null && String(sex || gender).trim()) ? String(sex || gender).trim() : '';

    console.log('[DEBUG] Extracted sex/gender from destructuring:', sex || gender);
    console.log('[DEBUG] Computed sexNorm:', sexNorm);
    console.log('Registration request received:', { firstName, lastName, suffix, sex: sexNorm, researcherType, department, program, email: emailNorm });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);

    // Check if student already exists in students collection
    const existingStudent = await students.findOne({ email: emailNorm });

    if (existingStudent) {
      console.log('Student already exists:', existingStudent.email);
      return res.json({
        success: false,
        error: 'A student with this email already exists'
      });
    }

    // Also check if email exists in users collection
    const existingUser = await users.findOne({ email: emailNorm });
    if (existingUser) {
      console.log('Email already registered as user:', emailNorm);
      return res.json({
        success: false,
        error: 'This email is already registered'
      });
    }

    // Create new student
    const newStudent = {
      firstName,
      middleName: middleName || '',
      lastName,
      suffix: suffix || '',
      sex: sexNorm,
      gender: sexNorm,
      researcherType: researcherType || '',
      department,
      program: program || '',
      email: emailNorm,
      password,
      role: role || 'student',
      coMembers: [],
      createdAt: new Date(),
      lastLogin: null,
      status: 'active'
    };

    console.log('Creating new student:', { ...newStudent, password: '[HIDDEN]' });
    console.log('[DEBUG] About to insert - sex value:', newStudent.sex);
    const result = await students.insertOne(newStudent);
    console.log('[DEBUG] Insert result:', result);
    console.log('Student created successfully with ID:', result.insertedId);

    console.log('[DEBUG] Sending response with sex:', newStudent.sex);
    res.json({
      success: true,
      message: 'Registration successful',
      student: {
        _id: result.insertedId,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        suffix: newStudent.suffix,
        email: newStudent.email,
        sex: newStudent.sex,
        gender: newStudent.gender,
        researcherType: newStudent.researcherType,
        department: newStudent.department,
        program: newStudent.program
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// User operations
app.get('/api/users', requireAdminAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.collection(collections.users);
    const userList = await users.find({}).toArray();
    const sanitizedUsers = userList.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reviewers operations
app.get('/api/reviewers', requireAdminAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const reviewerList = await reviewers.find({}).toArray();
    res.json(reviewerList.map(r => reviewerProfilePayload(r)));
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public single-reviewer lookup by email — used by a reviewer's own dashboard
// to load their profile (name, department, profile picture, reviewer type).
// Unlike GET /api/reviewers this does not require admin auth, since it only
// ever discloses one reviewer's already-non-sensitive profile fields (the
// password is stripped by reviewerProfilePayload), not the full roster.
app.get('/api/reviewers/by-email/:email', async (req, res) => {
  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const email = String(req.params.email || '').toLowerCase();
    const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reviewer = await reviewers.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } });
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }
    res.json(reviewerProfilePayload(reviewer));
  } catch (error) {
    console.error('Error fetching reviewer by email:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reviewers', async (req, res) => {
  try {
    const db = getDatabase();
    const reviewers = db.collection('reviewers');

    const newReviewer = {
      ...req.body,
      createdAt: new Date().toISOString()
    };

    // Check if email already exists
    const existing = await reviewers.findOne({ email: req.body.email });
    if (existing) {
      return res.status(400).json({ error: 'Reviewer with this email already exists' });
    }

    const result = await reviewers.insertOne(newReviewer);
    res.status(201).json({ success: true, _id: result.insertedId, ...newReviewer });
  } catch (error) {
    console.error('Error creating reviewer:', error);
    res.status(500).json({ error: 'Server error adding reviewer' });
  }
});

// Students operations
app.get('/api/students', requireAdminAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.collection(collections.students);
    const studentList = await students.find({}).toArray();
    // Remove sensitive fields, and resolve profilePicture the same way
    // studentProfilePayload does — a current profilePictureGridFS must win
    // over a stale legacy profilePicture field, or old records show broken/missing photos.
    const sanitized = studentList.map((student) => {
      const { password, ...rest } = student;
      let profilePicture = rest.profilePicture || null;
      if (rest.profilePictureGridFS) {
        profilePicture = `/api/student/profile/picture/${rest.profilePictureGridFS}`;
      }
      return { ...rest, profilePicture };
    });
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update System Administrator role to superadmin
app.put('/api/users/update-superadmin', async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.collection(collections.users);

    // Find and update the System Administrator
    const result = await users.updateOne(
      { name: 'System Administrator' },
      { $set: { role: 'superadmin' } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'System Administrator not found' });
    }

    res.json({
      success: true,
      message: 'System Administrator role updated to superadmin',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating System Administrator role:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Admin recovery endpoint - creates a default admin account if none exists
app.post('/api/recover-admin', async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.collection(collections.users);

    // Check if any admin already exists
    const existingAdmin = await users.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin account already exists. Cannot create duplicate.'
      });
    }

    // Create default admin account
    const adminUser = {
      name: 'System Administrator',
      email: 'admin@ureb.local',
      password: 'admin123',
      role: 'superadmin',
      department: 'Administration',
      createdAt: new Date()
    };

    const result = await users.insertOne(adminUser);
    console.log('Admin account recovered:', result.insertedId);

    res.json({
      success: true,
      message: 'Admin account recovered successfully',
      admin: {
        _id: result.insertedId,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      loginCredentials: {
        email: adminUser.email,
        password: adminUser.password
      }
    });
  } catch (error) {
    console.error('Error recovering admin:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { name, email, password, role, department } = req.body;
    const db = getDatabase();
    const users = db.collection(collections.users);

    // Check if user already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Create new user with separate name fields
    const newUser = {
      name, // Keep full name for backward compatibility
      email,
      password,
      role: role || 'reviewer',
      department: department || 'Not specified',
      createdAt: new Date()
    };

    console.log('Creating new user:', newUser);
    const result = await users.insertOne(newUser);
    console.log('User created successfully:', result.insertedId);
    res.json({
      success: true,
      user: {
        _id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Enhanced user creation with separate name fields
app.post('/api/users/detailed', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { firstName, middleName, lastName, title, gender, email, password, role, department, reviewerType } = req.body;
    const db = getDatabase();

    // Choose collection based on role
    const collectionName = role === 'reviewer' ? collections.reviewers : collections.users;
    const collection = db.collection(collectionName);

    // Check if user already exists in both collections
    const existingUserInUsers = await db.collection(collections.users).findOne({ email });
    const existingUserInReviewers = await db.collection(collections.reviewers).findOne({ email });

    if (existingUserInUsers || existingUserInReviewers) {
      console.log('User already exists:', email);
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Create full name with title for backward compatibility
    const baseName = `${firstName} ${middleName || ''} ${lastName}`.replace(/\s+/g, ' ').trim();
    const prefixMap = { Doctor: 'Dr.', Engineer: 'Engr.', Professor: 'Prof.' };
    let fullName = baseName;
    if (title && prefixMap[title]) {
      fullName = `${prefixMap[title]} ${baseName}`;
    } else if (title === 'RN' || title === 'LPT' || title === 'MSN' || title === 'RN/LPT' || title === 'RN/MSN' || title === 'MIT') {
      fullName = `${baseName}, ${title}`;
    }

    // Create new user with separate name fields
    const newUser = {
      firstName,
      middleName: middleName || '',
      lastName,
      title: title || '',
      gender: gender || '',
      name: fullName, // Keep full name for backward compatibility
      email,
      password,
      role: role || 'reviewer',
      department: department || 'Not specified',
      reviewerType: reviewerType || '',
      createdAt: new Date()
    };

    console.log('Creating new user:', newUser);
    const result = await collection.insertOne(newUser);
    console.log('User created successfully:', result.insertedId);
    res.json({
      success: true,
      user: {
        _id: result.insertedId,
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        title: newUser.title,
        gender: newUser.gender,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        reviewerType: newUser.reviewerType
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update user endpoint
app.put('/api/users/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.collection(collections.users);
    const { id } = req.params;
    const updateData = req.body;

    // Remove _id from updateData if it exists
    if (updateData._id) {
      delete updateData._id;
    }

    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete user endpoint
app.delete('/api/users/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.collection(collections.users);
    const { id } = req.params;

    const result = await users.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update reviewer profile by email
app.put('/api/reviewers/profile', async (req, res) => {
  console.log('=== REVIEWER PROFILE ENDPOINT HIT ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body raw:', req.body);
  console.log('Request body JSON:', JSON.stringify(req.body, null, 2));

  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const { email, name, department } = req.body;

    console.log('Extracted email:', email);
    console.log('Extracted name:', name);
    console.log('Extracted department:', department);

    if (!email) {
      console.log('Email validation failed - email is missing');
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    if (!name) {
      console.log('Name validation failed - name is missing');
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    console.log('Updating reviewer profile for email:', email);
    console.log('Update data:', { name, department });

    // Check if reviewer exists
    const existingReviewer = await reviewers.findOne({ email: email });
    if (!existingReviewer) {
      console.log('Reviewer not found with email:', email);
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    console.log('Found reviewer:', existingReviewer);

    const updateFields = { name: name, updatedAt: new Date() };
    if (department !== undefined) {
      updateFields.department = department;
    }

    const result = await reviewers.updateOne(
      { email: email },
      { $set: updateFields }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    console.log('Profile update successful!');
    const updatedReviewer = await reviewers.findOne({ email: email });
    res.json({
      success: true,
      message: 'Profile updated successfully',
      reviewer: reviewerProfilePayload(updatedReviewer)
    });
  } catch (error) {
    console.error('Error updating reviewer profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

const COOLDOWN_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (1 month)

function checkPasswordCooldown(userDoc) {
  if (!userDoc || !userDoc.lastPasswordChange) {
    return { canChange: true };
  }
  const lastChange = new Date(userDoc.lastPasswordChange).getTime();
  const now = Date.now();
  const diff = now - lastChange;

  if (diff < COOLDOWN_PERIOD_MS) {
    const remainingMs = COOLDOWN_PERIOD_MS - diff;
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    const availableDate = new Date(lastChange + COOLDOWN_PERIOD_MS);
    const formattedDate = availableDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      canChange: false,
      remainingDays,
      availableDate: formattedDate,
      error: `Password can only be changed once a month. You can update your password again on ${formattedDate} (in ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}).`
    };
  }

  return { canChange: true };
}

// Change reviewer password
app.put('/api/reviewer/change-password', async (req, res) => {
  try {
    console.log('=== REVIEWER PASSWORD CHANGE REQUEST ===');
    console.log('Request body:', { email: req.body.email, hasCurrentPassword: !!req.body.currentPassword, hasNewPassword: !!req.body.newPassword });
    
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      console.log('Missing required fields');
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      console.log('New password too short');
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const reviewer = await reviewers.findOne({ email });
    console.log('Reviewer found:', reviewer ? { email: reviewer.email, hasPassword: !!reviewer.password, passwordLength: reviewer.password?.length } : null);
    
    if (!reviewer) {
      console.log('Reviewer not found');
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    // Check 1-month password change cooldown
    const cooldown = checkPasswordCooldown(reviewer);
    if (!cooldown.canChange) {
      console.log('Password change blocked by cooldown:', cooldown.error);
      return res.status(400).json({ success: false, error: cooldown.error, remainingDays: cooldown.remainingDays });
    }

    console.log('Password comparison:', {
      storedPassword: reviewer.password,
      providedPassword: currentPassword,
      match: reviewer.password === currentPassword
    });

    if (reviewer.password !== currentPassword) {
      console.log('Password mismatch');
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const result = await reviewers.updateOne(
      { email },
      { $set: { password: newPassword, lastPasswordChange: new Date(), updatedAt: new Date() } }
    );
    console.log('Update result:', result);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing reviewer password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update reviewer endpoint
app.put('/api/reviewers/:id', async (req, res) => {
  console.log('=== REVIEWER ID ENDPOINT HIT ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request method:', req.method);
  console.log('ID parameter:', req.params.id);
  console.log('Request body:', req.body);

  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const { id } = req.params;
    const updateData = req.body;

    console.log('Updating reviewer with ID:', id);
    console.log('Update data:', updateData);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ success: false, error: 'Invalid reviewer ID format' });
    }

    // Remove _id from updateData if it exists
    if (updateData._id) {
      delete updateData._id;
    }

    // Check if reviewer exists first
    const existingReviewer = await reviewers.findOne({ _id: new ObjectId(id) });
    if (!existingReviewer) {
      console.log('Reviewer not found with ID:', id);
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    // Check email uniqueness if email is being updated
    if (updateData.email) {
      const newEmail = updateData.email.toLowerCase().trim();
      const currentEmail = (existingReviewer.email || '').toLowerCase().trim();

      if (newEmail !== currentEmail) {
        const emailExists = await reviewers.findOne({
          email: newEmail,
          _id: { $ne: new ObjectId(id) }
        });
        if (emailExists) {
          return res.status(400).json({ success: false, error: 'Email is already in use by another reviewer' });
        }
      }
    }

    const result = await reviewers.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    // Cascade: when reviewer status changes, update their assignments accordingly
    if (updateData.status === 'completed' || updateData.status === 'pending') {
      const assignments = db.collection(collections.assignments);
      const reviewerEmail = existingReviewer.email;
      if (reviewerEmail) {
        const assignmentStatus = updateData.status === 'completed' ? 'Completed' : 'Pending';
        const escapedEmail = String(reviewerEmail).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await assignments.updateMany(
          { reviewerEmail: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } },
          { $set: { status: assignmentStatus } }
        );
      }
    }

    res.json({ success: true, message: 'Reviewer updated successfully' });
  } catch (error) {
    console.error('Error updating reviewer:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete reviewer endpoint
app.delete('/api/reviewers/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const { id } = req.params;

    const result = await reviewers.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    res.json({ success: true, message: 'Reviewer deleted successfully' });
  } catch (error) {
    console.error('Error deleting reviewer:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update student endpoint (admin) — only whitelisted fields; never copy reviewer fields like `title`
app.put('/api/students/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.collection(collections.students);
    const { id } = req.params;
    const body = { ...req.body };

    if (body._id) {
      delete body._id;
    }

    const existing = await students.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const allowedKeys = [
      'firstName',
      'middleName',
      'lastName',
      'suffix',
      'email',
      'sex',
      'gender',
      'researcherType',
      'department',
      'program',
      'role',
      'gmail',
      'disabled',
      'status',
      'coMembers',
      'facebookLink',
    ];

    const updateData = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }
    if (body.sex !== undefined) updateData.gender = body.sex;
    if (body.gender !== undefined) updateData.sex = body.gender;

    const fn = updateData.firstName !== undefined ? updateData.firstName : existing.firstName;
    const mn = updateData.middleName !== undefined ? updateData.middleName : existing.middleName;
    const ln = updateData.lastName !== undefined ? updateData.lastName : existing.lastName;
    const sfx = updateData.suffix !== undefined ? updateData.suffix : existing.suffix;
    const baseNameParts = [fn, mn, ln]
      .filter((p) => p != null && String(p).trim() !== '')
      .map((p) => String(p).trim());
    const baseName = baseNameParts.join(' ');
    updateData.name = sfx && String(sfx).trim() !== '' ? `${baseName} ${String(sfx).trim()}`.trim() : baseName;

    const result = await students.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData, $unset: { title: '' } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete student endpoint
app.delete('/api/students/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.collection(collections.students);
    const { id } = req.params;

    const result = await students.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ── Student Profile & Password endpoints ──────────────────────────────────────

/** Resolve a student by login email (matches `email` or `gmail`, case-insensitive). */
async function findStudentByLoginEmail(students, raw) {
  const q = (raw || '').trim();
  if (!q) return null;
  let s = await students.findOne({ email: q });
  if (!s) s = await students.findOne({ gmail: q });
  if (!s) {
    const lower = q.toLowerCase();
    s = await students.findOne({ $or: [{ email: lower }, { gmail: lower }] });
  }
  if (!s) {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${esc}$`, 'i');
    s = await students.findOne({ $or: [{ email: re }, { gmail: re }] });
  }
  return s;
}

function studentProfilePayload(student) {
  // Convert MongoDB document to plain object
  const plain = JSON.parse(JSON.stringify(student));
  const { password, sex, ...safe } = plain;
  const targetEmail = safe.email || safe.gmail || '';
  const sexVal = String(safe.sex || safe.gender || sex || '').trim();
  // Build profile picture URL from GridFS filename
  let profilePicture = safe.profilePicture || null;
  if (safe.profilePictureGridFS) {
    profilePicture = `/api/student/profile/picture/${safe.profilePictureGridFS}?t=${Date.now()}`;
  }
  return { ...safe, email: targetEmail, gmail: targetEmail, gender: sexVal, sex: sexVal, profilePicture };
}

function reviewerProfilePayload(reviewer) {
  if (!reviewer) return null;
  const plain = JSON.parse(JSON.stringify(reviewer));
  const { password, ...safe } = plain;
  let profilePicture = safe.profilePicture || null;
  if (safe.profilePictureGridFS) {
    profilePicture = `/api/reviewer/profile/picture/${safe.profilePictureGridFS}?t=${Date.now()}`;
  }
  return { ...safe, profilePicture };
}

function adminProfilePayload(user) {
  if (!user) return null;
  const plain = JSON.parse(JSON.stringify(user));
  const { password, ...safe } = plain;
  let profilePicture = safe.profilePicture || null;
  if (safe.profilePictureGridFS) {
    profilePicture = `/api/admin/profile/picture/${safe.profilePictureGridFS}?t=${Date.now()}`;
  }
  return { ...safe, profilePicture };
}

// GET student profile by email (or gmail), case-insensitive fallback
app.get('/api/student/profile', async (req, res) => {
  try {
    const raw = (req.query.email || '').trim();
    console.log('[DEBUG] GET /api/student/profile - query email:', raw);
    if (!raw) return res.status(400).json({ success: false, error: 'Email is required' });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await findStudentByLoginEmail(students, raw);
    if (!student) {
      console.log('[DEBUG] Student not found for email:', raw);
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    console.log('[DEBUG] Student found:', student.email, '| sex in DB:', student.sex || student.gender);

    res.json({ success: true, student: studentProfilePayload(student) });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT update student profile by email
app.put('/api/student/profile', async (req, res) => {
  try {
    const { email, firstName, middleName, lastName, suffix, sex, gender, researcherType, department, program, gmail, coMembers, facebookLink } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);
    const reviewers = db.collection(collections.reviewers);

    const student = await findStudentByLoginEmail(students, email);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const newEmail = (gmail !== undefined && gmail !== null && String(gmail).trim())
      ? String(gmail).trim().toLowerCase()
      : (email !== undefined && email !== null && String(email).trim() ? String(email).trim().toLowerCase() : undefined);

    if (newEmail && newEmail !== (student.email || '').toLowerCase() && newEmail !== (student.gmail || '').toLowerCase()) {
      // Check if new email is taken by another account
      const existingStudent = await students.findOne({ _id: { $ne: student._id }, $or: [{ email: newEmail }, { gmail: newEmail }] });
      const existingUser = await users.findOne({ email: newEmail });
      const existingReviewer = await reviewers.findOne({ email: newEmail });

      if (existingStudent || existingUser || existingReviewer) {
        return res.status(400).json({ success: false, error: 'This email address is already in use by another account' });
      }
    }

    const sexInput = sex !== undefined ? sex : gender;
    const sexVal = sexInput !== undefined ? (sexInput != null && String(sexInput).trim() ? String(sexInput).trim() : '') : undefined;

    const updateFields = {
      updatedAt: new Date(),
      ...(firstName !== undefined && { firstName }),
      ...(middleName !== undefined && { middleName }),
      ...(lastName !== undefined && { lastName }),
      ...(suffix !== undefined && { suffix }),
      ...(sexVal !== undefined && { sex: sexVal, gender: sexVal }),
      ...(researcherType !== undefined && { researcherType }),
      ...(department !== undefined && { department }),
      ...(program !== undefined && { program }),
      ...(newEmail !== undefined && { email: newEmail, gmail: newEmail }),
      ...(coMembers !== undefined && { coMembers: Array.isArray(coMembers) ? coMembers : [] }),
      ...(facebookLink !== undefined && { facebookLink }),
    };

    // Rebuild full name for backwards-compat
    const fn = firstName ?? student.firstName ?? '';
    const mn = middleName ?? student.middleName ?? '';
    const ln = lastName ?? student.lastName ?? '';
    const sfx = suffix ?? student.suffix ?? '';
    const baseName = [fn, mn, ln].filter(Boolean).join(' ');
    updateFields.name = sfx ? `${baseName} ${sfx}`.trim() : baseName;

    await students.updateOne({ _id: student._id }, { $set: updateFields });

    const updated = await students.findOne({ _id: student._id });
    res.json({
      success: true,
      student: studentProfilePayload(updated)
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT change student password
app.put('/api/student/password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const db = getDatabase();
    const students = db.collection(collections.students);

    const student = await findStudentByLoginEmail(students, email);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // Check 1-month password change cooldown
    const cooldown = checkPasswordCooldown(student);
    if (!cooldown.canChange) {
      return res.status(400).json({ success: false, error: cooldown.error, remainingDays: cooldown.remainingDays });
    }

    if (student.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await students.updateOne({ _id: student._id }, { $set: { password: newPassword, lastPasswordChange: new Date(), updatedAt: new Date() } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing student password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST upload/update student profile picture
app.post('/api/student/profile/picture', uploadProfilePic.single('profilePicture'), async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await findStudentByLoginEmail(students, email);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    // Delete old picture if exists
    if (student.profilePictureGridFS) {
      await deleteFromGridFS(student.profilePictureGridFS);
    }

    const filename = await uploadProfilePicToGridFS(req.file, student._id.toString(), {
      senderName: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || email,
      senderEmail: email,
      role: 'student',
    });

    await students.updateOne(
      { _id: student._id },
      { $set: { profilePictureGridFS: filename, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      profilePicture: `/api/student/profile/picture/${filename}`
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error uploading image' });
  }
});

// DELETE student profile picture
app.delete('/api/student/profile/picture', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await findStudentByLoginEmail(students, email);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    if (student.profilePictureGridFS) {
      await deleteFromGridFS(student.profilePictureGridFS);
      await students.updateOne(
        { _id: student._id },
        { $unset: { profilePictureGridFS: "" }, $set: { updatedAt: new Date() } }
      );
    }

    res.json({ success: true, message: 'Profile picture removed successfully' });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error removing image' });
  }
});

// GET student profile picture from GridFS
app.get('/api/student/profile/picture/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const db = getDatabase();

    // Attempt to find in GridFS first (Persistent)
    const files = await gfsBucket.find({ filename }).toArray();

    if (!files || files.length === 0) {
      console.log(`[GRIDFS] Student image NOT found: ${filename}, checking local fallback...`);
      // Fallback: check local uploads directory for legacy file-system images
      const localPath = path.resolve('uploads', 'profile-pictures', filename);
      if (fs.existsSync(localPath)) {
        return res.sendFile(path.resolve(localPath));
      }
      return res.status(404).json({ error: 'Image not found' });
    }

    console.log(`[GRIDFS] Serving student image: ${filename}`);
    res.setHeader('Content-Type', files[0].contentType || 'image/jpeg');
    // Ensure browser re-validates to avoid "disappearing" on cache expiration
    res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
    gfsBucket.openDownloadStreamByName(filename).pipe(res);
  } catch (error) {
    console.error('Error serving profile picture:', error);
    res.status(500).json({ error: 'Server error serving image' });
  }
});

// POST upload/update reviewer profile picture
app.post('/api/reviewer/profile/picture', uploadProfilePic.single('profilePicture'), async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' });

    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);

    // Find reviewer (case-insensitive email)
    const reviewer = await reviewers.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!reviewer) return res.status(404).json({ success: false, error: 'Reviewer not found' });

    // Delete old picture if exists
    if (reviewer.profilePictureGridFS) {
      await deleteFromGridFS(reviewer.profilePictureGridFS);
    }

    const filename = await uploadProfilePicToGridFS(req.file, reviewer._id.toString(), {
      senderName: reviewer.name || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || email,
      senderEmail: email,
      role: 'reviewer',
    });

    await reviewers.updateOne(
      { _id: reviewer._id },
      { $set: { profilePictureGridFS: filename, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      profilePicture: `/api/reviewer/profile/picture/${filename}`
    });
  } catch (error) {
    console.error('Error uploading reviewer profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error uploading image' });
  }
});

// DELETE reviewer profile picture
app.delete('/api/reviewer/profile/picture', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const reviewer = await reviewers.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!reviewer) return res.status(404).json({ success: false, error: 'Reviewer not found' });

    if (reviewer.profilePictureGridFS) {
      await deleteFromGridFS(reviewer.profilePictureGridFS);
      await reviewers.updateOne(
        { _id: reviewer._id },
        { $unset: { profilePictureGridFS: "" }, $set: { updatedAt: new Date() } }
      );
    }

    res.json({ success: true, message: 'Profile picture removed successfully' });
  } catch (error) {
    console.error('Error removing reviewer profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error removing image' });
  }
});

// GET reviewer profile picture from GridFS
app.get('/api/reviewer/profile/picture/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const db = getDatabase();

    // Attempt to find in GridFS first (Persistent)
    const files = await gfsBucket.find({ filename }).toArray();

    if (!files || files.length === 0) {
      console.log(`[GRIDFS] Reviewer image NOT found: ${filename}, checking local fallback...`);
      // Fallback: check local uploads directory for legacy file-system images
      const localPath = path.resolve('uploads', 'profile-pictures', filename);
      if (fs.existsSync(localPath)) {
        return res.sendFile(path.resolve(localPath));
      }
      return res.status(404).json({ error: 'Image not found' });
    }

    console.log(`[GRIDFS] Serving reviewer image: ${filename}`);
    res.setHeader('Content-Type', files[0].contentType || 'image/jpeg');
    // Ensure browser re-validates to avoid "disappearing" on cache expiration
    res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
    gfsBucket.openDownloadStreamByName(filename).pipe(res);
  } catch (error) {
    console.error('Error serving reviewer profile picture:', error);
    res.status(500).json({ error: 'Server error serving image' });
  }
});

// POST upload/update admin profile picture
app.post('/api/admin/profile/picture', uploadProfilePic.single('profilePicture'), async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No image provided' });

    const db = getDatabase();
    const users = db.collection(collections.users);
    const user = await users.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });

    // Delete old picture if exists
    if (user.profilePictureGridFS) {
      await deleteFromGridFS(user.profilePictureGridFS);
    }

    const filename = await uploadProfilePicToGridFS(req.file, user._id.toString(), {
      senderName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || email,
      senderEmail: email,
      role: 'admin',
    });

    await users.updateOne(
      { _id: user._id },
      { $set: { profilePictureGridFS: filename, updatedAt: new Date() } }
    );

    res.json({
      success: true,
      profilePicture: `/api/admin/profile/picture/${filename}`
    });
  } catch (error) {
    console.error('Error uploading admin profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error uploading image' });
  }
});

// DELETE admin profile picture
app.delete('/api/admin/profile/picture', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const db = getDatabase();
    const users = db.collection(collections.users);
    const user = await users.findOne({ email });
    if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });

    if (user.profilePictureGridFS) {
      await deleteFromGridFS(user.profilePictureGridFS);
      await users.updateOne(
        { _id: user._id },
        { $unset: { profilePictureGridFS: "" }, $set: { updatedAt: new Date() } }
      );
    }

    res.json({ success: true, message: 'Profile picture removed successfully' });
  } catch (error) {
    console.error('Error removing admin profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error removing image' });
  }
});

// PUT update admin password
app.put('/api/admin/password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const db = getDatabase();
    const users = db.collection(collections.users);

    const user = await users.findOne({ email: new RegExp(`^${email}$`, 'i') });
    if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });

    if (user.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await users.updateOne({ _id: user._id }, { $set: { password: newPassword, updatedAt: new Date() } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET admin profile picture from GridFS
app.get('/api/admin/profile/picture/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const db = getDatabase();

    // Attempt to find in GridFS first (Persistent)
    const files = await gfsBucket.find({ filename }).toArray();

    if (!files || files.length === 0) {
      console.log(`[GRIDFS] Admin image NOT found: ${filename}, checking local fallback...`);
      // Fallback: check local uploads directory for legacy file-system images
      const localPath = path.resolve('uploads', 'profile-pictures', filename);
      if (fs.existsSync(localPath)) {
        return res.sendFile(path.resolve(localPath));
      }
      return res.status(404).json({ error: 'Image not found' });
    }

    console.log(`[GRIDFS] Serving admin image: ${filename}`);
    res.setHeader('Content-Type', files[0].contentType || 'image/jpeg');
    // Ensure browser re-validates to avoid "disappearing" on cache expiration
    res.setHeader('Cache-Control', 'public, no-cache, must-revalidate');
    gfsBucket.openDownloadStreamByName(filename).pipe(res);
  } catch (error) {
    console.error('Error serving admin profile picture:', error);
    res.status(500).json({ error: 'Server error serving image' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

const normalizeStudentProposalAdminSeen = (proposal) => {
  if (!proposal?.studentEmail || !String(proposal.studentEmail).trim()) {
    return proposal;
  }
  if (proposal.submissionType === 'resubmission' || proposal.status === 'Resubmitted') {
    return proposal;
  }

  if (proposal.adminSeen === true) {
    return { ...proposal, adminSeen: true };
  }
  if (proposal.adminSeen === false) {
    return { ...proposal, adminSeen: false };
  }
  if (proposal.adminSeenAt) {
    return { ...proposal, adminSeen: true };
  }
  if (proposal.preliminaryReviewer) {
    return { ...proposal, adminSeen: true };
  }
  return { ...proposal, adminSeen: false };
};

// Proposal operations
app.get('/api/proposals', async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const proposalList = await proposals.find({}).toArray();
    res.json(proposalList.map(normalizeProposalResponse));
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update proposal status
app.put('/api/proposals/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    let result;

    // Try ObjectId first
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      result = await proposals.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } }
      );
    }

    // If not found (or id is not a valid ObjectId), try matching by protocolCode
    if (!result || result.matchedCount === 0) {
      result = await proposals.updateOne(
        { protocolCode: id },
        { $set: { status, updatedAt: new Date() } }
      );
    }

    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    let assignmentSync = { matchedCount: 0, modifiedCount: 0 };
    try {
      assignmentSync = await syncStudentAssignmentsForProposalStatus(db, id, status);
    } catch (syncErr) {
      console.log('Could not sync student assignment status:', syncErr.message);
    }

    res.json({
      success: true,
      status,
      assignmentsUpdated: assignmentSync.modifiedCount || 0,
    });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin: assign department + preliminary reviewer to a student submission
app.put('/api/proposals/:id/assign-preliminary', async (req, res) => {
  try {
    const { id } = req.params;
    const { department, preliminaryReviewer } = req.body;

    if (!department || !preliminaryReviewer) {
      return res.status(400).json({
        success: false,
        error: 'Department and preliminary reviewer are required',
      });
    }

    const db = getDatabase();
    const result = await assignPreliminaryToStudentProposal(
      db,
      id,
      department,
      preliminaryReviewer
    );

    res.json({
      success: true,
      proposal: result.proposal,
      assignmentId: result.assignment?._id || null,
    });
  } catch (error) {
    console.error('Error assigning preliminary reviewer:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to assign preliminary reviewer',
    });
  }
});

// Admin: mark a student submission as seen on Student Proposal page
app.put('/api/proposals/:id/mark-seen', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const adminSeenAt = new Date();
    const update = { $set: { adminSeen: true, adminSeenAt, updatedAt: adminSeenAt } };

    let result;
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      result = await proposals.updateOne({ _id: new ObjectId(id) }, update);
    }
    if (!result || result.matchedCount === 0) {
      result = await proposals.updateOne({ protocolCode: id }, update);
    }

    if (!result || result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, adminSeen: true, adminSeenAt });
  } catch (error) {
    console.error('Error marking proposal as seen:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/proposals/reviewer/:reviewerEmail', async (req, res) => {
  try {
    const { reviewerEmail } = req.params;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const emailFilter = emailRegexFilter(reviewerEmail);
    // Find proposals where the reviewer is assigned as reviewer1, reviewer2, reviewer3, preliminaryReviewer, secondaryReviewer1, or secondaryReviewer2
    const proposalList = await proposals.find({
      $or: [
        { 'reviewers.reviewer1': emailFilter },
        { 'reviewers.reviewer2': emailFilter },
        { 'reviewers.reviewer3': emailFilter },
        { preliminaryReviewer: emailFilter },
        { secondaryReviewer1: emailFilter },
        { secondaryReviewer2: emailFilter }
      ]
    }).toArray();
    res.json(proposalList);
  } catch (error) {
    console.error('Error fetching reviewer proposals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get proposals by student email
app.get('/api/proposals/student/:studentEmail', async (req, res) => {
  try {
    const { studentEmail } = req.params;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    // Case-insensitive match across all email-related fields
    const emailRegex = new RegExp(`^${studentEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const proposalList = await proposals.find({
      $or: [
        { studentEmail: emailRegex },
        { studentEmail: studentEmail },
        { gmail: emailRegex },
        { email: emailRegex },
      ]
    }).toArray();

    res.json(proposalList.map(normalizeProposalFileFields));
  } catch (error) {
    console.error('Error fetching student proposals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get proposal by ID
app.get('/api/proposals/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    let objectId;
    try {
      objectId = new ObjectId(proposalId);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid proposal ID format' });
    }

    const proposal = await proposals.findOne({ _id: objectId });

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json(normalizeProposalFileFields(proposal));
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete proposal by ID (student) — cascades to any reviewer assignments and reviews tied to it
app.delete('/api/proposals/:proposalId', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const assignments = db.collection(collections.assignments);
    const reviews = db.collection(collections.reviews);

    let objectId;
    try {
      objectId = new ObjectId(proposalId);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid proposal ID format' });
    }

    const proposal = await proposals.findOne({ _id: objectId });
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    // Match assignments/reviews by proposalId (in its various stored forms) and, as a
    // fallback, by protocolCode — some assignments/reviews only carry the protocol code.
    const proposalMatchers = buildProposalIdMatchers(objectId);
    if (proposal.protocolCode) {
      proposalMatchers.push({ protocolCode: proposal.protocolCode });
    }

    const assignmentsResult = await assignments.deleteMany({ $or: proposalMatchers });
    // Without this, a reviewer's already-submitted review for this proposal survives
    // the delete and keeps showing up as an orphaned row in Mark Completed Review.
    const reviewsResult = await reviews.deleteMany({ $or: proposalMatchers });
    const result = await proposals.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    // Purge every GridFS blob this proposal owned (files/studentFiles/adminFiles all
    // reference the same underlying filenames, so dedupe before deleting) — otherwise
    // the uploaded documents become orphaned rows in uploads.files/uploads.chunks with
    // nothing left pointing to them.
    const attachedFilenames = new Set();
    [proposal.files, proposal.studentFiles, proposal.adminFiles].forEach((fileMap) => {
      if (!fileMap) return;
      Object.values(fileMap).forEach((f) => {
        if (f?.filename) attachedFilenames.add(f.filename);
      });
    });
    await Promise.all(
      [...attachedFilenames].map((filename) =>
        deleteFromGridFS(filename).catch((e) => console.error('Error deleting proposal file from GridFS:', filename, e))
      )
    );

    console.log(`Deleted proposal ${proposalId}, ${assignmentsResult.deletedCount} linked assignment(s), ${reviewsResult.deletedCount} linked review(s), and ${attachedFilenames.size} GridFS file(s)`);
    res.json({
      success: true,
      assignmentsDeleted: assignmentsResult.deletedCount || 0,
      reviewsDeleted: reviewsResult.deletedCount || 0,
      filesDeleted: attachedFilenames.size,
    });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get reviews by student email
app.get('/api/reviews/student/:studentEmail', async (req, res) => {
  try {
    const { studentEmail } = req.params;
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);

    const reviewList = await reviews.find({
      studentEmail: studentEmail
    }).toArray();

    res.json(reviewList);
  } catch (error) {
    console.error('Error fetching student reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new proposal with file uploads
app.post('/api/proposals', upload.fields([
  { name: 'notificationLetter', maxCount: 1 },
  { name: 'reviewResults', maxCount: 1 },
  { name: 'decisionOfInitialReview', maxCount: 1 },
  { name: 'proposal', maxCount: 1 },
  { name: 'urebForms', maxCount: 1 },
  { name: 'otherFiles', maxCount: 1 },
  { name: 'ethicalClearance', maxCount: 1 },
  { name: 'releaseOfCompletedEthicalReview', maxCount: 1 },
  { name: 'paymentReceipt', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Creating new proposal...');
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    // Get form data from request body
    let {
      protocolCode,
      researchTitle,
      proponent,
      dateOfApplication,
      reviewer1,
      reviewer2,
      reviewer3,
      submissionDate,
      meetingDate,
      action
    } = req.body;

    // Trim protocolCode to avoid uniqueness issues with white space
    if (protocolCode) protocolCode = protocolCode.toUpperCase().replace(/\s+/g, '');

    // Check if protocolCode already exists if provided
    if (protocolCode) {
      const existingProposal = await proposals.findOne({ protocolCode });
      if (existingProposal) {
        return res.status(400).json({ success: false, error: `Protocol Code "${protocolCode}" already exists. Please use a unique Protocol Code.` });
      }
    }

    // Process uploaded files → GridFS
    const files = {};
    if (req.files) {
      for (const fieldname of Object.keys(req.files)) {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          const gfsFilename = await uploadToGridFS(fileArray[0], {
            senderName: proponent || 'Unknown',
            source: 'proposal-create',
            researchTitle,
          });
          files[fieldname] = {
            filename: gfsFilename,
            originalname: fileArray[0].originalname,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
        }
      }
    }

    // Create new proposal document
    const newProposal = {
      protocolCode,
      researchTitle,
      proponent,
      dateOfApplication: dateOfApplication ? new Date(dateOfApplication) : null,
      reviewers: {
        reviewer1,
        reviewer2,
        reviewer3
      },
      submissionDate: submissionDate ? new Date(submissionDate) : null,
      meetingDate: meetingDate ? new Date(meetingDate) : null,
      action,
      files,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Inserting proposal:', newProposal);
    const result = await proposals.insertOne(newProposal);

    console.log('Proposal created successfully:', result.insertedId);
    res.json({
      success: true,
      proposal: {
        _id: result.insertedId,
        ...newProposal
      }
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Student file submission
app.post('/api/student/submit-files', upload.fields([
  { name: 'proposal', maxCount: 1 },
  { name: 'approvalSheet', maxCount: 1 },
  { name: 'urebForm2', maxCount: 1 },
  { name: 'applicationForm6', maxCount: 1 },
  { name: 'accomplishedForm8', maxCount: 1 },
  { name: 'accomplishedForm10A', maxCount: 1 },
  { name: 'instrumentTool', maxCount: 1 },
  { name: 'ethicsReviewFee', maxCount: 1 },
  { name: 'sampleForm1', maxCount: 1 },
  { name: 'sampleForm2', maxCount: 1 }
]), async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    const { studentEmail, studentName, proposalTitle } = req.body;

    const students = db.collection(collections.students);
    const departmentPromise = studentEmail
      ? students.findOne(
          { email: emailRegexFilter(studentEmail) },
          { projection: { department: 1 } }
        )
      : Promise.resolve(null);

    // Process uploaded files → GridFS (parallel to reduce total submit time)
    const files = {};
    const uploadTasks = req.files
      ? Object.entries(req.files).map(async ([fieldname, fileArray]) => {
          if (!fileArray || fileArray.length === 0) return;
          const file = fileArray[0];
          const gfsFilename = await uploadToGridFS(file, {
            senderName: studentName || 'Student',
            senderEmail: studentEmail,
            source: 'student-submission',
            researchTitle: proposalTitle,
          });
          files[fieldname] = {
            filename: gfsFilename,
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
          };
        })
      : [];

    const [student] = await Promise.all([departmentPromise, Promise.all(uploadTasks)]);
    const department = student?.department || '';

    const studentFiles = pickStudentAssignmentFiles(files);

    const initialResubmissionHistory = [];

    const newProposal = {
      researchTitle: proposalTitle || 'Untitled Proposal',
      proponent: studentName || 'Unknown',
      studentEmail: studentEmail || '',
      department: department || '',
      preliminaryReviewer: '',
      preliminaryReviewerName: '',
      files: studentFiles,
      studentFiles,
      adminFiles: {},
      resubmissionCount: 0,
      resubmissionLabel: '',
      resubmissionHistory: initialResubmissionHistory,
      status: 'Pending Reviewer',
      adminSeen: false,
      submissionDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await proposals.insertOne(newProposal);

    res.json({
      success: true,
      proposal: { _id: result.insertedId, ...newProposal }
    });

    // Create notification for admin about student submission (background; don't block response)
    const notifications = db.collection(collections.notifications);
    notifications
      .insertOne({
        type: 'student_submission',
        title: 'New Researcher Submission',
        message: `A new research proposal "${proposalTitle || 'Untitled'}" has been submitted by ${studentName || studentEmail}. Please assign a reviewer.`,
        proposalId: result.insertedId.toString(),
        studentEmail,
        recipientEmail: 'admin',
        read: false,
        createdAt: new Date(),
      })
      .catch((err) => console.error('Failed to create admin notification:', err?.message || err));
  } catch (error) {
    console.error('Error submitting student files:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Student edit proposal
app.put('/api/student/proposals/:id', upload.fields([
  { name: 'proposal', maxCount: 1 },
  { name: 'approvalSheet', maxCount: 1 },
  { name: 'urebForm2', maxCount: 1 },
  { name: 'applicationForm6', maxCount: 1 },
  { name: 'accomplishedForm8', maxCount: 1 },
  { name: 'accomplishedForm10A', maxCount: 1 },
  { name: 'instrumentTool', maxCount: 1 },
  { name: 'ethicsReviewFee', maxCount: 1 },
  { name: 'sampleForm1', maxCount: 1 },
  { name: 'sampleForm2', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ success: false, error: 'Invalid proposal ID' });

    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    const { studentEmail, proposalTitle, resubmissionReason } = req.body;

    const existingProposal = await proposals.findOne({ _id: new ObjectId(id) });
    if (!existingProposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const reqEmailNorm = (studentEmail || '').trim().toLowerCase();
    const propEmailNorm = (existingProposal.studentEmail || '').trim().toLowerCase();
    if (propEmailNorm && reqEmailNorm && propEmailNorm !== reqEmailNorm) {
      return res.status(403).json({ success: false, error: 'Unauthorized to edit this proposal' });
    }

    // Process uploaded files → GridFS
    const newFiles = { ...existingProposal.files };
    if (req.files) {
      for (const fieldname of Object.keys(req.files)) {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          if (newFiles[fieldname] && newFiles[fieldname].filename) {
             deleteFromGridFS(newFiles[fieldname].filename).catch(e => console.error('Error deleting old file:', e));
          }
          const gfsFilename = await uploadToGridFS(fileArray[0], {
            senderName: existingProposal.proponent || existingProposal.studentName || 'Student',
            senderEmail: studentEmail || existingProposal.studentEmail,
            source: 'student-edit-proposal',
            proposalId: id,
            researchTitle: proposalTitle || existingProposal.researchTitle,
          });
          newFiles[fieldname] = {
            filename: gfsFilename,
            originalname: fileArray[0].originalname,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
        }
      }
    }

    const studentFiles = pickStudentAssignmentFiles(newFiles);
    const adminFiles = pickAdminAssignmentFiles(existingProposal.adminFiles || existingProposal.files || {});

    // Calculate resubmission count and history
    const prevCount = typeof existingProposal.resubmissionCount === 'number' ? existingProposal.resubmissionCount : 0;
    const nextResubCount = prevCount + 1;
    const resubLabel = `Resubmission ${nextResubCount}`;

    // Preserve existing history or seed initial submission
    let resubHistory = Array.isArray(existingProposal.resubmissionHistory)
      ? [...existingProposal.resubmissionHistory]
      : [];

    if (resubHistory.length === 0 && existingProposal.studentFiles && Object.keys(existingProposal.studentFiles).length > 0) {
      resubHistory.push({
        resubmissionNumber: 0,
        label: 'Original Submission',
        submittedAt: existingProposal.createdAt || existingProposal.submissionDate || new Date(),
        files: { ...existingProposal.studentFiles },
        studentEmail: existingProposal.studentEmail,
        studentName: existingProposal.proponent
      });
    }

    const reasonText = resubmissionReason || 'Updated proposal files';

    resubHistory.push({
      resubmissionNumber: nextResubCount,
      label: resubLabel,
      resubmissionReason: reasonText,
      submittedAt: new Date(),
      files: { ...studentFiles },
      studentEmail: studentEmail || existingProposal.studentEmail,
      studentName: existingProposal.proponent
    });

    const updatedData = {
      researchTitle: proposalTitle || existingProposal.researchTitle,
      files: newFiles,
      studentFiles,
      adminFiles,
      resubmissionCount: nextResubCount,
      resubmissionLabel: resubLabel,
      resubmissionHistory: resubHistory,
      submissionType: 'initial',
      isResubmissionProposal: false,
      adminSeen: false,
      updatedAt: new Date()
    };

    await proposals.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });

    // Note: editing a proposal only updates the researcher's own proposal record
    // (title/files/resubmission history) — it intentionally does NOT post a message
    // to the admin's "Files And Messages Submitted" inbox.

    const finalProposal = await proposals.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      proposal: normalizeProposalFileFields(finalProposal)
    });
  } catch (error) {
    console.error('Error editing student proposal:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Student file resubmission — distinct from Edit Proposal: this reports the resubmitted
// files to the admin's "Files And Messages Submitted" inbox and logs them in the
// resubmission history, but intentionally does NOT overwrite the researcher's live
// Research Proposal files/title (that's what Edit Proposal, PUT /student/proposals/:id, does).
app.post('/api/student/resubmit-files', upload.fields([
  { name: 'proposal', maxCount: 1 },
  { name: 'approvalSheet', maxCount: 1 },
  { name: 'urebForm2', maxCount: 1 },
  { name: 'applicationForm6', maxCount: 1 },
  { name: 'accomplishedForm8', maxCount: 1 },
  { name: 'accomplishedForm10A', maxCount: 1 },
  { name: 'instrumentTool', maxCount: 1 },
  { name: 'ethicsReviewFee', maxCount: 1 },
  { name: 'sampleForm1', maxCount: 1 },
  { name: 'sampleForm2', maxCount: 1 }
]), async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const messages = db.collection(collections.messages);

    const { resubmissionReason, studentEmail, studentName, submissionType, proposalId, relatedProposalId } = req.body;
    const targetProposalId = proposalId || relatedProposalId;

    // Process uploaded files → GridFS, keyed by document type
    const files = {};
    if (req.files) {
      for (const fieldname of Object.keys(req.files)) {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          const gfsFilename = await uploadToGridFS(file, {
            senderName: studentName || 'Student',
            senderEmail: studentEmail,
            source: 'student-resubmission',
            proposalId: targetProposalId,
          });
          files[fieldname] = {
            filename: gfsFilename,
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype
          };
        }
      }
    }

    let targetProp = null;
    if (targetProposalId && ObjectId.isValid(targetProposalId)) {
      targetProp = await proposals.findOne({ _id: new ObjectId(targetProposalId) });
    } else if (studentEmail) {
      targetProp = await proposals.findOne({ studentEmail: emailRegexFilter(studentEmail) }, { sort: { createdAt: -1 } });
    }

    let finalPropId = targetProp?._id?.toString() || '';

    // Resubmission tracks its own counter/history — researcherResubmission* — which is
    // never read by the admin's Research Proposal view (that only reads resubmissionCount /
    // resubmissionLabel / resubmissionHistory / isResubmissionProposal / adminSeen, all of
    // which Edit Proposal owns). This keeps Resubmission from ever surfacing there; it only
    // reaches admin via the message below (Files And Messages Submitted).
    let resubLabel = 'Resubmission';
    if (targetProp) {
      const prevCount = typeof targetProp.researcherResubmissionCount === 'number' ? targetProp.researcherResubmissionCount : 0;
      const nextResubCount = prevCount + 1;
      resubLabel = `Resubmission ${nextResubCount}`;

      let resubHistory = Array.isArray(targetProp.researcherResubmissionHistory) ? [...targetProp.researcherResubmissionHistory] : [];
      resubHistory.push({
        resubmissionNumber: nextResubCount,
        label: resubLabel,
        resubmissionReason: resubmissionReason || 'Resubmitted updated files',
        submittedAt: new Date(),
        files,
        studentEmail: studentEmail || targetProp.studentEmail,
        studentName: studentName || targetProp.proponent
      });

      await proposals.updateOne(
        { _id: targetProp._id },
        {
          $set: {
            researcherResubmissionCount: nextResubCount,
            researcherResubmissionLabel: resubLabel,
            researcherResubmissionHistory: resubHistory
          }
        }
      );
    }

    // Send message to admin about resubmission
    const messageRecord = {
      senderEmail: studentEmail || 'student',
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject: `Files Resubmitted (${resubLabel})`,
      message: `${studentName || 'Student'} has resubmitted files: ${resubmissionReason || 'Updated files'}`,
      senderName: studentName || 'Student',
      type: 'student_to_admin',
      submissionType: 'resubmission',
      resubmissionLabel: resubLabel,
      resubmissionReason: resubmissionReason || '',
      relatedProposalId: finalPropId,
      files,
      read: false,
      createdAt: new Date()
    };

    const msgResult = await messages.insertOne(messageRecord);

    res.json({
      success: true,
      message: messageRecord,
      messageId: msgResult.insertedId
    });
  } catch (error) {
    console.error('Error resubmitting student files:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Review operations
app.get('/api/reviews/reviewer/:reviewerId', async (req, res) => {
  try {
    const { reviewerId } = req.params;
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const reviewList = await reviews.find({ reviewerId }).toArray();
    res.json(reviewList);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all reviews (for admin Reviews File)
app.get('/api/reviews', async (req, res) => {
  try {
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const reviewersCol = db.collection(collections.reviewers);
    const reviewList = await reviews.find({}).sort({ createdAt: -1 }).toArray();

    // Build a lookup of reviewer emails → actual profile names
    const allReviewerAccounts = await reviewersCol.find({}, {
      projection: { email: 1, name: 1, firstName: 1, middleName: 1, lastName: 1, title: 1 }
    }).toArray();
    const reviewerNameMap = {};
    allReviewerAccounts.forEach(acc => {
      const email = (acc.email || '').trim().toLowerCase();
      if (!email) return;
      const fullName = acc.name
        || [acc.firstName, acc.middleName, acc.lastName].filter(Boolean).join(' ')
        || '';
      if (fullName) reviewerNameMap[email] = fullName;
    });

    // Enrich each review with the correct reviewer name from their profile
    const enrichedReviews = reviewList.map(review => {
      const email = (review.reviewerEmail || '').trim().toLowerCase();
      const resolvedName = reviewerNameMap[email];
      if (resolvedName && resolvedName !== review.reviewerName) {
        return { ...review, reviewerName: resolvedName };
      }
      return review;
    });

    res.json(enrichedReviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific review by ID
// Count all submitted reviews (MUST be before /:id to avoid route conflict)
app.get('/api/reviews/count', async (req, res) => {
  try {
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const count = await reviews.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const review = await reviews.findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a review with file uploads
app.post('/api/reviews', upload.any(), async (req, res) => {
  try {
    console.log('Received review submission:', req.body);
    console.log('Files received:', req.files?.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })));

    const { proposalId, reviewerEmail, reviewerName, decision, comment, overallRating, comments, recommendations, protocolCode: submittedProtocolCode } = req.body;
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const proposals = db.collection(collections.proposals);
    const notifications = db.collection(collections.notifications);

    // Process uploaded files → GridFS
    const files = {};
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file) {
          try {
            const gfsFilename = await uploadToGridFS(file, {
              senderName: reviewerName || 'Reviewer',
              senderEmail: reviewerEmail,
              source: 'reviewer-review-submission',
              proposalId,
              protocolCode: submittedProtocolCode,
            });
            files[file.fieldname] = {
              filename: gfsFilename,
              originalname: file.originalname,
              size: file.size,
              mimetype: file.mimetype
            };
          } catch (fileError) {
            console.error('Error uploading file to GridFS:', fileError);
          }
        }
      }
    }

    // Create review document
    const newReview = {
      proposalId,
      reviewerEmail,
      reviewerName: reviewerName || reviewerEmail,
      decision: decision || overallRating,
      comment: comment || comments || '',
      overallRating: overallRating || decision || '',
      comments: comments || comment || '',
      recommendations: recommendations || '',
      protocolCode: (submittedProtocolCode || '').toUpperCase().replace(/\s+/g, ''),
      files,
      status: 'completed',
      createdAt: new Date(),
      completedDate: new Date()
    };

    const result = await reviews.insertOne(newReview);

    const normalizedProtocolCode = (submittedProtocolCode || '').toUpperCase().replace(/\s+/g, '');
    const isSecondarySubmission = String(decision || '').toLowerCase() === 'secondary_file';

    // Update proposal status (admin workflow for completed preliminary review)
    if (!isSecondarySubmission) {
      const proposalStatus = 'Submitted to Admin';
      const proposalQuery = [];
      if (proposalId && ObjectId.isValid(String(proposalId))) {
        proposalQuery.push({ _id: new ObjectId(proposalId) });
      }
      if (normalizedProtocolCode) {
        proposalQuery.push({ protocolCode: normalizedProtocolCode });
      }
      if (proposalQuery.length) {
        try {
          await proposals.updateOne(
            { $or: proposalQuery },
            { $set: { status: proposalStatus, updatedAt: new Date() } }
          );
        } catch (e) {
          console.log('Could not update proposal status:', e.message);
        }
      }
    } else if (normalizedProtocolCode) {
      try {
        await proposals.updateOne(
          { protocolCode: normalizedProtocolCode },
          { $set: { status: 'Under Review', updatedAt: new Date() } }
        );
      } catch (e) {
        console.log('Could not update proposal status for secondary submission:', e.message);
      }
    }

    // Assigned proposal: Pending → Under Review when reviewer submits
    try {
      const assignmentUpdate = await markReviewerAssignmentsUnderReview(db, {
        proposalId,
        protocolCode: normalizedProtocolCode,
        reviewerEmail,
        decision,
      });
      console.log(
        `Assignment status → Under Review (${assignmentUpdate.modifiedCount} updated) for reviewer ${reviewerEmail}`
      );
    } catch (e) {
      console.log('Could not update assignment status:', e.message);
    }

    // Fetch proposal details for notification
    let proposalTitle = 'Unknown Proposal';
    let protocolCode = normalizedProtocolCode;
    try {
      const proposal = await proposals.findOne({ _id: new ObjectId(proposalId) });
      if (proposal) {
        proposalTitle = proposal.researchTitle || 'Untitled Proposal';
        protocolCode = submittedProtocolCode || proposal.protocolCode || '';
      }
    } catch (e) {
      console.log('Could not fetch proposal for notification:', e.message);
    }
    // If still no protocol code, try to extract from comment or use a default
    if (!protocolCode && comment && comment.includes('Protocol Code:')) {
      const match = comment.match(/Protocol Code:\s*([^\s]+)/);
      if (match) protocolCode = match[1];
    }

    // Create notification for the reviewer (shows in their own Reviewer Portal Notifications)
    const notification = {
      type: 'review_submitted',
      title: `${protocolCode ? 'Protocol Code: ' + protocolCode : proposalTitle}`,
      message: `You submitted a review for ${protocolCode ? 'Protocol Code: ' + protocolCode : proposalTitle}. ${isSecondarySubmission ? 'Your submission has been sent to the Admin.' : 'The decision is ' + (decision || overallRating) + '.'}`,
      reviewId: result.insertedId.toString(),
      proposalId,
      reviewerEmail,
      recipientEmail: reviewerEmail,
      decision: decision || overallRating,
      read: false,
      createdAt: new Date()
    };

    await notifications.insertOne(notification);

    // Notify admin that a review (with any submitted files) came in — shows in Files And Messages Submitted
    const messages = db.collection(collections.messages);
    const messageRecord = {
      senderEmail: reviewerEmail,
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject: `Review Submitted: ${protocolCode ? 'Protocol ' + protocolCode : proposalTitle}`,
      message: `${reviewerName || reviewerEmail} submitted a review for "${protocolCode ? 'Protocol Code: ' + protocolCode : proposalTitle}".`,
      senderName: reviewerName || reviewerEmail,
      type: 'reviewer_to_admin',
      reviewId: result.insertedId.toString(),
      proposalId,
      reviewerEmail,
      decision: decision || overallRating,
      files,
      read: false,
      createdAt: new Date()
    };

    await messages.insertOne(messageRecord);

    res.json({
      success: true,
      review: { _id: result.insertedId, ...newReview }
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Reviewer resubmits an updated review file to Admin
app.post('/api/reviews/:id/resubmit', upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid review ID' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please attach at least one updated file' });
    }

    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const proposals = db.collection(collections.proposals);
    const messages = db.collection(collections.messages);
    const notifications = db.collection(collections.notifications);

    const existingReview = await reviews.findOne({ _id: new ObjectId(id) });
    if (!existingReview) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    const { resubmissionReason, reviewerEmail, reviewerName } = req.body;

    // Upload updated files to GridFS
    const newFiles = {};
    for (const file of req.files) {
      try {
        const gfsFilename = await uploadToGridFS(file, {
          senderName: reviewerName || 'Reviewer',
          senderEmail: reviewerEmail,
          source: 'reviewer-review-resubmission',
          reviewId: id,
          proposalId: existingReview.proposalId,
        });
        newFiles[file.fieldname] = {
          filename: gfsFilename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (fileError) {
        console.error('Error uploading resubmission file to GridFS:', fileError);
      }
    }

    const prevCount = typeof existingReview.resubmissionCount === 'number' ? existingReview.resubmissionCount : 0;
    const nextCount = prevCount + 1;
    const resubLabel = `Resubmission ${nextCount}`;

    const historyEntry = {
      resubmissionNumber: nextCount,
      label: resubLabel,
      reason: resubmissionReason || 'Updated review file resubmitted',
      files: newFiles,
      date: new Date()
    };

    const existingHistory = Array.isArray(existingReview.resubmissionHistory) ? existingReview.resubmissionHistory : [];

    await reviews.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          files: { ...existingReview.files, ...newFiles },
          resubmissionCount: nextCount,
          resubmissionLabel: resubLabel,
          resubmissionHistory: [...existingHistory, historyEntry],
          updatedAt: new Date()
        }
      }
    );

    // Resolve proposal details for messaging/notification context
    let proposalTitle = existingReview.proposalTitle || 'Untitled Proposal';
    let protocolCode = existingReview.protocolCode || '';
    try {
      const proposal = await proposals.findOne({ _id: new ObjectId(existingReview.proposalId) });
      if (proposal) {
        proposalTitle = proposal.researchTitle || proposalTitle;
        protocolCode = proposal.protocolCode || protocolCode;
      }
    } catch (e) { /* ignore */ }

    const senderEmail = reviewerEmail || existingReview.reviewerEmail;
    const senderName = reviewerName || existingReview.reviewerName || senderEmail;

    // Notify admin that an updated review file came in
    await messages.insertOne({
      senderEmail,
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject: `Review Resubmitted (${resubLabel}): ${protocolCode ? 'Protocol ' + protocolCode : proposalTitle}`,
      message: `${senderName} resubmitted review file(s) for "${protocolCode ? 'Protocol Code: ' + protocolCode : proposalTitle}". Reason: ${resubmissionReason || 'Updated review file'}`,
      senderName,
      type: 'reviewer_to_admin',
      reviewId: id,
      proposalId: existingReview.proposalId,
      reviewerEmail: senderEmail,
      submissionType: 'resubmission',
      resubmissionLabel: resubLabel,
      files: newFiles,
      read: false,
      createdAt: new Date()
    });

    // Confirmation notification for the reviewer
    await notifications.insertOne({
      type: 'review_resubmitted',
      title: `${protocolCode ? 'Protocol Code: ' + protocolCode : proposalTitle}`,
      message: `Your ${resubLabel.toLowerCase()} for ${protocolCode ? 'Protocol Code: ' + protocolCode : proposalTitle} has been sent to the Admin.`,
      reviewId: id,
      proposalId: existingReview.proposalId,
      reviewerEmail: senderEmail,
      recipientEmail: senderEmail,
      read: false,
      createdAt: new Date()
    });

    const updatedReview = await reviews.findOne({ _id: new ObjectId(id) });
    res.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Error resubmitting review:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Get all completed reviews (for admin)
app.get('/api/reviews/all', async (req, res) => {
  try {
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const proposals = db.collection(collections.proposals);
    const reviewersCol = db.collection(collections.reviewers);

    const allReviews = await reviews.find({ status: 'completed' }).sort({ completedDate: -1 }).toArray();

    // Build a lookup of reviewer emails → actual profile names
    const allReviewerAccounts = await reviewersCol.find({}, {
      projection: { email: 1, name: 1, firstName: 1, middleName: 1, lastName: 1 }
    }).toArray();
    const reviewerNameMap = {};
    allReviewerAccounts.forEach(acc => {
      const email = (acc.email || '').trim().toLowerCase();
      if (!email) return;
      const fullName = acc.name
        || [acc.firstName, acc.middleName, acc.lastName].filter(Boolean).join(' ')
        || '';
      if (fullName) reviewerNameMap[email] = fullName;
    });

    const enrichedReviews = await Promise.all(
      allReviews.map(async (review) => {
        let proposal = null;
        try {
          proposal = await proposals.findOne({ _id: new ObjectId(review.proposalId) });
        } catch (e) { /* ignore */ }
        const email = (review.reviewerEmail || '').trim().toLowerCase();
        const resolvedName = reviewerNameMap[email] || review.reviewerName || review.reviewerEmail;
        return {
          ...review,
          reviewerName: resolvedName,
          proposalTitle: proposal?.researchTitle || 'Untitled Proposal',
          protocolCode: proposal?.protocolCode || '',
          proponent: proposal?.proponent || 'N/A'
        };
      })
    );

    res.json(enrichedReviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get completed reviews by reviewer email
app.get('/api/reviews/completed/:reviewerEmail', async (req, res) => {
  try {
    const { reviewerEmail } = req.params;
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const proposals = db.collection(collections.proposals);
    const reviewersCol = db.collection(collections.reviewers);

    const completedReviews = await reviews.find({
      reviewerEmail,
      status: 'completed'
    }).sort({ completedDate: -1 }).toArray();

    // Resolve the actual reviewer name from their profile
    const reviewerAccount = await reviewersCol.findOne(
      { email: emailRegexFilter(reviewerEmail) },
      { projection: { name: 1, firstName: 1, middleName: 1, lastName: 1 } }
    );
    const resolvedName = reviewerAccount?.name
      || [reviewerAccount?.firstName, reviewerAccount?.middleName, reviewerAccount?.lastName].filter(Boolean).join(' ')
      || '';

    // Enrich with proposal details and correct reviewer name
    const enrichedReviews = await Promise.all(
      completedReviews.map(async (review) => {
        let proposal = null;
        try {
          proposal = await proposals.findOne({ _id: new ObjectId(review.proposalId) });
        } catch (e) { /* ignore */ }
        return {
          ...review,
          reviewerName: resolvedName || review.reviewerName || review.reviewerEmail,
          proposalTitle: proposal?.researchTitle || review.researchTitle || 'Untitled Proposal',
          protocolCode: proposal?.protocolCode || review.protocolCode || '',
          proponent: proposal?.proponent || review.proponent || 'N/A'
        };
      })
    );

    res.json(enrichedReviews);
  } catch (error) {
    console.error('Error fetching completed reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a notification
app.post('/api/notifications', async (req, res) => {
  try {
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    const newNotification = {
      ...req.body,
      createdAt: new Date(),
      read: req.body.read ?? false
    };
    const result = await notifications.insertOne(newNotification);
    res.json({ success: true, notification: { _id: result.insertedId, ...newNotification } });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all notifications — this feeds the Admin Dashboard's notification bell/panel only
// (the only two callers, admindashboard.jsx). 'review_deadline' reminders are written for
// the assigned Reviewer ("Your review for... is due in...", recipientEmail: reviewerEmail)
// and delivered to them via GET /api/notifications/:email — the Admin has no review to
// submit and no action to take on them, so they're excluded here rather than leaking into
// the admin's notification count/list.
app.get('/api/notifications', async (req, res) => {
  try {
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    const notificationList = await notifications
      .find({ dismissed: { $ne: true }, type: { $ne: 'review_deadline' } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(notificationList);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark single notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    const result = await notifications.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Permanently deletes a notification document. The only notification type that's
// ever re-created automatically is 'review_deadline' (see the dedupe check in
// GET /api/assignments/:reviewerEmail) — for that one, deleting the document would
// make the dedupe check blind and spam a fresh reminder back on the next fetch.
// So a real delete here also leaves a standing suppression record in
// user_hidden_items, keyed by proposalId (not the notification's _id, which is
// gone), for that dedupe check to consult instead.
async function hardDeleteNotification(db, id) {
  const notifications = db.collection(collections.notifications);
  const notif = await notifications.findOne({ _id: new ObjectId(id) });
  if (notif && notif.type === 'review_deadline' && notif.proposalId && notif.recipientEmail) {
    const hiddenItems = db.collection(collections.user_hidden_items);
    const email = String(notif.recipientEmail).toLowerCase().trim();
    const itemId = `review_deadline:${notif.proposalId}`;
    await hiddenItems.updateOne(
      { email, itemId },
      { $set: { email, itemId, itemType: 'notification-suppression', hiddenAt: new Date() } },
      { upsert: true }
    );
  }
  await notifications.deleteOne({ _id: new ObjectId(id) });
}

// Delete a notification
app.post('/api/notifications/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    await hardDeleteNotification(db, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    await hardDeleteNotification(db, id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification via DELETE:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// User hidden items endpoints (notifications, history) for real-time database deletion
app.get('/api/user-hidden-items/:email', async (req, res) => {
  try {
    const email = (req.params.email || '').toLowerCase().trim();
    if (!email) return res.json({ success: true, hiddenIds: [] });
    const db = getDatabase();
    const col = db.collection(collections.user_hidden_items);
    const records = await col.find({ email }).toArray();
    const hiddenIds = records.map(r => String(r.itemId));
    res.json({ success: true, hiddenIds });
  } catch (error) {
    console.error('Error fetching user hidden items:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/user-hidden-items', async (req, res) => {
  try {
    const { email, itemId, itemType } = req.body;
    if (!email || !itemId) {
      return res.status(400).json({ success: false, error: 'Missing email or itemId' });
    }
    const normEmail = String(email).toLowerCase().trim();
    const strItemId = String(itemId);
    const db = getDatabase();
    const col = db.collection(collections.user_hidden_items);
    await col.updateOne(
      { email: normEmail, itemId: strItemId },
      { $set: { email: normEmail, itemId: strItemId, itemType: itemType || 'general', hiddenAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving hidden item:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/user-hidden-items/clear-all', async (req, res) => {
  try {
    const { email, itemIds, itemType } = req.body;
    if (!email || !Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, error: 'Missing email or itemIds array' });
    }
    const normEmail = String(email).toLowerCase().trim();
    const db = getDatabase();
    const col = db.collection(collections.user_hidden_items);
    const bulkOps = itemIds.map(id => ({
      updateOne: {
        filter: { email: normEmail, itemId: String(id) },
        update: { $set: { email: normEmail, itemId: String(id), itemType: itemType || 'general', hiddenAt: new Date() } },
        upsert: true
      }
    }));
    if (bulkOps.length > 0) {
      await col.bulkWrite(bulkOps);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing user items:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get notifications for a specific user
app.get('/api/notifications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);

    // Case-insensitive match to handle email case mismatches between stored and queried values
    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const notificationList = await notifications.find({
      recipientEmail: emailRegex,
      dismissed: { $ne: true }
    }).sort({ createdAt: -1 }).toArray();

    res.json(notificationList);
  } catch (error) {
    console.error('Error fetching notifications for user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const db = getDatabase();
    const assignments = db.collection(collections.assignments);
    const assignmentList = await assignments.find({}).toArray();
    res.json(assignmentList.map((a) => {
      const assignmentSource = inferAssignmentSource(a);
      const isStudent = assignmentSource === 'student';
      return {
        ...a,
        assignmentSource,
        assignedFiles: isStudent
          ? pickStudentAssignmentFiles(a.assignedFiles || {})
          : pickAdminAssignmentFiles(a.assignedFiles || {}),
      };
    }));
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get assignments for a specific reviewer
app.get('/api/assignments/:reviewerEmail', async (req, res) => {
  try {
    const { reviewerEmail } = req.params;
    const db = getDatabase();
    const assignments = db.collection(collections.assignments);
    const notifications = db.collection(collections.notifications);

    const proposals = db.collection(collections.proposals);
    const relevantProposals = await proposals.find({
      $or: [
        { preliminaryReviewer: emailRegexFilter(reviewerEmail) },
        { secondaryReviewer1: emailRegexFilter(reviewerEmail) },
        { secondaryReviewer2: emailRegexFilter(reviewerEmail) },
        { 'reviewers.reviewer1': emailRegexFilter(reviewerEmail) },
        { 'reviewers.reviewer2': emailRegexFilter(reviewerEmail) },
        { 'reviewers.reviewer3': emailRegexFilter(reviewerEmail) },
      ]
    }).toArray();
    for (const proposal of relevantProposals) {
      await ensureReviewerAssignmentsForProposal(db, proposal);
    }
    await cleanDuplicateAssignments(db, reviewerEmail);

    let assignmentList = await assignments.find({
      reviewerEmail: emailRegexFilter(reviewerEmail),
    }).sort({ createdAt: -1 }).toArray();

    // Resolve co-reviewer (Chair/Member) display names so a reviewer can see who
    // their counterpart is on each proposal, not just their own role badge.
    const reviewersCollection = db.collection(collections.reviewers);
    const coReviewerEmails = new Set();
    assignmentList.forEach((a) => {
      const sec1 = a.secondaryReviewer1 || a.proposal?.secondaryReviewer1 || a.reviewers?.reviewer2;
      const sec2 = a.secondaryReviewer2 || a.proposal?.secondaryReviewer2 || a.reviewers?.reviewer3;
      if (sec1) coReviewerEmails.add(String(sec1).toLowerCase().trim());
      if (sec2) coReviewerEmails.add(String(sec2).toLowerCase().trim());
    });
    const coReviewerNameByEmail = new Map();
    if (coReviewerEmails.size > 0) {
      try {
        const coReviewerDocs = await reviewersCollection.find({
          $or: Array.from(coReviewerEmails).map((e) => ({ email: emailRegexFilter(e) })),
        }, { projection: { email: 1, name: 1, firstName: 1, middleName: 1, lastName: 1 } }).toArray();
        coReviewerDocs.forEach((r) => {
          const fullName = r.name
            || [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ')
            || r.email;
          coReviewerNameByEmail.set(String(r.email).toLowerCase().trim(), fullName);
        });
      } catch (lookupError) {
        console.error('Error resolving co-reviewer names (non-fatal):', lookupError);
      }
    }

    assignmentList = assignmentList.map((a) => {
      const assignmentSource = inferAssignmentSource(a);
      const isStudent = assignmentSource === 'student';
      const rawFiles = a.assignedFiles || {};
      const sanitizedFiles = {
        ...pickStudentAssignmentFiles(rawFiles),
        ...pickAdminAssignmentFiles(rawFiles),
        ...rawFiles,
      };

      if (isStudent && a.protocolCode) {
        assignments.updateOne(
          { _id: a._id },
          { $unset: { protocolCode: '' }, $set: { updatedAt: new Date() } }
        ).catch(() => {});
      }
      const sec1 = a.secondaryReviewer1 || a.proposal?.secondaryReviewer1 || a.reviewers?.reviewer2;
      const sec2 = a.secondaryReviewer2 || a.proposal?.secondaryReviewer2 || a.reviewers?.reviewer3;
      let reviewerRole = a.reviewerRole || null;
      if (!reviewerRole) {
        const curEmail = (reviewerEmail || '').toLowerCase().trim();
        if (sec1 && String(sec1).toLowerCase().trim() === curEmail) {
          reviewerRole = 'Chair';
        } else if (sec2 && String(sec2).toLowerCase().trim() === curEmail) {
          reviewerRole = 'Member';
        }
      }
      return {
        ...a,
        assignmentSource,
        reviewerRole,
        secondaryReviewer1: sec1,
        secondaryReviewer2: sec2,
        secondaryReviewer1Name: sec1 ? (coReviewerNameByEmail.get(String(sec1).toLowerCase().trim()) || sec1) : null,
        secondaryReviewer2Name: sec2 ? (coReviewerNameByEmail.get(String(sec2).toLowerCase().trim()) || sec2) : null,
        assignedFiles: sanitizedFiles,
        ...(isStudent ? { protocolCode: null } : {}),
      };
    });

    // Check for assignments with review deadlines within 3 days and create notifications
    const today = new Date();
    for (const assignment of assignmentList) {
      // Get effective end date (use stored endDate or calculate 2 weeks from start)
      let endDate;
      if (assignment.reviewPeriod?.endDate) {
        endDate = new Date(assignment.reviewPeriod.endDate);
      } else {
        const baseDate = new Date(assignment.reviewPeriod?.startDate || assignment.createdAt || Date.now());
        endDate = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      }

      const daysUntilDeadline = Math.ceil((endDate - today) / (1000 * 3600 * 24));
      const isCompleted = String(assignment.status || '').toLowerCase() === 'completed';

      // Create a reminder notification specific to this proposal if its deadline is within 3 days
      // and the reviewer hasn't completed the review yet
      if (!isCompleted && daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
        const proposalId = assignment.proposalId?.toString?.() || assignment.proposalId;

        // One reminder per proposal — check if it already exists for this assignment,
        // or was permanently deleted (see hardDeleteNotification's suppression record).
        const existingNotif = await notifications.findOne({
          recipientEmail: reviewerEmail,
          type: 'review_deadline',
          proposalId
        });
        const wasPermanentlyDismissed = !existingNotif && await db.collection(collections.user_hidden_items).findOne({
          email: reviewerEmail.toLowerCase().trim(),
          itemId: `review_deadline:${proposalId}`
        });

        if (!existingNotif && !wasPermanentlyDismissed) {
          const dayLabel = daysUntilDeadline === 1 ? 'day' : 'days';
          await notifications.insertOne({
            recipientEmail: reviewerEmail,
            title: 'Upcoming Review Deadline',
            message: `Your review for "${assignment.researchTitle || assignment.protocolCode || 'Untitled'}" is due in ${daysUntilDeadline} ${dayLabel}. The review period ends on ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Please ensure your review is completed before the deadline.`,
            type: 'review_deadline',
            proposalId,
            protocolCode: assignment.protocolCode,
            deadlineDate: endDate,
            read: false,
            createdAt: new Date()
          });
        }
      }
    }

    res.json(assignmentList);
  } catch (error) {
    console.error('Error fetching assignments for reviewer:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a single assignment by ID
app.post('/api/assignments/:id/delete', async (req, res) => {
  try {
    const db = getDatabase();
    const assignments = db.collection(collections.assignments);
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid assignment ID' });
    }

    const result = await assignments.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update assignment status
app.put('/api/assignments/status', async (req, res) => {
  try {
    const { assignmentId, proposalId, protocolCode, reviewerEmail, status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Missing status' });
    }

    const db = getDatabase();
    const assignments = db.collection(collections.assignments);

    let result = { matchedCount: 0, modifiedCount: 0 };

    const assignmentStatus = mapProposalStatusToAssignmentStatus(status);

    const updateByProposal = async () => {
      const proposalMatchers = [
        ...buildProposalIdMatchers(proposalId),
        ...(protocolCode ? buildProposalIdMatchers(protocolCode) : []),
      ];
      const uniqueMatchers = proposalMatchers.filter((m, i, arr) =>
        arr.findIndex(x => JSON.stringify(x) === JSON.stringify(m)) === i
      );

      return assignments.updateMany(
        {
          $or: uniqueMatchers,
          reviewerEmail: emailRegexFilter(reviewerEmail),
        },
        { $set: { status: assignmentStatus, updatedAt: new Date() } }
      );
    };

    // Prefer direct assignment id when provided; fall back to proposal/reviewer match
    if (assignmentId && ObjectId.isValid(String(assignmentId))) {
      result = await assignments.updateOne(
        { _id: new ObjectId(assignmentId) },
        { $set: { status: assignmentStatus, updatedAt: new Date() } }
      );
    }

    if (result.matchedCount === 0 && proposalId && reviewerEmail) {
      result = await updateByProposal();
    } else if (result.matchedCount === 0 && !proposalId && !reviewerEmail) {
      return res.status(400).json({ success: false, error: 'Missing assignmentId or proposalId/reviewerEmail' });
    }

    // Secondary Mark Done: keep linked student proposal status in sync
    if ((result.modifiedCount > 0 || result.matchedCount > 0) && proposalId) {
      const normalizedProposalStatus = String(assignmentStatus).toLowerCase() === 'completed'
        ? 'completed'
        : 'Under Review';
      try {
        const proposals = db.collection(collections.proposals);
        const proposalMatchers = [
          ...buildProposalDocMatchers(proposalId),
          ...(protocolCode ? buildProposalDocMatchers(protocolCode) : []),
        ];
        if (proposalMatchers.length) {
          await proposals.updateMany(
            { $or: proposalMatchers },
            { $set: { status: normalizedProposalStatus, updatedAt: new Date() } }
          );
        }
      } catch (proposalSyncErr) {
        console.log('Could not sync proposal status from assignment:', proposalSyncErr.message);
      }
    }

    res.json({ success: true, matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    await notifications.updateMany(
      { read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, body, fromEmail, fromName } = req.body;

    // Email options
    const mailOptions = {
      from: `${fromName} <${process.env.GMAIL_EMAIL}>`,
      to: to,
      subject: subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// Check if Email exists in system (supports institutional and standard emails)
app.post('/api/check-gmail-exists', async (req, res) => {
  try {
    const { gmail, email } = req.body;
    const targetEmail = (email || gmail || '').trim().toLowerCase();

    // Validate email address format (institutional or standard)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(targetEmail)) {
      return res.json({ exists: false });
    }

    const db = getDatabase();
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);
    const reviewers = db.collection(collections.reviewers);

    // Check in all collections
    const existingStudent = await students.findOne({ email: targetEmail });
    const existingUser = await users.findOne({ email: targetEmail });
    const existingReviewer = await reviewers.findOne({ email: targetEmail });

    const exists = !!(existingStudent || existingUser || existingReviewer);

    res.json({ exists });
  } catch (error) {
    console.error('Error checking Gmail existence:', error);
    res.json({ exists: false });
  }
});

// Change student password endpoint
app.put('/api/student/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await findStudentByLoginEmail(students, email);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Check 1-month password change cooldown
    const cooldown = checkPasswordCooldown(student);
    if (!cooldown.canChange) {
      return res.status(400).json({ success: false, error: cooldown.error, remainingDays: cooldown.remainingDays });
    }

    if (student.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    await students.updateOne({ _id: student._id }, { $set: { password: newPassword, lastPasswordChange: new Date(), updatedAt: new Date() } });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete student account endpoint
app.delete('/api/student/account', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await findStudentByLoginEmail(students, email);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    if (student.password !== password) {
      return res.status(400).json({ success: false, error: 'Password is incorrect' });
    }
    await students.deleteOne({ _id: student._id });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Message operations
app.post('/api/messages', async (req, res) => {
  try {
    const { senderEmail, recipientEmail, subject, message, senderName } = req.body;
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const newMessage = {
      senderEmail,
      recipientEmail,
      subject,
      message,
      senderName,
      createdAt: new Date(),
      read: false
    };

    const result = await messages.insertOne(newMessage);
    res.json({
      success: true,
      message: {
        _id: result.insertedId,
        ...newMessage
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Student reply to admin (with optional file attachments)
app.post('/api/messages/reply', upload.array('files', 10), async (req, res) => {
  try {
    const { senderEmail, senderName, message, replyToMessageId } = req.body;
    const files = req.files || [];

    if (!senderEmail || !message) {
      return res.status(400).json({ success: false, error: 'Sender email and message are required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const newMessage = {
      senderEmail,
      senderName: senderName || 'Student',
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      message,
      files: files.map(f => ({
        filename: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
        path: f.path
      })),
      replyToMessageId: replyToMessageId || null,
      sentAt: new Date(),
      createdAt: new Date(),
      type: 'student_to_admin',
      read: false
    };

    const result = await messages.insertOne(newMessage);
    res.json({ success: true, message: { _id: result.insertedId, ...newMessage } });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

const uploadMessageFileToGridFS = (file, index = 0, senderInfo = {}) => {
  const uniqueSuffix = `${Date.now()}-${index}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.originalname || '') || '';
  const filename = `msg-attach-${uniqueSuffix}${ext}`;

  return new Promise((resolve, reject) => {
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: file.mimetype || 'application/octet-stream',
      metadata: {
        originalName: file.originalname,
        source: 'student_to_admin',
        uploadedAt: new Date(),
        ...senderInfo,
      },
    });
    uploadStream.end(file.buffer);
    uploadStream.on('finish', () => resolve(filename));
    uploadStream.on('error', reject);
  });
};

const uploadMessageAttachmentsToGridFS = async (files, senderInfo = {}) => {
  const fileRecords = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) {
      errors.push({ name: `attachment-${i + 1}`, error: 'Missing file' });
      continue;
    }
    if (!file.buffer?.length) {
      errors.push({ name: file.originalname || `attachment-${i + 1}`, error: 'File data missing or empty' });
      continue;
    }
    try {
      const gfsFilename = await uploadMessageFileToGridFS(file, i, senderInfo);
      fileRecords.push({
        filename: gfsFilename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });
    } catch (err) {
      console.error('[student-to-admin] Error uploading file to GridFS:', file.originalname, err);
      errors.push({ name: file.originalname || `attachment-${i + 1}`, error: err.message });
    }
  }

  return { fileRecords, errors };
};

const normalizeMessageAttachments = (msg) => {
  if (!msg) return msg;
  if (!msg.files) {
    msg.files = [];
    msg.attachmentCount = 0;
    return msg;
  }

  let files = msg.files;
  if (!Array.isArray(files)) {
    files = Object.values(files);
  }

  msg.files = files
    .filter((f) => f && (f.filename || f.originalname || f.path))
    .map((f) => {
      const storedName = f.path ? (String(f.path).startsWith('uploads/') || String(f.path).startsWith('uploads\\') ? String(f.path).split(/[/\\]/).pop() : f.path) : f.filename;
      const displayName = f.originalname || f.filename || f.path;
      return {
        filename: storedName,
        originalname: displayName,
        path: storedName,
        size: f.size,
        mimetype: f.mimetype,
      };
    });

  msg.attachmentCount = msg.files.length;
  return msg;
};

// Student message to admin (optional multiple file attachments, max 3 files / 12MB combined)
const STUDENT_MESSAGE_MAX_TOTAL_BYTES = 12 * 1024 * 1024;
app.post('/api/messages/student-to-admin', upload.array('attachments', 3), async (req, res) => {
  try {
    const { senderEmail, senderName, subject } = req.body;
    const message = String(req.body.message || '').trim();
    const uploadFiles = Array.isArray(req.files) ? req.files : [];

    if (!senderEmail || (!message && uploadFiles.length === 0)) {
      return res.status(400).json({ success: false, error: 'Sender email and a message or attachment are required' });
    }

    const totalBytes = uploadFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > STUDENT_MESSAGE_MAX_TOTAL_BYTES) {
      return res.status(400).json({ success: false, error: 'Combined attachment size cannot exceed 12MB' });
    }

    if (!gfsBucket) {
      return res.status(503).json({ success: false, error: 'File storage is not ready. Please try again shortly.' });
    }

    const expectedCount = Number.parseInt(req.body.attachmentCount, 10);

    if (Number.isFinite(expectedCount) && expectedCount > 0 && uploadFiles.length !== expectedCount) {
      return res.status(400).json({
        success: false,
        error: `Expected ${expectedCount} attachment(s) but received ${uploadFiles.length}. Please try again.`,
        filesReceived: uploadFiles.length,
      });
    }

    const { fileRecords, errors } = await uploadMessageAttachmentsToGridFS(uploadFiles, {
      senderName: senderName || 'Student',
      senderEmail,
    });

    if (errors.length > 0) {
      return res.status(500).json({
        success: false,
        error: `Could not save all attachments: ${errors.map((e) => e.name).join(', ')}`,
        filesReceived: fileRecords.length,
        filesFailed: errors.length,
      });
    }

    if (uploadFiles.length > 0 && fileRecords.length !== uploadFiles.length) {
      return res.status(500).json({
        success: false,
        error: `Only ${fileRecords.length} of ${uploadFiles.length} attachment(s) were saved. Please try again.`,
        filesReceived: fileRecords.length,
      });
    }

    if (Number.isFinite(expectedCount) && expectedCount > 0 && fileRecords.length !== expectedCount) {
      return res.status(500).json({
        success: false,
        error: `Only ${fileRecords.length} of ${expectedCount} attachment(s) were saved. Please try again.`,
        filesReceived: fileRecords.length,
      });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const newMessage = {
      senderEmail,
      senderName: senderName || 'Student',
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject: subject || 'Message from Student',
      message,
      files: fileRecords,
      attachmentCount: fileRecords.length,
      sentAt: new Date(),
      createdAt: new Date(),
      type: 'student_chat_to_admin',
      read: false,
    };

    const result = await messages.insertOne(newMessage);

    console.log('[student-to-admin] saved message', {
      id: result.insertedId,
      senderEmail,
      filesSaved: fileRecords.length,
      names: fileRecords.map((f) => f.originalname),
    });

    res.json({
      success: true,
      filesReceived: fileRecords.length,
      message: { _id: result.insertedId, ...newMessage },
    });
  } catch (error) {
    console.error('Error sending student message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reviewer message to admin (optional multiple file attachments, max 3 files / 12MB combined)
const REVIEWER_MESSAGE_MAX_TOTAL_BYTES = 12 * 1024 * 1024;
app.post('/api/messages/to-admin', upload.array('attachments', 3), async (req, res) => {
  try {
    const { senderEmail, senderName, subject } = req.body;
    const message = String(req.body.message || '').trim();
    const uploadFiles = Array.isArray(req.files) ? req.files : [];

    if (!senderEmail || (!message && uploadFiles.length === 0)) {
      return res.status(400).json({ success: false, error: 'Sender email and a message or attachment are required' });
    }

    const totalBytes = uploadFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > REVIEWER_MESSAGE_MAX_TOTAL_BYTES) {
      return res.status(400).json({ success: false, error: 'Combined attachment size cannot exceed 12MB' });
    }

    if (uploadFiles.length > 0 && !gfsBucket) {
      return res.status(503).json({ success: false, error: 'File storage is not ready. Please try again shortly.' });
    }

    const expectedCount = Number.parseInt(req.body.attachmentCount, 10);

    if (Number.isFinite(expectedCount) && expectedCount > 0 && uploadFiles.length !== expectedCount) {
      return res.status(400).json({
        success: false,
        error: `Expected ${expectedCount} attachment(s) but received ${uploadFiles.length}. Please try again.`,
        filesReceived: uploadFiles.length,
      });
    }

    const { fileRecords, errors } = await uploadMessageAttachmentsToGridFS(uploadFiles, {
      senderName: senderName || 'Reviewer',
      senderEmail,
    });

    if (errors.length > 0) {
      return res.status(500).json({
        success: false,
        error: `Could not save all attachments: ${errors.map((e) => e.name).join(', ')}`,
        filesReceived: fileRecords.length,
        filesFailed: errors.length,
      });
    }

    if (uploadFiles.length > 0 && fileRecords.length !== uploadFiles.length) {
      return res.status(500).json({
        success: false,
        error: `Only ${fileRecords.length} of ${uploadFiles.length} attachment(s) were saved. Please try again.`,
        filesReceived: fileRecords.length,
      });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const newMessage = {
      senderEmail,
      senderName: senderName || 'Reviewer',
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject,
      message,
      files: fileRecords,
      attachmentCount: fileRecords.length,
      sentAt: new Date(),
      createdAt: new Date(),
      type: 'reviewer_chat_to_admin',
      read: false
    };

    const result = await messages.insertOne(newMessage);
    res.json({
      success: true,
      filesReceived: fileRecords.length,
      message: { _id: result.insertedId, ...newMessage },
    });
  } catch (error) {
    console.error('Error sending reviewer message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Sidebar summary for the admin<->researcher chat UI: one row per researcher who has
// exchanged messages with admin, with their last message and unread count.
// Registered before the generic /api/messages/:userId route below, since that route
// would otherwise treat "student-conversations-summary" as a literal userId and shadow this one.
app.get('/api/messages/student-conversations-summary', async (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const pipeline = [
      { $match: { type: { $in: ['admin_to_student', 'student_chat_to_admin'] } } },
      {
        $addFields: {
          partnerEmail: {
            $cond: [{ $eq: ['$type', 'student_chat_to_admin'] }, '$senderEmail', '$recipientEmail'],
          },
          sortDate: { $ifNull: ['$createdAt', '$sentAt'] },
        },
      },
      { $match: { partnerEmail: { $nin: [null, ''] } } },
      { $sort: { sortDate: 1 } },
      {
        $group: {
          _id: { $toLower: '$partnerEmail' },
          email: { $last: '$partnerEmail' },
          lastMessage: { $last: '$message' },
          lastMessageAt: { $last: '$sortDate' },
          lastMessageDeleted: { $last: { $eq: ['$deleted', true] } },
          lastMessageFromAdmin: { $last: { $eq: ['$type', 'admin_to_student'] } },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'student_chat_to_admin'] }, { $ne: ['$read', true] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const results = await messages.aggregate(pipeline).toArray();
    res.json(
      results.map((r) => ({
        email: r.email,
        lastMessage: r.lastMessage,
        lastMessageAt: r.lastMessageAt,
        lastMessageDeleted: r.lastMessageDeleted,
        lastMessageFromAdmin: r.lastMessageFromAdmin,
        unreadCount: r.unreadCount,
      }))
    );
  } catch (error) {
    console.error('Error fetching student conversations summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sidebar summary for the admin<->reviewer chat UI: one row per reviewer who has
// exchanged messages with admin, with their last message and unread count.
// Registered before the generic /api/messages/:userId route below for the same reason
// as the student-conversations-summary route above.
app.get('/api/messages/reviewer-conversations-summary', async (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const pipeline = [
      { $match: { type: { $in: ['admin_to_reviewer', 'reviewer_chat_to_admin'] } } },
      {
        $addFields: {
          partnerEmail: {
            $cond: [{ $eq: ['$type', 'reviewer_chat_to_admin'] }, '$senderEmail', '$recipientEmail'],
          },
          sortDate: { $ifNull: ['$createdAt', '$sentAt'] },
        },
      },
      { $match: { partnerEmail: { $nin: [null, ''] } } },
      { $sort: { sortDate: 1 } },
      {
        $group: {
          _id: { $toLower: '$partnerEmail' },
          email: { $last: '$partnerEmail' },
          lastMessage: { $last: '$message' },
          lastMessageAt: { $last: '$sortDate' },
          lastMessageDeleted: { $last: { $eq: ['$deleted', true] } },
          lastMessageFromAdmin: { $last: { $eq: ['$type', 'admin_to_reviewer'] } },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'reviewer_chat_to_admin'] }, { $ne: ['$read', true] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const results = await messages.aggregate(pipeline).toArray();
    res.json(
      results.map((r) => ({
        email: r.email,
        lastMessage: r.lastMessage,
        lastMessageAt: r.lastMessageAt,
        lastMessageDeleted: r.lastMessageDeleted,
        lastMessageFromAdmin: r.lastMessageFromAdmin,
        unreadCount: r.unreadCount,
      }))
    );
  } catch (error) {
    console.error('Error fetching reviewer conversations summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    const messages = db.collection(collections.messages);
    const students = db.collection(collections.students);
    const reviewers = db.collection(collections.reviewers);
    const users = db.collection(collections.users);

    const isAdmin = await isAdminAccount(db, userId);

    const query = isAdmin
      ? buildAdminInboxQuery(userId)
      : buildUserInboxQuery(userId);

    const messageList = await messages.find(query).sort({ createdAt: -1, sentAt: -1, _id: -1 }).toArray();

    // Enrich messages with actual sender name from students/reviewers/users collections
    const enriched = await Promise.all(messageList.map(async (msg) => {
      if (msg.read === undefined) msg.read = false;
      if (!msg.createdAt && msg.sentAt) msg.createdAt = msg.sentAt;

      if (!msg.senderName || msg.senderName === 'Student' || msg.senderName === 'Reviewer') {
        const student = await students.findOne({ email: emailRegexFilter(msg.senderEmail) }, { projection: { firstName: 1, lastName: 1, name: 1 } });
        if (student) {
          msg.senderName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || msg.senderEmail;
        } else {
          const reviewer = await reviewers.findOne({ email: emailRegexFilter(msg.senderEmail) }, { projection: { firstName: 1, lastName: 1, name: 1 } });
          if (reviewer) {
            msg.senderName = reviewer.name || `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || msg.senderEmail;
          } else {
            const user = await users.findOne({ email: emailRegexFilter(msg.senderEmail) }, { projection: { firstName: 1, lastName: 1, name: 1 } });
            if (user) {
              msg.senderName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || msg.senderEmail;
            }
          }
        }
      }
      return normalizeMessageAttachments(msg);
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    console.log('Attempting to delete message with ID:', messageId);

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    let objectId;
    try {
      objectId = new ObjectId(messageId);
    } catch (error) {
      console.error('Invalid ObjectId format:', messageId);
      return res.status(400).json({ success: false, error: 'Invalid message ID format' });
    }

    const message = await messages.findOne({ _id: objectId });
    if (!message) {
      console.log('Message not found with ID:', messageId);
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Soft delete: keep the document AND its original text/attachments untouched (so an
    // admin can still audit what was actually sent) — only flag it as deleted. The chat
    // UIs key off `deleted` to render a Messenger-style "This message was removed"
    // tombstone instead of the real content, without the underlying data ever being erased.
    await messages.updateOne(
      { _id: objectId },
      { $set: { deleted: true, deletedAt: new Date() } }
    );

    console.log('Message deleted successfully:', messageId);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Edit a message's text and/or attachments (used by the Messenger chat UIs — a sender
// editing their own already-sent message). Accepts multipart/form-data so new files can
// be uploaded; `removeFiles` (JSON array of filename/path identifiers) drops existing ones.
app.put('/api/messages/:messageId', upload.any(), async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = String(req.body.message || '').trim();
    const newFiles = req.files || [];
    let removeFiles = [];
    try {
      removeFiles = JSON.parse(req.body.removeFiles || '[]');
    } catch (e) {
      removeFiles = [];
    }
    const removeSet = new Set(Array.isArray(removeFiles) ? removeFiles : []);

    let objectId;
    try {
      objectId = new ObjectId(messageId);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid message ID format' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const existing = await messages.findOne({ _id: objectId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const existingFiles = Array.isArray(existing.files)
      ? existing.files
      : (existing.files ? Object.values(existing.files) : []);
    const keptFiles = existingFiles.filter((f) => !removeSet.has(f.filename) && !removeSet.has(f.path));
    const removedFiles = existingFiles.filter((f) => removeSet.has(f.filename) || removeSet.has(f.path));

    const uploadedRecords = [];
    for (const file of newFiles) {
      try {
        const gfsFilename = await uploadToGridFS(file, {
          senderName: existing.senderName || 'Admin',
          senderEmail: existing.senderEmail,
          source: 'message-edit',
          recipientEmail: existing.recipientEmail,
        });
        uploadedRecords.push({
          filename: gfsFilename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: gfsFilename,
        });
      } catch (err) {
        console.error('Failed to upload edited-message attachment to GridFS:', err.message);
      }
    }

    const finalFiles = [...keptFiles, ...uploadedRecords];

    if (!message && finalFiles.length === 0) {
      return res.status(400).json({ success: false, error: 'Message text or at least one attachment is required' });
    }

    const result = await messages.findOneAndUpdate(
      { _id: objectId },
      { $set: { message, files: finalFiles, edited: true, editedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (removedFiles.length > 0) {
      Promise.all(
        removedFiles.map((f) => deleteFromGridFS(f.path || f.filename).catch((e) => console.error('Error deleting edited-message attachment from GridFS:', e)))
      ).catch(() => {});
    }

    res.json({ success: true, message: result });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Mark a single message as read
app.put('/api/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Message ID is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const result = await messages.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    console.log(`Marked message ${id} as read`);
    res.json({
      success: true,
      message: 'Message marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Mark all messages as read for a user
app.put('/api/messages/read-all', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);
    const isAdmin = await isAdminAccount(db, email);

    const query = isAdmin
      ? { $and: [buildAdminInboxQuery(email), { read: { $ne: true } }] }
      : { $and: [buildUserInboxQuery(email), { read: { $ne: true } }] };

    const result = await messages.updateMany(
      query,
      { $set: { read: true } }
    );

    console.log(`Marked ${result.modifiedCount} messages as read for user: ${email}`);
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Assign file to reviewer
app.post('/api/assign-file-to-reviewer', upload.any(), async (req, res) => {
  try {
    let {
      protocolCode,
      secondaryReviewer1,
      secondaryReviewer2,
      startDate,
      endDate,
      proposalId,
      removedAttachmentKeys
    } = req.body;

    // Trim protocolCode to avoid uniqueness issues with white space
    if (protocolCode) protocolCode = protocolCode.toUpperCase().replace(/\s+/g, '');

    let removedKeys = [];
    if (removedAttachmentKeys) {
      try {
        const parsed = JSON.parse(removedAttachmentKeys);
        if (Array.isArray(parsed)) removedKeys = parsed.map(String);
      } catch (_) { /* ignore malformed input */ }
    }

    // Collect all uploaded files dynamically (accepts any field name)
    const uploadedFiles = {};
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const fileItem of req.files) {
        const gfsFilename = await uploadToGridFS(fileItem, {
          senderName: 'Admin',
          source: 'admin-reviewer-assignment',
          proposalId,
          protocolCode,
        });
        uploadedFiles[fileItem.fieldname] = {
          filename: gfsFilename,
          originalname: fileItem.originalname,
          size: fileItem.size,
          mimetype: fileItem.mimetype
        };
      }
    }

    const db = getDatabase();
    const proposals = db.collection(collections.proposals);

    // Look up the existing proposal using proposalId if provided
    let existingProposal = null;
    if (proposalId && ObjectId.isValid(proposalId)) {
      existingProposal = await proposals.findOne({ _id: new ObjectId(proposalId) });
    }

    // Check Protocol Code Uniqueness
    if (protocolCode) {
      const proposalWithSameCode = await proposals.findOne({ protocolCode });
      if (proposalWithSameCode) {
        // If it's found, and it's NOT the same as the selected existing proposal, then the code is taken!
        if (!existingProposal || proposalWithSameCode._id.toString() !== existingProposal._id.toString()) {
          return res.status(400).json({ success: false, error: 'Protocol Code is already in use by another proposal' });
        }
        // If we didn't have existingProposal but found one by code, let's link it (fallback)
        if (!existingProposal) {
          existingProposal = proposalWithSameCode;
        }
      }
    }

    // Validation — Secondary Reviewer 2 is optional
    if (!protocolCode || !secondaryReviewer1 || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Protocol code, Secondary Reviewer 1, start date, and end date are required',
      });
    }

    if (secondaryReviewer2 && secondaryReviewer2 === secondaryReviewer1) {
      return res.status(400).json({
        success: false,
        error: 'Secondary Reviewer 2 must be different from Secondary Reviewer 1',
      });
    }

    const reviewer2Value = secondaryReviewer2?.trim() ? secondaryReviewer2 : null;

    if (!existingProposal && Object.keys(uploadedFiles).length === 0) {
      return res.status(400).json({ success: false, error: 'At least one document must be uploaded' });
    }

    let resolvedProposalId;
    let researchTitle = `Assigned Files - ${protocolCode}`;
    let proponent = secondaryReviewer1;
    let studentEmail = '';
    let preservedStudentFiles = null;

    if (existingProposal) {
      resolvedProposalId = existingProposal._id;
      researchTitle = existingProposal.researchTitle || researchTitle;
      proponent = existingProposal.proponent || existingProposal.studentName || proponent;
      studentEmail = existingProposal.studentEmail || studentEmail;

      preservedStudentFiles = pickStudentAssignmentFiles(
        existingProposal.studentFiles || existingProposal.files || {}
      );
      const preservedAdminFiles = pickAdminAssignmentFiles(existingProposal.adminFiles || {});

      // Explicit removals (admin cleared an existing attachment without replacing it)
      removedKeys.forEach((key) => {
        const removedFile = preservedAdminFiles[key];
        if (removedFile?.filename) {
          deleteFromGridFS(removedFile.filename).catch((e) => console.error('Error deleting removed attachment:', e));
        }
        delete preservedAdminFiles[key];
      });

      // Replacements (a new file uploaded under a key that already had one) — drop the old blob
      Object.keys(uploadedFiles).forEach((key) => {
        const oldFile = preservedAdminFiles[key];
        if (oldFile?.filename) {
          deleteFromGridFS(oldFile.filename).catch((e) => console.error('Error deleting replaced attachment:', e));
        }
      });

      const adminFiles = {
        ...preservedAdminFiles,
        ...uploadedFiles,
      };
      const mergedFiles = { ...preservedStudentFiles, ...adminFiles };

      // Preserve student/preliminary reviewer on proposal — only add secondary reviewers
      const preliminaryEmail = existingProposal.preliminaryReviewer
        || existingProposal.reviewers?.reviewer1
        || null;
      const proposalUpdate = {
        protocolCode,
        studentFiles: preservedStudentFiles,
        adminFiles,
        files: mergedFiles,
        reviewers: {
          reviewer1: preliminaryEmail,
          reviewer2: secondaryReviewer1,
          reviewer3: reviewer2Value,
        },
        preliminaryReviewer: existingProposal.preliminaryReviewer,
        preliminaryReviewerName: existingProposal.preliminaryReviewerName,
        studentEmail: existingProposal.studentEmail,
        researchTitle: existingProposal.researchTitle,
        proponent: existingProposal.proponent || existingProposal.studentName,
        initialReviewDecision: req.body.initialReviewDecision || existingProposal.initialReviewDecision || null,
        secondaryReviewer1,
        secondaryReviewer2: reviewer2Value,
        reviewPeriod: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        updatedAt: new Date(),
      };
      const lockedStatuses = ['completed', 'approved', 'rejected'];
      const currentStatus = (existingProposal.status || '').toLowerCase();
      if (!lockedStatuses.includes(currentStatus)) {
        proposalUpdate.status = 'Under Review';
      }

      await proposals.updateOne(
        { _id: resolvedProposalId },
        { $set: proposalUpdate }
      );
      console.log('Existing proposal updated and assigned to reviewers:', resolvedProposalId);
    } else {
      const newProposal = {
        protocolCode,
        researchTitle,
        proponent,
        initialReviewDecision: req.body.initialReviewDecision || null,
        dateOfApplication: new Date(),
        status: 'Under Review',
        secondaryReviewer1,
        secondaryReviewer2: reviewer2Value,
        reviewers: {
          reviewer1: secondaryReviewer1,
          reviewer2: reviewer2Value,
          reviewer3: null
        },
        reviewPeriod: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        files: uploadedFiles,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await proposals.insertOne(newProposal);
      resolvedProposalId = result.insertedId;
      console.log('New proposal created and files assigned to reviewers:', resolvedProposalId);
    }

    // Create or update assignments for each reviewer to access these files
    const assignments = db.collection(collections.assignments);
    const reviewerCollection = db.collection(collections.reviewers);
    const reviewerValues = [...new Set([secondaryReviewer1, reviewer2Value].filter(Boolean))];

    // Collect reviewer names for admin notification
    const assignedReviewerNames = [];
    const notifications = db.collection(collections.notifications);
    const reviews = db.collection(collections.reviews);

    // Was this proposal already assigned to reviewers before this save? If so, this is a
    // reassign — reassigning should not spam a new/edited notification for every save.
    const priorAdminAssignmentCount = await assignments.countDocuments({
      $and: [{ $or: buildProposalIdMatchers(resolvedProposalId) }, adminAssignmentFilter()],
    });
    const isReassignment = priorAdminAssignmentCount > 0;

    for (const reviewerEmail of reviewerValues) {
      // Look up the reviewer by email — direct, guaranteed match
      const reviewer = await reviewerCollection.findOne({ email: reviewerEmail });

      if (!reviewer) {
        console.warn(`Reviewer not found for email: ${reviewerEmail}`);
        continue;
      }

      const resolvedName = reviewer.name ||
        `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() ||
        reviewer.email;

      // Store name for admin notification
      assignedReviewerNames.push(resolvedName);

      const proposalIdMatchers = [
        { proposalId: resolvedProposalId },
        { proposalId: resolvedProposalId.toString() },
      ];
      if (ObjectId.isValid(String(resolvedProposalId)) && String(new ObjectId(resolvedProposalId)) === String(resolvedProposalId)) {
        proposalIdMatchers.push({ proposalId: new ObjectId(resolvedProposalId) });
      }

      // Only match admin-created assignments — never overwrite student/preliminary assignments
      const existingAdminAssignment = await assignments.findOne({
        $and: [
          { reviewerEmail: emailRegexFilter(reviewer.email) },
          { $or: proposalIdMatchers },
          adminAssignmentFilter(),
        ],
      });

      const studentFiles = existingProposal
        ? pickStudentAssignmentFiles(existingProposal.studentFiles || existingProposal.files || {})
        : {};
      const existingAdminFiles = pickAdminAssignmentFiles(existingAdminAssignment?.assignedFiles || existingProposal?.adminFiles || {});
      // Keep the reviewer's copy in sync with attachments the admin removed this save.
      removedKeys.forEach((removedKey) => delete existingAdminFiles[removedKey]);
      const allAssignedFiles = {
        ...studentFiles,
        ...existingAdminFiles,
        ...uploadedFiles,
      };

      const reviewerRole = (reviewerEmail.toLowerCase() === secondaryReviewer1.toLowerCase())
        ? 'Chair'
        : ((secondaryReviewer2 && reviewerEmail.toLowerCase() === secondaryReviewer2.toLowerCase()) ? 'Member' : 'Reviewer');

      const assignmentData = {
        proposalId: resolvedProposalId,
        reviewerId: reviewer._id,
        reviewerEmail: reviewer.email,
        reviewerName: resolvedName,
        protocolCode: protocolCode,
        researchTitle: researchTitle,
        proponent: proponent,
        studentEmail: studentEmail,
        reviewerRole: reviewerRole,
        secondaryReviewer1: secondaryReviewer1,
        secondaryReviewer2: reviewer2Value,
        initialReviewDecision: req.body.initialReviewDecision || existingProposal?.initialReviewDecision || null,
        assignedFiles: allAssignedFiles,
        reviewPeriod: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        status: 'Pending',
        assignedBy: 'admin',
        assignmentSource: 'admin',
        updatedAt: new Date()
      };

      if (existingAdminAssignment) {
        await assignments.updateOne(
          { _id: existingAdminAssignment._id },
          {
            $set: {
              ...assignmentData,
              status: existingAdminAssignment.status || assignmentData.status,
            },
          }
        );
        console.log(`Admin assignment updated for reviewer: ${resolvedName} (${reviewer.email})`);
      } else {
        await assignments.insertOne({
          ...assignmentData,
          createdAt: new Date()
        });
        console.log(`Admin assignment created for reviewer: ${resolvedName} (${reviewer.email})`);
      }

      // Notify the reviewer when they're assigned to this proposal. First time, insert a
      // fresh notification. On reassignment (they already held this admin assignment),
      // update their existing notification in place instead of spamming a new one — the
      // admin may have changed the protocol code, added files, or moved the deadline, so
      // the notification should be "remade" to reflect the latest state.
      const notificationPayload = {
        recipientEmail: reviewer.email,
        recipientName: reviewer.email,
        title: 'New Files Assigned for Review',
        message: `You have been assigned ${Object.keys(allAssignedFiles).length} document(s) for review in protocol ${protocolCode}. Please review the assigned files before the deadline.`,
        type: 'assignment',
        protocolCode: protocolCode,
        proposalId: resolvedProposalId,
        reviewPeriod: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        assignedFiles: Object.keys(allAssignedFiles),
        read: false,
        createdAt: new Date()
      };

      if (!existingAdminAssignment) {
        await notifications.insertOne(notificationPayload);
        console.log(`Notification sent to: ${resolvedName} (${reviewer.email})`);
      } else {
        const priorNotification = await notifications.find({
          recipientEmail: emailRegexFilter(reviewer.email),
          proposalId: resolvedProposalId,
          type: 'assignment',
        }).sort({ createdAt: -1 }).limit(1).next();

        if (priorNotification) {
          await notifications.updateOne(
            { _id: priorNotification._id },
            { $set: notificationPayload }
          );
          console.log(`Notification updated for: ${resolvedName} (${reviewer.email}) — reassignment with changes`);
        } else {
          await notifications.insertOne(notificationPayload);
          console.log(`Notification created for: ${resolvedName} (${reviewer.email}) — reassignment, no prior notification found`);
        }
      }
    }

    // Reassignment cleanup — a reviewer who previously held this admin assignment but is
    // no longer Reviewer 1/2 after this save loses access entirely (their assignment record,
    // and with it the files/data that were sent to them, is deleted rather than left dangling).
    try {
      const proposalMatchers = buildProposalIdMatchers(resolvedProposalId);
      const currentAdminAssignments = await assignments.find({
        $and: [{ $or: proposalMatchers }, adminAssignmentFilter()],
      }).toArray();

      const keptEmails = new Set(reviewerValues.map((email) => email.toLowerCase()));
      const staleAssignments = currentAdminAssignments.filter(
        (a) => a.reviewerEmail && !keptEmails.has(a.reviewerEmail.toLowerCase())
      );

      if (staleAssignments.length > 0) {
        await assignments.deleteMany({ _id: { $in: staleAssignments.map((a) => a._id) } });

        // Also delete any review this reviewer already submitted for this proposal —
        // leaving it behind orphans a "Mark Completed Review" row for a reviewer no
        // longer assigned, which is exactly the stale-data reassignment causes.
        const staleReviewFilters = staleAssignments
          .filter((stale) => stale.reviewerEmail)
          .map((stale) => ({
            $and: [
              { reviewerEmail: emailRegexFilter(stale.reviewerEmail) },
              { $or: [...proposalMatchers, ...(protocolCode ? [{ protocolCode }] : [])] },
            ],
          }));
        let staleReviewsDeleted = 0;
        if (staleReviewFilters.length > 0) {
          const staleReviewsResult = await reviews.deleteMany({ $or: staleReviewFilters });
          staleReviewsDeleted = staleReviewsResult.deletedCount || 0;
        }

        for (const stale of staleAssignments) {
          await notifications.insertOne({
            recipientEmail: stale.reviewerEmail,
            recipientName: stale.reviewerName || stale.reviewerEmail,
            title: 'Removed from Review Assignment',
            message: `You have been unassigned from protocol ${protocolCode}. This proposal and its files are no longer available in your dashboard.`,
            type: 'assignment_removed',
            protocolCode,
            proposalId: resolvedProposalId,
            read: false,
            createdAt: new Date(),
          });
        }
        console.log(`Removed ${staleAssignments.length} stale admin assignment(s) and ${staleReviewsDeleted} stale review submission(s) for proposal ${resolvedProposalId}`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up stale reviewer assignments:', cleanupError);
    }

    // Link protocol code only to student/preliminary assignments (never replace their files)
    try {
      const linkProposalMatchers = [
        { proposalId: resolvedProposalId },
        { proposalId: resolvedProposalId.toString() },
      ];
      if (ObjectId.isValid(String(resolvedProposalId)) && String(new ObjectId(resolvedProposalId)) === String(resolvedProposalId)) {
        linkProposalMatchers.push({ proposalId: new ObjectId(resolvedProposalId) });
      }

      const studentAssignments = await assignments.find({
        $and: [
          { $or: linkProposalMatchers },
          {
            $or: [
              { assignmentSource: 'student' },
              { assignmentSource: { $exists: false }, assignedBy: { $ne: 'admin' } },
            ],
          },
        ],
      }).toArray();

      for (const studentAssignment of studentAssignments) {
        await assignments.updateOne(
          { _id: studentAssignment._id },
          {
            $set: {
              ...(studentEmail ? { studentEmail } : {}),
              ...(preservedStudentFiles ? { assignedFiles: preservedStudentFiles } : {}),
              updatedAt: new Date(),
            },
            $unset: { protocolCode: '' },
          }
        );
      }
      console.log(`Updated ${studentAssignments.length} student assignment(s) for proposal ${resolvedProposalId} (protocol stays on admin assignments only)`);
    } catch (cascadeError) {
      console.error('Error linking student assignments:', cascadeError);
    }

    if (existingProposal) {
      const refreshedProposal = await proposals.findOne({ _id: resolvedProposalId });
      await ensureStudentAssignmentForProposal(db, refreshedProposal || existingProposal);
    }

    // Notify admin only the first time this proposal is assigned to reviewers.
    // A later reassign (changing reviewers/dates on an already-assigned proposal)
    // does not need a fresh notification.
    if (!isReassignment) {
      await notifications.insertOne({
        title: 'Files Assigned to Reviewers',
        message: `You have assigned ${Object.keys(uploadedFiles).length} document(s) for protocol ${protocolCode} to ${assignedReviewerNames.join(' and ')}.`,
        type: 'admin_assignment',
        protocolCode: protocolCode,
        proposalId: resolvedProposalId,
        recipientEmail: 'admin',
        assignedReviewers: assignedReviewerNames,
        read: false,
        createdAt: new Date()
      });
      console.log(`Admin notification created with reviewers: ${assignedReviewerNames.join(', ')}`);
    } else {
      console.log(`Skipped admin notification — proposal ${resolvedProposalId} was already assigned (reassign)`);
    }

    res.json({
      success: true,
      message: 'Files successfully assigned to reviewers',
      proposalId: resolvedProposalId.toString(),
      assignedReviewers: reviewerValues.length
    });
  } catch (error) {
    console.error('Error assigning files to reviewer:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const reviews = db.collection(collections.reviews);
    const users = db.collection(collections.users);
    const assignments = db.collection(collections.assignments);

    const proposalCount = await proposals.countDocuments();

    // Under Review count: mirrors the Mark Completed Review page, where an
    // assignment is "done" once either the assignment itself or its linked
    // proposal is marked completed — anything else counts as under review
    // (that page has no separate "Pending" state).
    const assignmentDocs = await assignments.find({}, { projection: { status: 1, proposalId: 1 } }).toArray();
    const proposalStatusById = new Map(
      (await proposals.find({}, { projection: { status: 1 } }).toArray())
        .map(p => [String(p._id), String(p.status || '').toLowerCase()])
    );
    const isAssignmentDone = (a) => {
      const assignmentCompleted = String(a.status || '').toLowerCase() === 'completed';
      const proposalCompleted = proposalStatusById.get(String(a.proposalId)) === 'completed';
      return assignmentCompleted || proposalCompleted;
    };
    const pendingReviewCount = assignmentDocs.filter(a => !isAssignmentDone(a)).length;

    // Completed count: same Mark Completed Review definition as above, just the other side of it.
    const approvedCount = assignmentDocs.filter(isAssignmentDone).length;
    const reviewers = db.collection(collections.reviewers);
    const activeReviewersCount = await reviewers.countDocuments();

    // Student-submitted proposals: submitted via /api/student/submit-files (have a non-empty studentEmail)
    const studentProposalCount = await proposals.countDocuments({
      studentEmail: { $exists: true, $nin: [null, ''] }
    });

    // Reviewer-submitted reviews: all completed reviews submitted via /api/reviews
    const reviewerSubmissionCount = await reviews.countDocuments();

    // Realtime "currently logged in" counts + names, driven by the
    // /api/auth/heartbeat pings sent from logged-in Researcher/Reviewer clients.
    const students = db.collection(collections.students);
    const activeSince = new Date(Date.now() - ACTIVE_SESSION_WINDOW_MS);
    const nameProjection = { projection: { name: 1, firstName: 1, middleName: 1, lastName: 1, email: 1, gmail: 1 } };
    const toDisplayName = (doc) =>
      doc.name || [doc.firstName, doc.middleName, doc.lastName].filter(Boolean).join(' ') || doc.email || doc.gmail || 'Unknown';

    const [activeStudentDocs, activeReviewerDocs, totalResearchersCount] = await Promise.all([
      students.find({ lastActive: { $gte: activeSince } }, nameProjection).toArray(),
      reviewers.find({ lastActive: { $gte: activeSince } }, nameProjection).toArray(),
      students.countDocuments()
    ]);
    const onlineResearchersNames = activeStudentDocs.map(toDisplayName);
    const onlineReviewersNames = activeReviewerDocs.map(toDisplayName);

    console.log(`[stats] proposals=${proposalCount}, student=${studentProposalCount}, reviewerSubs=${reviewerSubmissionCount}, totalResearchers=${totalResearchersCount}, onlineResearchers=${onlineResearchersNames.length}, onlineReviewers=${onlineReviewersNames.length}`);

    res.json({
      totalProposals: proposalCount,
      pendingReviews: pendingReviewCount,
      approved: approvedCount,
      activeReviewers: activeReviewersCount,
      totalResearchers: totalResearchersCount,
      studentProposals: studentProposalCount,
      reviewerProposals: reviewerSubmissionCount,
      onlineResearchers: onlineResearchersNames.length,
      onlineReviewers: onlineReviewersNames.length,
      onlineResearchersNames,
      onlineReviewersNames
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message to student endpoint
app.post('/api/send-message-to-student', upload.any(), async (req, res) => {
  const { studentEmail, recipientName: clientRecipientName, message: rawMessage } = req.body;
  const message = String(rawMessage || '').trim();
  const files = req.files || [];

  // Validate required fields — either message text or at least one attachment
  if (!studentEmail || (!message && files.length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Student email and a message or attachment are required'
    });
  }

  // Max 3 files / 12MB combined
  if (files.length > 3) {
    return res.status(400).json({ success: false, error: 'You can attach up to 3 files per message' });
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > 12 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'Combined attachment size cannot exceed 12MB' });
  }

  const recipientName = clientRecipientName || studentEmail;

  // Upload files to GridFS first
  const fileRecords = [];
  if (files.length > 0) {
    for (const file of files) {
      try {
        console.log('[upload] file.fieldname:', file.fieldname, 'originalname:', file.originalname);
        const gfsFilename = await uploadToGridFS(file, {
          senderName: 'Admin',
          source: 'admin-message-to-student',
          recipientEmail: studentEmail,
        });
        console.log('[upload] GridFS filename stored:', gfsFilename);
        fileRecords.push({
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: gfsFilename // Store GridFS filename for retrieval
        });
      } catch (err) {
        console.error('Failed to upload file to GridFS:', err.message);
        fileRecords.push({
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: null
        });
      }
    }
    console.log('[upload] fileRecords:', fileRecords);
  }

  // Respond immediately — do NOT wait for DB or email
  res.json({ success: true, message: 'Message sent successfully', recipientName });

  // Save message to DB in background (fire-and-forget)
  const db = getDatabase();
  const messages = db.collection(collections.messages);
  messages.insertOne({
    senderEmail: process.env.GMAIL_EMAIL || 'admin',
    recipientEmail: studentEmail,
    recipientName,
    message,
    files: fileRecords,
    sentAt: new Date(),
    createdAt: new Date(),
    type: 'admin_to_student',
    status: 'sent'
  }).catch(err => console.error('Failed to save message to DB:', err.message));

  // Send email in background (fire-and-forget)
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #7A9E7E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">admin</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #7A9E7E; margin-bottom: 20px;">
              <p style="margin: 0; line-height: 1.6; color: #555;">${message}</p>
            </div>
      `;

    if (files.length > 0) {
      emailContent += `
          <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #4a6b4e;">Attached Files (${files.length}):</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
        `;
      files.forEach(file => {
        emailContent += `<li style="margin-bottom: 5px;">${file.originalname} (${(file.size / 1024).toFixed(1)} KB)</li>`;
      });
      emailContent += `</ul></div>`;
    }

    emailContent += `
            <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Sent via UREB System on ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `;

    transporter.sendMail({
      from: `admin <${process.env.GMAIL_EMAIL}>`,
      to: studentEmail,
      subject: `admin`,
      html: emailContent,
      attachments: files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      })),
    })
      .then(() => console.log('Email sent to:', studentEmail))
      .catch(err => console.error('Email failed:', err.message));
  }
});

// History of messages the admin has sent to researchers (newest first, paginated)
app.get('/api/messages-to-student/history', async (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || '').trim();

    const query = { type: 'admin_to_student' };
    if (search) {
      const searchRegex = { $regex: escapeRegexEmail(search), $options: 'i' };
      query.$or = [{ recipientName: searchRegex }, { recipientEmail: searchRegex }];
    }

    const total = await messages.countDocuments(query);
    const results = await messages
      .find(query)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      messages: results,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('Error fetching admin-to-student message history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// History of messages the admin has sent to reviewers (newest first, paginated)
app.get('/api/messages-to-reviewer/history', async (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || '').trim();

    const query = { type: 'admin_to_reviewer' };
    if (search) {
      const searchRegex = { $regex: escapeRegexEmail(search), $options: 'i' };
      query.$or = [{ recipientName: searchRegex }, { recipientEmail: searchRegex }];
    }

    const total = await messages.countDocuments(query);
    const results = await messages
      .find(query)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      messages: results,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('Error fetching admin-to-reviewer message history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// History of messages a researcher has sent to the admin (newest first, paginated)
app.get('/api/messages/student-to-admin/history', async (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || '').trim();
    const senderEmail = String(req.query.senderEmail || '').trim();

    if (!senderEmail) {
      return res.status(400).json({ error: 'senderEmail is required' });
    }

    const query = { type: 'student_chat_to_admin', senderEmail };
    if (search) {
      const searchRegex = { $regex: escapeRegexEmail(search), $options: 'i' };
      query.$or = [{ subject: searchRegex }, { message: searchRegex }];
    }

    const total = await messages.countDocuments(query);
    const results = await messages
      .find(query)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      messages: results,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('Error fetching student-to-admin message history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// History of messages a reviewer has sent to the admin (newest first, paginated)
app.get('/api/messages/reviewer-to-admin/history', async (req, res) => {
  try {
    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const search = String(req.query.search || '').trim();
    const senderEmail = String(req.query.senderEmail || '').trim();

    if (!senderEmail) {
      return res.status(400).json({ error: 'senderEmail is required' });
    }

    const query = { type: 'reviewer_chat_to_admin', senderEmail };
    if (search) {
      const searchRegex = { $regex: escapeRegexEmail(search), $options: 'i' };
      query.$or = [{ subject: searchRegex }, { message: searchRegex }];
    }

    const total = await messages.countDocuments(query);
    const results = await messages
      .find(query)
      .sort({ sentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      messages: results,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('Error fetching reviewer-to-admin message history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Full two-way conversation thread between admin and one researcher, oldest first.
app.get('/api/messages/student-conversation/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const query = {
      $or: [
        { type: 'admin_to_student', recipientEmail: emailRegexFilter(email) },
        { type: 'student_chat_to_admin', senderEmail: emailRegexFilter(email) },
      ],
    };

    const list = await messages.find(query).sort({ createdAt: 1, sentAt: 1, _id: 1 }).toArray();
    const normalized = list.map((msg) => {
      if (!msg.createdAt && msg.sentAt) msg.createdAt = msg.sentAt;
      if (msg.read === undefined) msg.read = false;
      return normalizeMessageAttachments(msg);
    });

    res.json(normalized);
  } catch (error) {
    console.error('Error fetching student conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk mark all of one researcher's messages to admin as read (used when the admin opens the thread).
app.put('/api/messages/student-conversation/:email/read', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const result = await messages.updateMany(
      { type: 'student_chat_to_admin', senderEmail: emailRegexFilter(email), read: { $ne: true } },
      { $set: { read: true } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking student conversation as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Mirror of the route above, for the researcher's own side of the same conversation:
// bulk marks all of admin's unread messages to this researcher as read (called when
// the researcher opens their "Message Admin" chat).
app.put('/api/messages/student-conversation/:email/mark-admin-read', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const result = await messages.updateMany(
      { type: 'admin_to_student', recipientEmail: emailRegexFilter(email), read: { $ne: true } },
      { $set: { read: true } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking admin messages as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Full two-way conversation thread between admin and one reviewer, oldest first.
app.get('/api/messages/reviewer-conversation/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const query = {
      $or: [
        { type: 'admin_to_reviewer', recipientEmail: emailRegexFilter(email) },
        { type: 'reviewer_chat_to_admin', senderEmail: emailRegexFilter(email) },
      ],
    };

    const list = await messages.find(query).sort({ createdAt: 1, sentAt: 1, _id: 1 }).toArray();
    const normalized = list.map((msg) => {
      if (!msg.createdAt && msg.sentAt) msg.createdAt = msg.sentAt;
      if (msg.read === undefined) msg.read = false;
      return normalizeMessageAttachments(msg);
    });

    res.json(normalized);
  } catch (error) {
    console.error('Error fetching reviewer conversation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk mark all of one reviewer's messages to admin as read (used when the admin opens the thread).
app.put('/api/messages/reviewer-conversation/:email/read', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const result = await messages.updateMany(
      { type: 'reviewer_chat_to_admin', senderEmail: emailRegexFilter(email), read: { $ne: true } },
      { $set: { read: true } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking reviewer conversation as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Mirror of the route above, for the reviewer's own side of the same conversation:
// bulk marks all of admin's unread messages to this reviewer as read (called when
// the reviewer opens their "Messages" chat).
app.put('/api/messages/reviewer-conversation/:email/mark-admin-read', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const db = getDatabase();
    const messages = db.collection(collections.messages);

    const result = await messages.updateMany(
      { type: 'admin_to_reviewer', recipientEmail: emailRegexFilter(email), read: { $ne: true } },
      { $set: { read: true } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking admin messages as read:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Send message to reviewer endpoint
app.post('/api/send-message-to-reviewer', upload.any(), async (req, res) => {
  const { reviewerEmail, recipientName: clientRecipientName, message: rawMessage } = req.body;
  const message = String(rawMessage || '').trim();
  const files = req.files || [];

  // Validate required fields — either message text or at least one attachment
  if (!reviewerEmail || (!message && files.length === 0)) {
    return res.status(400).json({
      success: false,
      error: 'Reviewer email and a message or attachment are required'
    });
  }

  // Max 3 files / 12MB combined
  if (files.length > 3) {
    return res.status(400).json({ success: false, error: 'You can attach up to 3 files per message' });
  }
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > 12 * 1024 * 1024) {
    return res.status(400).json({ success: false, error: 'Combined attachment size cannot exceed 12MB' });
  }

  const recipientName = clientRecipientName || reviewerEmail;

  // Upload files to GridFS first
  const fileRecords = [];
  if (files.length > 0) {
    for (const file of files) {
      try {
        console.log('[upload] reviewer message file.fieldname:', file.fieldname, 'originalname:', file.originalname);
        const gfsFilename = await uploadToGridFS(file, {
          senderName: 'Admin',
          source: 'admin-message-to-reviewer',
          recipientEmail: reviewerEmail,
        });
        console.log('[upload] GridFS filename stored:', gfsFilename);
        fileRecords.push({
          filename: gfsFilename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: gfsFilename // Store GridFS filename for retrieval
        });
      } catch (err) {
        console.error('Failed to upload file to GridFS:', err.message);
        fileRecords.push({
          filename: file.originalname,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: null
        });
      }
    }
    console.log('[upload] reviewer message fileRecords:', fileRecords);
  }

  // Respond immediately
  res.json({ success: true, message: 'Message sent successfully', recipientName });

  // Save message to DB in background
  const db = getDatabase();
  const messages = db.collection(collections.messages);
  messages.insertOne({
    senderEmail: process.env.GMAIL_EMAIL || 'admin',
    senderName: 'UREB Administrator',
    recipientEmail: String(reviewerEmail).trim(),
    recipientName,
    message,
    files: fileRecords,
    createdAt: new Date(),
    sentAt: new Date(),
    type: 'admin_to_reviewer',
    read: false,
    status: 'sent'
  }).catch(err => console.error('Failed to save message to DB:', err.message));

  // Send email in background
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
    let emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #7A9E7E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">admin</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #7A9E7E; margin-bottom: 20px;">
            <p style="margin: 0; line-height: 1.6; color: #555;">${message}</p>
          </div>
    `;

    if (files.length > 0) {
      emailContent += `
        <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #4a6b4e;">Attached Files (${files.length}):</h3>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
      `;
      files.forEach(file => {
        emailContent += `<li style="margin-bottom: 5px;">${file.originalname} (${(file.size / 1024).toFixed(1)} KB)</li>`;
      });
      emailContent += `</ul></div>`;
    }

    emailContent += `
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              Sent via UREB System on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    transporter.sendMail({
      from: `admin <${process.env.GMAIL_EMAIL}>`,
      to: reviewerEmail,
      subject: `admin`,
      html: emailContent,
      attachments: files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype,
      })),
    })
      .then(() => console.log('Email sent to reviewer:', reviewerEmail))
      .catch(err => console.error('Email failed:', err.message));
  }
});

// Multer error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Max size is 10MB per file.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, error: 'Too many attachments. Maximum is 15 files per message.' });
    }
    return res.status(400).json({ success: false, error: 'File upload error: ' + err.message });
  }
  if (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
  next();
});

// Start server
const HOST = '0.0.0.0'; // Bind to all interfaces
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
});
