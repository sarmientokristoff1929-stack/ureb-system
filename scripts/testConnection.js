import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('🔍 Testing MongoDB connection...');
console.log('📝 URI:', uri.replace(/:[^:]+@/, ':***@')); // Hide password in logs

async function testConnection() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database access
    const db = client.db('ureb_system');
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('🔌 Connection closed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.log('💡 Possible fixes:');
      console.log('   1. Check username/password in .env file');
      console.log('   2. Verify MongoDB Atlas user credentials');
      console.log('   3. Ensure IP is whitelisted in Atlas');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('💡 Possible fixes:');
      console.log('   1. Check cluster name in connection string');
      console.log('   2. Verify network connectivity');
    }
  }
}

testConnection();
