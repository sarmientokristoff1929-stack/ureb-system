import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
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
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ureb_system';
let client;
let db;

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

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept all file types for now
    cb(null, true);
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Download endpoint — forces browser to download instead of opening in tab
app.get('/api/download/:filename', (req, res) => {
  const { filename } = req.params;
  const originalName = req.query.name || filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath, originalName);
});

// Collections
export const collections = {
  users: 'users',
  students: 'students',
  reviewers: 'reviewers',
  proposals: 'proposals',
  reviews: 'reviews',
  messages: 'messages',
  notifications: 'notifications'
};

// API Routes

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
  try {
    const { firstName, middleName, lastName, studentId, department, program, email, password, role } = req.body;

    console.log('Registration request received:', { firstName, lastName, studentId, department, program, email });

    const db = getDatabase();
    const students = db.collection(collections.students);
    const users = db.collection(collections.users);

    // Check if student already exists in students collection
    const existingStudent = await students.findOne({
      $or: [
        { email: email },
        { studentId: studentId }
      ]
    });

    if (existingStudent) {
      console.log('Student already exists:', existingStudent.email || existingStudent.studentId);
      return res.json({
        success: false,
        error: existingStudent.email === email
          ? 'A student with this email already exists'
          : 'A student with this ID already exists'
      });
    }

    // Also check if email exists in users collection
    const existingUser = await users.findOne({ email: email });
    if (existingUser) {
      console.log('Email already registered as user:', email);
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
      department,
      program: program || '',
      email,
      password,
      role: role || 'student',
      createdAt: new Date(),
      lastLogin: null,
      status: 'active'
    };

    console.log('Creating new student:', { ...newStudent, password: '[HIDDEN]' });
    const result = await students.insertOne(newStudent);
    console.log('Student created successfully with ID:', result.insertedId);

    res.json({
      success: true,
      message: 'Registration successful',
      student: {
        _id: result.insertedId,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        email: newStudent.email,
        studentId: newStudent.studentId,
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

// Students operations
app.get('/api/students', async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.collection(collections.students);
    const studentList = await students.find({}).toArray();
    res.json(studentList);
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

// Update reviewer endpoint
app.put('/api/reviewers/:id', async (req, res) => {
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

// Update student endpoint
app.put('/api/students/:id', async (req, res) => {
  try {
    const db = getDatabase();
    const students = db.collection(collections.students);
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove _id from updateData if it exists
    if (updateData._id) {
      delete updateData._id;
    }
    
    const result = await students.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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
    
    // Process uploaded files
    const files = {};
    if (req.files) {
      Object.keys(req.files).forEach(fieldname => {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          files[fieldname] = {
            filename: fileArray[0].filename,
            originalname: fileArray[0].originalname,
            path: fileArray[0].path,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
        }
      });
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

    const { department, preliminaryReviewer, studentEmail, studentName, proposalTitle } = req.body;

    // Process uploaded files
    const files = {};
    if (req.files) {
      Object.keys(req.files).forEach(fieldname => {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          files[fieldname] = {
            filename: fileArray[0].filename,
            originalname: fileArray[0].originalname,
            path: fileArray[0].path,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
        }
      });
    }

    const newProposal = {
      researchTitle: proposalTitle || 'Untitled Proposal',
      proponent: studentName || 'Unknown',
      studentEmail: studentEmail || '',
      department: department || '',
      preliminaryReviewer: preliminaryReviewer || '',
      files,
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await proposals.insertOne(newProposal);

    res.json({
      success: true,
      proposal: { _id: result.insertedId, ...newProposal }
    });
  } catch (error) {
    console.error('Error submitting student files:', error);
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

    // Process uploaded files
    const files = {};
    if (req.files) {
      Object.keys(req.files).forEach(fieldname => {
        const fileArray = req.files[fieldname];
        if (fileArray && fileArray.length > 0) {
          files[fieldname] = {
            filename: fileArray[0].filename,
            originalname: fileArray[0].originalname,
            size: fileArray[0].size,
            mimetype: fileArray[0].mimetype
          };
        }
      });
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
    
    // Create a transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
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
app.post('/api/send-otp', async (req, res) => {
  try {
    const { gmail } = req.body;
    
    // Validate Gmail address
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail.com$/;
    if (!gmailRegex.test(gmail)) {
      return res.json({ success: false, error: 'Invalid Gmail address' });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    
    // Store OTP
    otpStore.set(gmail, { otp, expiry });
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    // Send OTP email
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
    
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${gmail}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to your Gmail address',
      // Don't send OTP in response for security
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
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

// Get student profile endpoint
app.get('/api/student/profile', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const db = getDatabase();
    const students = db.collection(collections.students);
    
    const student = await students.findOne({ email });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({
      success: true,
      student: {
        firstName: student.firstName || '',
        middleName: student.middleName || '',
        lastName: student.lastName || '',
        studentId: student.studentId || '',
        department: student.department || '',
        program: student.program || '',
        gmail: student.email || '',
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update student profile endpoint
app.put('/api/student/profile', async (req, res) => {
  try {
    const { email, firstName, middleName, lastName, studentId, department, program, gmail } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }
    
    const db = getDatabase();
    const students = db.collection(collections.students);
    
    // Check if student exists
    const existingStudent = await students.findOne({ email });
    if (!existingStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Update student profile
    const updateData = {
      ...(firstName && { firstName }),
      ...(middleName && { middleName }),
      ...(lastName && { lastName }),
      ...(studentId && { studentId }),
      ...(department && { department }),
      ...(program && { program }),
      ...(gmail && { gmail }),
      updatedAt: new Date()
    };
    
    const result = await students.updateOne(
      { email },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, error: 'No changes made or student not found' });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      student: {
        firstName: firstName || existingStudent.firstName,
        middleName: middleName || existingStudent.middleName,
        lastName: lastName || existingStudent.lastName,
        studentId: studentId || existingStudent.studentId,
        department: department || existingStudent.department,
        program: program || existingStudent.program,
        gmail: gmail || existingStudent.email,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
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

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();
    const messages = db.collection(collections.messages);
    const messageList = await messages.find({ 
      $or: [
        { recipientEmail: userId },
        { senderEmail: userId }
      ]
    }).sort({ createdAt: -1 }).toArray();
    res.json(messageList);
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
app.post('/api/send-message-to-student', upload.any(), async (req, res) => {
  try {
    const { studentEmail, message } = req.body;
    const files = req.files || [];

    console.log('Sending message to student:', studentEmail);
    console.log('Message length:', message?.length || 0);
    console.log('Files attached:', files.length);

    // Validate required fields
    if (!studentEmail || !message) {
      return res.status(400).json({
        success: false,
        error: 'Student email and message are required'
      });
    }

    // Find the student in database
    const db = getDatabase();
    const students = db.collection(collections.students);

    const student = await students.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    const recipientName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
    console.log('Student found:', recipientName);

    // Store message in database first (always succeeds regardless of email)
    const messages = db.collection(collections.messages);
    const messageRecord = {
      senderEmail: process.env.GMAIL_EMAIL || 'admin',
      recipientEmail: studentEmail,
      recipientName,
      message,
      files: files.map(file => ({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      })),
      sentAt: new Date(),
      type: 'admin_to_student',
      status: 'sent'
    };

    await messages.insertOne(messageRecord);

    // Try to send email — failure here does NOT cause a 500
    let emailSent = false;
    if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });

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
          emailContent += `
              </ul>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666; font-style: italic;">
                Note: Files have been uploaded to the UREB System and are available for download.
              </p>
            </div>
          `;
        }

        emailContent += `
              <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                  This message was sent through the UREB System on ${new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `UREB System <${process.env.GMAIL_EMAIL}>`,
          to: studentEmail,
          subject: `Message from UREB Administrator${files.length > 0 ? ` (${files.length} files attached)` : ''}`,
          html: emailContent
        });

        emailSent = true;
        console.log('Email sent successfully to:', studentEmail);
      } catch (emailError) {
        console.error('Email sending failed (message still saved to DB):', emailError.message);
      }
    } else {
      console.log('Gmail credentials not configured — message saved to DB only');
    }

    console.log('Message record saved successfully for:', studentEmail);
    res.json({
      success: true,
      message: emailSent
        ? 'Message sent successfully to student'
        : 'Message saved successfully (email delivery skipped — Gmail not configured)',
      recipientName
    });

  } catch (error) {
    console.error('Error sending message to student:', error);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
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
