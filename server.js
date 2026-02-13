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
const uri = process.env.MONGODB_URI;
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

// Initialize database connection
connectToDatabase().catch(console.error);

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

// Collections
export const collections = {
  users: 'users',
  students: 'students',
  reviewers: 'reviewers',
  proposals: 'proposals',
  reviews: 'reviews',
  messages: 'messages'
};

// API Routes

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDatabase();
    const users = db.collection(collections.users);
    const students = db.collection(collections.students);
    const reviewers = db.collection(collections.reviewers);

    // Check in users collection first
    let user = await users.findOne({ email });
    let userType = 'user';

    // If not found in users, check students collection
    if (!user) {
      user = await students.findOne({ email });
      userType = 'student';
    }

    // If not found in users or students, check reviewers collection
    if (!user) {
      user = await reviewers.findOne({ email });
      userType = 'reviewer';
    }

    if (user && user.password === password) {
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

      res.json({
        success: true,
        user: {
          email: user.email,
          name: user.name || `${user.firstName} ${user.lastName}`,
          role: user.role || 'student',
          userType: userType,
          lastLogin: new Date()
        }
      });
    } else {
      res.json({ success: false, error: 'Invalid email or password' });
    }
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
    const { name, email, password, role, department, specialization } = req.body;
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
      specialization: specialization || '',
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
        department: newUser.department,
        specialization: newUser.specialization
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
    const { firstName, middleName, lastName, email, password, role, department, specialization } = req.body;
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
    
    // Create full name for backward compatibility
    const fullName = `${firstName} ${middleName || ''} ${lastName}`.replace(/\s+/g, ' ').trim();
    
    // Create new user with separate name fields
    const newUser = {
      firstName,
      middleName: middleName || '',
      lastName,
      name: fullName, // Keep full name for backward compatibility
      email,
      password,
      role: role || 'reviewer',
      department: department || 'Not specified',
      specialization: specialization || '',
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
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        specialization: newUser.specialization
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
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
        { 'reviewers.reviewer3': reviewerEmail }
      ]
    }).toArray();
    res.json(proposalList);
  } catch (error) {
    console.error('Error fetching reviewer proposals:', error);
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

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { gmail } = req.body;
    
    // Validate Gmail address
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
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

// Start server
const HOST = '0.0.0.0'; // Bind to all interfaces
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 API endpoints available at http://${HOST}:${PORT}/api`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
});
