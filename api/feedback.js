import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🔍 Feedback endpoint called - SIMPLIFIED');

  if (req.method === 'POST') {
    try {
      console.log('1. Checking environment...');
      const connectionString = process.env.MONGODB_URI;
      
      if (!connectionString) {
        console.error('❌ MONGODB_URI is MISSING');
        return res.status(500).json({ error: 'MONGODB_URI missing' });
      }
      
      console.log('✅ MONGODB_URI found');

      console.log('2. Creating client with SHORT timeout...');
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000, // 5 saniye
        connectTimeoutMS: 5000,         // 5 saniye
        socketTimeoutMS: 5000           // 5 saniye
      });

      console.log('3. Attempting connection (5s timeout)...');
      await client.connect();
      console.log('✅ MongoDB connected!');

      // Hemen kapat ve response dön
      await client.close();
      
      res.status(200).json({ 
        status: 'success', 
        message: 'MongoDB connection test successful'
      });

    } catch (error) {
      console.error('❌ MongoDB Connection FAILED:');
      console.error('Error:', error.message);
      console.error('Code:', error.code);
      
      res.status(500).json({ 
        error: 'MongoDB connection failed',
        message: error.message,
        code: error.code
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
