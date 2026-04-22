import express from 'express';
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import dotenv from 'dotenv';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Startup log to confirm server version
console.log('******************************************');
console.log('*** SERVER STARTING WITH GENDER FIX  ***');
console.log('******************************************');

// Middleware
app.use(cors());
// Debug middleware to log registration requests
app.use((req, res, next) => {
  if (req.path === '/api/auth/register' && req.method === 'POST') {
    console.log('[DEBUG] Raw request body before express.json():', req.body);
  }
  next();
});
app.use(express.json());

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
    // Migration: Add 'title' field to existing reviewers that don't have it
    const reviewers = db.collection('reviewers');
    const result = await reviewers.updateMany(
      { title: { $exists: false } },
      { $set: { title: '' } }
    );
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Upload a single file buffer to GridFS; returns the stored filename
async function uploadToGridFS(file) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
  return new Promise((resolve, reject) => {
    const uploadStream = gfsBucket.openUploadStream(filename, { contentType: file.mimetype });
    uploadStream.end(file.buffer);
    uploadStream.on('finish', () => resolve(filename));
    uploadStream.on('error', reject);
  });
}

// Profile picture multer config (images only, 2 MB)
const profilePicsDir = path.join(uploadsDir, 'profile-pictures');
if (!fs.existsSync(profilePicsDir)) fs.mkdirSync(profilePicsDir, { recursive: true });

const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, profilePicsDir); },
  filename: function (req, file, cb) {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + suffix + path.extname(file.originalname));
  }
});

const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const ok = /jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase())
            && /image\//.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  }
});

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
  '.pdf':  'application/pdf',
  '.jpg':  'image/jpeg', '.jpeg': 'image/jpeg',
  '.png':  'image/png',  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.txt':  'text/plain',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// Diagnostic endpoint — shows server path info
app.get('/api/debug-paths', (req, res) => {
  const testFile = 'urebForm16-1772010333565-744759165.pdf';
  const testPath = path.join(uploadsDir, testFile);
  res.json({
    __dirname,
    uploadsDir,
    testPath,
    testExists: fs.existsSync(testPath),
    uploadsDirExists: fs.existsSync(uploadsDir),
    files: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).slice(0, 10) : []
  });
});

// Download endpoint — disk first, then GridFS fallback
app.get('/api/download/*', async (req, res) => {
  const filename = req.params[0];
  const originalName = req.query.name || filename;
  console.log('[download] requested:', filename);
  try {
    const resolved = await resolveFile(filename);
    console.log('[download] resolved:', resolved ? resolved.source : 'NOT FOUND', resolved?.diskPath || '');
    if (!resolved) return res.status(404).json({ error: 'File not found' });
    const mime = resolved.meta?.contentType
      || MIME_MAP[path.extname(filename).toLowerCase()]
      || 'application/octet-stream';
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
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

// View endpoint — disk first, then GridFS fallback, inline for browser rendering
app.get('/api/view/*', async (req, res) => {
  const filename = req.params[0];
  try {
    const resolved = await resolveFile(filename);
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
  assignments: 'assignments'
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
    console.log(`\n=== LOGIN ATTEMPT ===`);
    console.log(`Email received: "${email}" (length: ${email?.length})`);
    console.log(`Password received: "${password}" (length: ${password?.length})`);
    console.log(`Email chars: [${email?.split('').map(c => `'${c}'`).join(', ')}]`);
    console.log(`Password chars: [${password?.split('').map(c => `'${c}'`).join(', ')}]`);
    
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
      user = await students.findOne({ email });
      userType = 'student';
      if (user) {
        console.log(`Found user in students collection: ${JSON.stringify({ email: user.email, studentId: user.studentId })}`);
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
      return res.json({ success: false, error: 'Invalid email or password' });
    }

    console.log(`\n=== PASSWORD COMPARISON ===`);
    console.log(`Stored password: "${user.password}" (length: ${user.password.length})`);
    console.log(`Provided password: "${password}" (length: ${password.length})`);
    console.log(`Passwords match: ${user.password === password}`);
    console.log(`Stored password chars: [${user.password.split('').map(c => `'${c}'`).join(', ')}]`);
    console.log(`Provided password chars: [${password.split('').map(c => `'${c}'`).join(', ')}]`);

    if (user.password !== password) {
      console.log(`Password mismatch for: ${email}`);
      return res.json({ success: false, error: 'Invalid email or password' });
    }

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

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name || `${user.firstName} ${user.lastName}`,
        role: role,
        userType: userType,
        lastLogin: new Date()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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

    const { firstName, middleName, lastName, studentId, gender, department, program, email, password, role } = req.body;

    const emailNorm = (email || '').trim().toLowerCase();
    const genderNorm = (gender != null && String(gender).trim()) ? String(gender).trim() : '';

    console.log('[DEBUG] Extracted gender from destructuring:', gender);
    console.log('[DEBUG] Computed genderNorm:', genderNorm);
    console.log('Registration request received:', { firstName, lastName, studentId, gender: genderNorm, department, program, email: emailNorm });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);

    // Check if student already exists in students collection
    const existingStudent = await students.findOne({
      $or: [
        { email: emailNorm },
        { studentId: studentId }
      ]
    });

    if (existingStudent) {
      console.log('Student already exists:', existingStudent.email || existingStudent.studentId);
      return res.json({
        success: false,
        error: existingStudent.email === emailNorm
          ? 'A student with this email already exists'
          : 'A student with this ID already exists'
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
      studentId,
      gender: genderNorm,
      department,
      program: program || '',
      email: emailNorm,
      password,
      role: role || 'student',
      createdAt: new Date(),
      lastLogin: null,
      status: 'active'
    };

    console.log('Creating new student:', { ...newStudent, password: '[HIDDEN]' });
    console.log('[DEBUG] About to insert - gender value:', newStudent.gender);
    const result = await students.insertOne(newStudent);
    console.log('[DEBUG] Insert result:', result);
    console.log('Student created successfully with ID:', result.insertedId);

    console.log('[DEBUG] Sending response with gender:', newStudent.gender);
    res.json({
      success: true,
      message: 'Registration successful',
      student: {
        _id: result.insertedId,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email,
        studentId: newStudent.studentId,
        gender: newStudent.gender,
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
app.get('/api/users', async (req, res) => {
  try {
    const db = getDatabase();
    const users = db.collection(collections.users);
    const userList = await users.find({}).toArray();
    res.json(userList);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reviewers operations
app.get('/api/reviewers', async (req, res) => {
  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const reviewerList = await reviewers.find({}).toArray();
    res.json(reviewerList);
  } catch (error) {
    console.error('Error fetching reviewers:', error);
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
app.get('/api/students', async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.collection(collections.students);
    const studentList = await students.find({}).toArray();
    // Only remove sensitive fields like password
    const sanitized = studentList.map((student) => {
      const { password, ...rest } = student;
      return rest;
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
    const { firstName, middleName, lastName, title, email, password, role, department } = req.body;
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
    } else if (title === 'RN' || title === 'LPT' || title === 'MSN' || title === 'RN/LPT' || title === 'RN/MSN') {
      fullName = `${baseName}, ${title}`;
    }

    // Create new user with separate name fields
    const newUser = {
      firstName,
      middleName: middleName || '',
      lastName,
      title: title || '',
      name: fullName, // Keep full name for backward compatibility
      email,
      password,
      role: role || 'reviewer',
      department: department || 'Not specified',
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
    const { email, name } = req.body;
    
    console.log('Extracted email:', email);
    console.log('Extracted name:', name);
    
    if (!email) {
      console.log('Email validation failed - email is missing');
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    if (!name) {
      console.log('Name validation failed - name is missing');
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    console.log('Updating reviewer profile for email:', email);
    console.log('Update data:', { name });
    
    // Check if reviewer exists
    const existingReviewer = await reviewers.findOne({ email: email });
    if (!existingReviewer) {
      console.log('Reviewer not found with email:', email);
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }
    
    console.log('Found reviewer:', existingReviewer);
    
    const result = await reviewers.updateOne(
      { email: email },
      { $set: { name: name, updatedAt: new Date() } }
    );
    
    console.log('Update result:', result);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }
    
    console.log('Profile update successful!');
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      reviewer: {
        name: name,
        email: email
      }
    });
  } catch (error) {
    console.error('Error updating reviewer profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Change reviewer password
app.put('/api/reviewer/change-password', async (req, res) => {
  try {
    const db = getDatabase();
    const reviewers = db.collection(collections.reviewers);
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const reviewer = await reviewers.findOne({ email });
    if (!reviewer) {
      return res.status(404).json({ success: false, error: 'Reviewer not found' });
    }

    if (reviewer.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await reviewers.updateOne(
      { email },
      { $set: { password: newPassword, updatedAt: new Date() } }
    );

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
        await assignments.updateMany(
          { reviewerEmail },
          { $set: { status: updateData.status } }
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
      'email',
      'studentId',
      'gender',
      'department',
      'program',
      'role',
      'gmail',
      'disabled',
      'status',
    ];

    const updateData = {};
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }

    const fn = updateData.firstName !== undefined ? updateData.firstName : existing.firstName;
    const mn = updateData.middleName !== undefined ? updateData.middleName : existing.middleName;
    const ln = updateData.lastName !== undefined ? updateData.lastName : existing.lastName;
    updateData.name = [fn, mn, ln]
      .filter((p) => p != null && String(p).trim() !== '')
      .map((p) => String(p).trim())
      .join(' ');

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
  const gmail = safe.gmail || safe.email || '';
  const gender = String(safe.gender || sex || '').trim();
  console.log('[DEBUG] studentProfilePayload - raw gender from DB:', safe.gender, '| sex:', sex, '| computed gender:', gender);
  return { ...safe, gmail, gender };
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
    console.log('[DEBUG] Student found:', student.email, '| gender in DB:', student.gender);

    res.json({ success: true, student: studentProfilePayload(student) });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT update student profile by email
app.put('/api/student/profile', async (req, res) => {
  try {
    const { email, firstName, middleName, lastName, studentId, gender, department, program, gmail } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

    const db = getDatabase();
    const students = db.collection(collections.students);

    const student = await findStudentByLoginEmail(students, email);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const updateFields = {
      updatedAt: new Date(),
      ...(firstName   !== undefined && { firstName }),
      ...(middleName  !== undefined && { middleName }),
      ...(lastName    !== undefined && { lastName }),
      ...(studentId   !== undefined && { studentId }),
      ...(gender      !== undefined && { gender: (gender != null && String(gender).trim()) ? String(gender).trim() : '' }),
      ...(department  !== undefined && { department }),
      ...(program     !== undefined && { program }),
      ...(gmail       !== undefined && { gmail: (gmail || '').trim().toLowerCase() }),
    };

    // Rebuild full name for backwards-compat
    const fn = firstName  ?? student.firstName  ?? '';
    const mn = middleName ?? student.middleName ?? '';
    const ln = lastName   ?? student.lastName   ?? '';
    updateFields.name = [fn, mn, ln].filter(Boolean).join(' ');

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

    if (student.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await students.updateOne({ _id: student._id }, { $set: { password: newPassword, updatedAt: new Date() } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing student password:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

// Proposal operations
app.get('/api/proposals', async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const proposalList = await proposals.find({}).toArray();
    res.json(proposalList);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/proposals/reviewer/:reviewerEmail', async (req, res) => {
  try {
    const { reviewerEmail } = req.params;
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    // Find proposals where the reviewer is assigned as reviewer1, reviewer2, or reviewer3
    const proposalList = await proposals.find({
      $or: [
        { 'reviewers.reviewer1': reviewerEmail },
        { 'reviewers.reviewer2': reviewerEmail },
        { 'reviewers.reviewer3': reviewerEmail },
        { preliminaryReviewer: reviewerEmail }
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
    
    const proposalList = await proposals.find({ 
      studentEmail: studentEmail 
    }).toArray();
    
    res.json(proposalList);
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
    
    res.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete proposal by ID (student)
app.delete('/api/proposals/:proposalId', async (req, res) => {
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

    const result = await proposals.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true });
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
    const {
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
    
    // Process uploaded files → GridFS
    const files = {};
    if (req.files) {
      for (const fieldname of Object.keys(req.files)) {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          const gfsFilename = await uploadToGridFS(fileArray[0]);
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
  { name: 'ethicsReviewFee', maxCount: 1 }
]), async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const assignments = db.collection(collections.assignments);
    const reviewers = db.collection(collections.reviewers);

    const { department, preliminaryReviewer, preliminaryReviewerName, studentEmail, studentName, proposalTitle } = req.body;

    // Process uploaded files → GridFS
    const files = {};
    if (req.files) {
      for (const fieldname of Object.keys(req.files)) {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          const gfsFilename = await uploadToGridFS(fileArray[0]);
          files[fieldname] = {
            filename: gfsFilename,
            originalname: fileArray[0].originalname,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
        }
      }
    }

    const newProposal = {
      researchTitle: proposalTitle || 'Untitled Proposal',
      proponent: studentName || 'Unknown',
      studentEmail: studentEmail || '',
      department: department || '',
      preliminaryReviewer: preliminaryReviewer || '',
      preliminaryReviewerName: preliminaryReviewerName || '',
      files,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await proposals.insertOne(newProposal);

    // Create an assignment record for the preliminary reviewer so it appears
    // in their "Assigned Proposals" tab — same structure as admin assignments
    if (preliminaryReviewer) {
      const reviewer = await reviewers.findOne({ email: preliminaryReviewer });

      const assignment = {
        proposalId: result.insertedId,
        reviewerId: reviewer?._id || null,
        reviewerEmail: preliminaryReviewer,
        reviewerName: preliminaryReviewerName || reviewer?.name || preliminaryReviewer,
        protocolCode: null,
        researchTitle: proposalTitle || 'Untitled Proposal',
        assignedFiles: files,
        reviewPeriod: {
          startDate: new Date(),
          endDate: null
        },
        status: 'Pending',
        assignedBy: studentName || studentEmail || 'Student',
        studentEmail: studentEmail || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await assignments.insertOne(assignment);
    }

    res.json({
      success: true,
      proposal: { _id: result.insertedId, ...newProposal }
    });
  } catch (error) {
    console.error('Error submitting student files:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Student file resubmission
app.post('/api/student/resubmit-files', upload.array('files'), async (req, res) => {
  try {
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    const messages = db.collection(collections.messages);

    const { resubmissionReason, studentEmail, studentName, submissionType } = req.body;

    // Process uploaded files → GridFS
    const files = {};
    if (req.files && req.files.length > 0) {
      for (let index = 0; index < req.files.length; index++) {
        const file = req.files[index];
        const gfsFilename = await uploadToGridFS(file);
        files[`file${index + 1}`] = {
          filename: gfsFilename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      }
    }

    // Create resubmission record
    const newResubmission = {
      researchTitle: 'Resubmitted Files',
      proponent: studentName || 'Unknown',
      studentEmail: studentEmail || '',
      resubmissionReason: resubmissionReason || '',
      files,
      status: 'Resubmitted',
      submissionType: submissionType || 'resubmission',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save resubmission to proposals collection
    const result = await proposals.insertOne(newResubmission);

    // Send message to admin about resubmission
    const messageRecord = {
      senderEmail: studentEmail || 'student',
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject: 'Files Resubmitted',
      message: `${studentName || 'Student'} has resubmitted files with the following reason: ${resubmissionReason}`,
      senderName: studentName || 'Student',
      type: 'student_to_admin',
      submissionType: 'resubmission',
      relatedProposalId: result.insertedId.toString(),
      read: false,
      createdAt: new Date()
    };

    await messages.insertOne(messageRecord);

    res.json({
      success: true,
      resubmission: { _id: result.insertedId, ...newResubmission }
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
    const reviewList = await reviews.find({}).sort({ createdAt: -1 }).toArray();
    res.json(reviewList);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific review by ID
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
app.post('/api/reviews', upload.fields([
  { name: 'proposal', maxCount: 1 },
  { name: 'approvalSheet', maxCount: 1 },
  { name: 'urebForm2', maxCount: 1 },
  { name: 'urebForm10B', maxCount: 1 },
  { name: 'urebForm11', maxCount: 1 },
  { name: 'applicationForm6', maxCount: 1 },
  { name: 'accomplishedForm8', maxCount: 1 },
  { name: 'accomplishForm10A', maxCount: 1 },
  { name: 'copyOfInstrument', maxCount: 1 },
  { name: 'ethicsReviewFee', maxCount: 1 },
  { name: 'form7', maxCount: 1 }
]), async (req, res) => {
  try {
    const { proposalId, reviewerEmail, reviewerName, decision, comment, overallRating, comments, recommendations } = req.body;
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const proposals = db.collection(collections.proposals);
    const notifications = db.collection(collections.notifications);

    // Process uploaded files → GridFS
    const files = {};
    if (req.files) {
      for (const fieldname of Object.keys(req.files)) {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          const gfsFilename = await uploadToGridFS(fileArray[0]);
          files[fieldname] = {
            filename: gfsFilename,
            originalname: fileArray[0].originalname,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
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
      files,
      status: 'completed',
      createdAt: new Date(),
      completedDate: new Date()
    };

    const result = await reviews.insertOne(newReview);

    // Update proposal status based on decision
    let proposalStatus = 'Reviewed';
    const dec = (decision || overallRating || '').toLowerCase();
    if (dec === 'approved' || dec === 'excellent' || dec === 'good' || dec === 'acceptable') {
      proposalStatus = 'Approved';
    } else if (dec === 'revision' || dec === 'needs revision') {
      proposalStatus = 'Needs Revision';
    } else if (dec === 'rejected' || dec === 'reject') {
      proposalStatus = 'Rejected';
    }

    // Try to update proposal status
    try {
      await proposals.updateOne(
        { _id: new ObjectId(proposalId) },
        { $set: { status: proposalStatus, updatedAt: new Date() } }
      );
    } catch (e) {
      console.log('Could not update proposal status:', e.message);
    }

    // Fetch proposal details for notification
    let proposalTitle = 'Unknown Proposal';
    let protocolCode = '';
    try {
      const proposal = await proposals.findOne({ _id: new ObjectId(proposalId) });
      if (proposal) {
        proposalTitle = proposal.researchTitle || 'Untitled Proposal';
        protocolCode = proposal.protocolCode || '';
      }
    } catch (e) {
      console.log('Could not fetch proposal for notification:', e.message);
    }

    // Create notification for admin
    const notification = {
      type: 'review_submitted',
      title: 'New Review Submitted',
      message: `${reviewerName || reviewerEmail} submitted a review for "${protocolCode ? protocolCode + ': ' : ''}${proposalTitle}" — Decision: ${decision || overallRating}`,
      reviewId: result.insertedId.toString(),
      proposalId,
      reviewerEmail,
      decision: decision || overallRating,
      read: false,
      createdAt: new Date()
    };

    await notifications.insertOne(notification);

    // Create message for admin about submitted review files
    const messages = db.collection(collections.messages);
    const messageRecord = {
      senderEmail: reviewerEmail,
      recipientEmail: process.env.GMAIL_EMAIL || 'admin',
      subject: `Review Submitted: ${protocolCode ? protocolCode + ': ' : ''}${proposalTitle}`,
      message: `${reviewerName || reviewerEmail} submitted a review for "${protocolCode ? protocolCode + ': ' : ''}${proposalTitle}" with decision: ${decision || overallRating}. Files have been uploaded for admin review.`,
      senderName: reviewerName || reviewerEmail,
      type: 'reviewer_to_admin',
      reviewId: result.insertedId.toString(),
      proposalId,
      reviewerEmail,
      decision: decision || overallRating,
      files: files, // Include uploaded files information
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
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// Get all completed reviews (for admin)
app.get('/api/reviews/all', async (req, res) => {
  try {
    const db = getDatabase();
    const reviews = db.collection(collections.reviews);
    const proposals = db.collection(collections.proposals);

    const allReviews = await reviews.find({ status: 'completed' }).sort({ completedDate: -1 }).toArray();

    const enrichedReviews = await Promise.all(
      allReviews.map(async (review) => {
        let proposal = null;
        try {
          proposal = await proposals.findOne({ _id: new ObjectId(review.proposalId) });
        } catch (e) { /* ignore */ }
        return {
          ...review,
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

    const completedReviews = await reviews.find({
      reviewerEmail,
      status: 'completed'
    }).sort({ completedDate: -1 }).toArray();

    // Enrich with proposal details
    const enrichedReviews = await Promise.all(
      completedReviews.map(async (review) => {
        let proposal = null;
        try {
          proposal = await proposals.findOne({ _id: new ObjectId(review.proposalId) });
        } catch (e) { /* ignore */ }
        return {
          ...review,
          proposalTitle: proposal?.researchTitle || 'Untitled Proposal',
          protocolCode: proposal?.protocolCode || '',
          proponent: proposal?.proponent || 'N/A'
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

// Get all notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    const notificationList = await notifications.find({}).sort({ createdAt: -1 }).toArray();
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

// Delete a notification
app.post('/api/notifications/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    await notifications.deleteOne({ _id: new ObjectId(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get notifications for a specific user
app.get('/api/notifications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const db = getDatabase();
    const notifications = db.collection(collections.notifications);
    
    const notificationList = await notifications.find({ 
      recipientEmail: email 
    }).sort({ createdAt: -1 }).toArray();
    
    res.json(notificationList);
  } catch (error) {
    console.error('Error fetching notifications for user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get assignments for a specific reviewer
app.get('/api/assignments/:reviewerEmail', async (req, res) => {
  try {
    const { reviewerEmail } = req.params;
    const db = getDatabase();
    const assignments = db.collection(collections.assignments);

    const assignmentList = await assignments.find({
      reviewerEmail: reviewerEmail
    }).sort({ createdAt: -1 }).toArray();

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

// OTP storage (in production, use Redis or database)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if Gmail exists in system
app.post('/api/check-gmail-exists', async (req, res) => {
  try {
    const { gmail } = req.body;
    
    // Validate Gmail address
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail.com$/;
    if (!gmailRegex.test(gmail)) {
      return res.json({ exists: false });
    }
    
    const db = getDatabase();
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);
    const reviewers = db.collection(collections.reviewers);

    // Check in all collections
    const existingStudent = await students.findOne({ email: gmail });
    const existingUser = await users.findOne({ email: gmail });
    const existingReviewer = await reviewers.findOne({ email: gmail });

    const exists = !!(existingStudent || existingUser || existingReviewer);
    
    res.json({ exists });
  } catch (error) {
    console.error('Error checking Gmail existence:', error);
    res.json({ exists: false });
  }
});

// Send OTP endpoint
app.post('/api/send-otp', (req, res) => {
  const { gmail } = req.body;

  // Validate Gmail address
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail.com$/;
  if (!gmailRegex.test(gmail)) {
    return res.json({ success: false, error: 'Invalid Gmail address' });
  }

  // Generate and store OTP immediately
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  otpStore.set(gmail, { otp, expiry });

  // Respond to the client right away — do NOT wait for the email
  res.json({ success: true, message: 'OTP sent to your Gmail address' });

  // Send the email in the background (fire-and-forget)
  const mailOptions = {
    from: `UREB System <${process.env.GMAIL_EMAIL}>`,
    to: gmail,
    subject: 'UREB System - Email Verification OTP',
    text: `Your OTP for email verification is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this OTP, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7A9E7E;">UREB System - Email Verification</h2>
        <p>Your One-Time Password (OTP) for email verification is:</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 5px;">${otp}</span>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">This is an automated message from the UREB System.</p>
      </div>
    `
  };

  transporter.sendMail(mailOptions)
    .then(() => console.log(`OTP emailed to ${gmail}`))
    .catch((err) => console.error(`Failed to email OTP to ${gmail}:`, err.message));
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
  try {
    const { gmail, otp } = req.body;
    
    // Get stored OTP
    const storedData = otpStore.get(gmail);
    
    if (!storedData) {
      return res.json({ success: false, error: 'OTP not found or expired' });
    }
    
    // Check expiry
    if (new Date() > storedData.expiry) {
      otpStore.delete(gmail);
      return res.json({ success: false, error: 'OTP expired' });
    }
    
    // Verify OTP
    if (storedData.otp !== otp) {
      return res.json({ success: false, error: 'Invalid OTP' });
    }
    
    // OTP is valid, remove it from store
    otpStore.delete(gmail);
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// Upload student profile picture
app.post('/api/student/profile/picture', uploadProfilePic.single('profilePicture'), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !req.file) {
      return res.status(400).json({ success: false, error: 'Email and image are required' });
    }
    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await students.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    // Delete old picture file if it exists
    if (student.profilePicture) {
      const oldFile = path.join(profilePicsDir, path.basename(student.profilePicture));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    const pictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
    await students.updateOne({ email }, { $set: { profilePicture: pictureUrl, updatedAt: new Date() } });
    res.json({ success: true, profilePicture: pictureUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
});

// Delete student profile picture
app.delete('/api/student/profile/picture', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    const db = getDatabase();
    const students = db.collection(collections.students);
    const student = await students.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    if (student.profilePicture) {
      const picFile = path.join(profilePicsDir, path.basename(student.profilePicture));
      if (fs.existsSync(picFile)) fs.unlinkSync(picFile);
    }
    await students.updateOne({ email }, { $set: { profilePicture: null, updatedAt: new Date() } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ success: false, error: 'Server error' });
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
    const student = await students.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    if (student.password !== currentPassword) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    await students.updateOne({ email }, { $set: { password: newPassword, updatedAt: new Date() } });
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
    const student = await students.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    if (student.password !== password) {
      return res.status(400).json({ success: false, error: 'Password is incorrect' });
    }
    await students.deleteOne({ email });
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

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    const messages = db.collection(collections.messages);
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);

    // Determine if the requesting user is an admin:
    // Admins are NOT in the students or reviewers collections.
    const reviewers = db.collection(collections.reviewers);
    const isStudent = await students.findOne({ email: userId }, { projection: { _id: 1 } });
    const isReviewer = !isStudent && await reviewers.findOne({ email: userId }, { projection: { _id: 1 } });
    const isAdmin = !isStudent && !isReviewer;

    const query = isAdmin
      ? { $or: [{ recipientEmail: userId }, { senderEmail: userId }, { type: 'student_to_admin' }, { type: 'reviewer_to_admin' }] }
      : { $or: [{ recipientEmail: userId }, { senderEmail: userId }] };

    const messageList = await messages.find(query).sort({ createdAt: -1 }).toArray();

    // Enrich messages with actual sender name from students/users collections
    const enriched = await Promise.all(messageList.map(async (msg) => {
      if (!msg.senderName || msg.senderName === 'Student') {
        const student = await students.findOne({ email: msg.senderEmail }, { projection: { firstName: 1, lastName: 1, name: 1 } });
        if (student) {
          msg.senderName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || msg.senderEmail;
        } else {
          const user = await users.findOne({ email: msg.senderEmail }, { projection: { firstName: 1, lastName: 1, name: 1 } });
          if (user) {
            msg.senderName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || msg.senderEmail;
          }
        }
      }
      return msg;
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
    
    const result = await messages.deleteOne({ _id: objectId });
    console.log('Delete result:', result);
    
    if (result.deletedCount === 0) {
      console.log('Message not found with ID:', messageId);
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    console.log('Message deleted successfully:', messageId);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
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
    const reviewers = db.collection(collections.reviewers);

    // Determine if the requesting user is an admin:
    // Admins are NOT in the students or reviewers collections.
    const isStudent = await students.findOne({ email: email }, { projection: { _id: 1 } });
    const isReviewer = !isStudent && await reviewers.findOne({ email: email }, { projection: { _id: 1 } });
    const isAdmin = !isStudent && !isReviewer;

    // Use the same query logic as the get messages endpoint
    const query = isAdmin
      ? { 
          $or: [
            { recipientEmail: email, read: { $ne: true } }, 
            { senderEmail: email, read: { $ne: true } }, 
            { type: 'student_to_admin', read: { $ne: true } }
          ]
        }
      : { 
          $or: [
            { recipientEmail: email, read: { $ne: true } }, 
            { senderEmail: email, read: { $ne: true } }
          ]
        };
    
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
app.post('/api/assign-file-to-reviewer', upload.fields([
  { name: 'protocolCode', maxCount: 1 },
  { name: 'secondaryReviewer1', maxCount: 1 },
  { name: 'secondaryReviewer2', maxCount: 1 },
  { name: 'startDate', maxCount: 1 },
  { name: 'endDate', maxCount: 1 },
  { name: 'urebForm16', maxCount: 1 },
  { name: 'urebForm10B', maxCount: 1 },
  { name: 'urebForm11', maxCount: 1 },
  { name: 'urebForm2', maxCount: 1 },
  { name: 'urebForm6', maxCount: 1 },
  { name: 'urebForm7', maxCount: 1 },
  { name: 'urebForm8A', maxCount: 1 },
  { name: 'urebForm10A', maxCount: 1 },
  { name: 'approvedProposal', maxCount: 1 },
  { name: 'questionnaire', maxCount: 1 },
  { name: 'cvOfProponent', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      protocolCode,
      secondaryReviewer1,
      secondaryReviewer2,
      startDate,
      endDate
    } = req.body;
    
    // Collect all uploaded files
    const uploadedFiles = {};
    const documentKeys = [
      'urebForm16', 'urebForm10B', 'urebForm11', 'urebForm2', 'urebForm6', 
      'urebForm7', 'urebForm8A', 'urebForm10A', 'approvedProposal', 
      'questionnaire', 'cvOfProponent'
    ];
    
    for (const key of documentKeys) {
      const files = req.files && req.files[key];
      if (files && files.length > 0) {
        const gfsFilename = await uploadToGridFS(files[0]);
        uploadedFiles[key] = {
          filename: gfsFilename,
          originalname: files[0].originalname,
          size: files[0].size,
          mimetype: files[0].mimetype
        };
      }
    }
    
    // Validation
    if (!protocolCode || !secondaryReviewer1 || !secondaryReviewer2 || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    if (Object.keys(uploadedFiles).length === 0) {
      return res.status(400).json({ success: false, error: 'At least one document must be uploaded' });
    }
    
    const db = getDatabase();
    const proposals = db.collection(collections.proposals);
    
    // Create a new proposal document for the assigned files
    const newProposal = {
      protocolCode,
      researchTitle: `Assigned Files - ${protocolCode}`,
      proponent: secondaryReviewer1, // Use first secondary reviewer as primary
      dateOfApplication: new Date(),
      status: 'under_review',
      reviewers: {
        reviewer1: secondaryReviewer1,
        reviewer2: secondaryReviewer2,
        reviewer3: null
      },
      reviewPeriod: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      files: uploadedFiles,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await proposals.insertOne(newProposal);
    console.log('Files assigned to reviewers:', result.insertedId);
    
    // Create assignments for each reviewer to access these files
    const assignments = db.collection(collections.assignments);
    const reviewerCollection = db.collection(collections.reviewers);
    const reviewerValues = [...new Set([secondaryReviewer1, secondaryReviewer2].filter(Boolean))];

    // Collect reviewer names for admin notification
    const assignedReviewerNames = [];
    const notifications = db.collection(collections.notifications);

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

      const assignment = {
        proposalId: result.insertedId,
        reviewerId: reviewer._id,
        reviewerEmail: reviewer.email,
        reviewerName: resolvedName,
        protocolCode: protocolCode,
        assignedFiles: uploadedFiles,
        reviewPeriod: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        status: 'pending',
        assignedBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await assignments.insertOne(assignment);
      console.log(`Assignment created for reviewer: ${resolvedName} (${reviewer.email})`);

      // Notify the reviewer
      await notifications.insertOne({
        recipientEmail: reviewer.email,
        recipientName: resolvedName,
        title: 'New Files Assigned for Review',
        message: `You have been assigned ${Object.keys(uploadedFiles).length} document(s) for review in protocol ${protocolCode}. Please review the assigned files before the deadline.`,
        type: 'assignment',
        protocolCode: protocolCode,
        proposalId: result.insertedId,
        reviewPeriod: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        assignedFiles: Object.keys(uploadedFiles),
        read: false,
        createdAt: new Date()
      });
      console.log(`Notification sent to: ${resolvedName} (${reviewer.email})`);
    }

    // Create admin notification with assigned reviewer names
    await notifications.insertOne({
      title: 'Files Assigned to Reviewers',
      message: `You have assigned ${Object.keys(uploadedFiles).length} document(s) for protocol ${protocolCode} to ${assignedReviewerNames.join(' and ')}.`,
      type: 'admin_assignment',
      protocolCode: protocolCode,
      proposalId: result.insertedId,
      assignedReviewers: assignedReviewerNames,
      read: false,
      createdAt: new Date()
    });
    console.log(`Admin notification created with reviewers: ${assignedReviewerNames.join(', ')}`);
    
    res.json({
      success: true,
      message: 'Files successfully assigned to reviewers',
      proposalId: result.insertedId.toString(),
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
    
    const proposalCount = await proposals.countDocuments();
    const pendingReviewCount = await reviews.countDocuments({ status: 'pending' });
    const approvedCount = await proposals.countDocuments({ status: 'approved' });
    const activeReviewersCount = await users.countDocuments({ role: 'reviewer' });
    
    res.json({
      totalProposals: proposalCount,
      pendingReviews: pendingReviewCount,
      approved: approvedCount,
      activeReviewers: activeReviewersCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message to student endpoint
app.post('/api/send-message-to-student', upload.any(), (req, res) => {
  const { studentEmail, recipientName: clientRecipientName, message } = req.body;
  const files = req.files || [];

  // Validate required fields
  if (!studentEmail || !message) {
    return res.status(400).json({
      success: false,
      error: 'Student email and message are required'
    });
  }

  const recipientName = clientRecipientName || studentEmail;

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
    files: files.map(file => ({
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    })),
    sentAt: new Date(),
    type: 'admin_to_student',
    status: 'sent'
  }).catch(err => console.error('Failed to save message to DB:', err.message));

    // Send email in background (fire-and-forget)
    if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
      let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #7A9E7E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">UREB System Message</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #333; margin-bottom: 20px;">Message from UREB Administrator</h2>
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
        from: `UREB System <${process.env.GMAIL_EMAIL}>`,
        to: studentEmail,
        subject: `Message from UREB Administrator${files.length > 0 ? ` (${files.length} files attached)` : ''}`,
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

// Start server
const HOST = '0.0.0.0'; // Bind to all interfaces
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
});
