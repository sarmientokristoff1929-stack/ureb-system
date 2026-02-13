import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI;

const sampleData = {
  users: [
    {
      email: 'admin@ureb.edu',
      password: 'adminpassword123',
      role: 'admin',
      name: 'System Administrator',
      createdAt: new Date()
    },
    {
      email: 'reviewer1@ureb.edu',
      password: 'reviewer123',
      role: 'reviewer',
      name: 'Dr. Melay Antonio',
      createdAt: new Date()
    },
    {
      email: 'reviewer2@ureb.edu',
      password: 'reviewer123',
      role: 'reviewer',
      name: 'Mary Grace Obenza',
      createdAt: new Date()
    },
    {
      email: 'reviewer3@ureb.edu',
      password: 'reviewer123',
      role: 'reviewer',
      name: 'Mary Cris Decena',
      createdAt: new Date()
    },
    {
      email: 'kristofer@ureb.edu',
      password: 'reviewer123',
      role: 'reviewer',
      name: 'Kristofer John Sarmiento',
      createdAt: new Date()
    }
  ],
  
  proposals: [],
  
  reviews: [],
  
  messages: []
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('ureb_system');
    
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('proposals').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('messages').deleteMany({});
    
    // Insert sample data
    await db.collection('users').insertMany(sampleData.users);
    await db.collection('proposals').insertMany(sampleData.proposals);
    await db.collection('reviews').insertMany(sampleData.reviews);
    await db.collection('messages').insertMany(sampleData.messages);
    
    console.log('✅ Database seeded successfully!');
    console.log(`👥 Users created: ${sampleData.users.length}`);
    console.log(`📄 Proposals created: ${sampleData.proposals.length}`);
    console.log(`📝 Reviews created: ${sampleData.reviews.length}`);
    console.log(`💬 Messages created: ${sampleData.messages.length}`);
    
    await client.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run the seeding function
seedDatabase();
