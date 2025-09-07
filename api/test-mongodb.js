// api/test-mongodb.js
const { MongoClient } = require('mongodb');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔗 Testing MongoDB connection from Vercel...');
    
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      console.error('❌ MONGODB_URI is missing');
      return res.status(500).json({ error: 'MONGODB_URI environment variable missing' });
    }

    console.log('📋 Connection string:', connectionString.replace(/:[^:]*@/, ':****@'));
    
    const client = new MongoClient(connectionString);
    await client.connect();
    console.log('✅ MongoDB connected successfully');
    
    const db = client.db('linsanapp');
    const collections = await db.listCollections().toArray();
    
    await client.close();
    
    console.log('📁 Collections:', collections.map(c => c.name));
    
    res.status(200).json({
      status: 'success',
      mongodb_connected: true,
      database: 'linsanapp',
      collections: collections.map(c => c.name),
      message: 'MongoDB connection successful from Vercel!'
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    res.status(500).json({
      status: 'error',
      mongodb_connected: false,
      error: error.message,
      connection_info: process.env.MONGODB_URI ? 'configured' : 'missing'
    });
  }
}
