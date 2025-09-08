import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    const connectionString = process.env.MONGODB_URI;
    console.log('📋 Connection string exists:', !!connectionString);
    
    if (!connectionString) {
      return res.status(500).json({ error: 'MONGODB_URI missing' });
    }

    // Connection string'i debug için logla (şifreyi gizleyerek)
    const maskedConnection = connectionString.replace(/:[^:]*@/, ':****@');
    console.log('🔗 Connection string:', maskedConnection);

    const client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000
    });

    console.log('⏳ Attempting to connect...');
    await client.connect();
    console.log('✅ MongoDB connected successfully!');

    const db = client.db('linsanapp');
    console.log('📊 Database selected:', db.databaseName);

    // Collections'ları listele
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));

    await client.close();

    res.status(200).json({
      status: 'success',
      message: 'MongoDB connection successful',
      database: 'linsanapp',
      collections: collections.map(c => c.name),
      connection: maskedConnection
    });

  } catch (error) {
    console.error('❌ MongoDB Connection FAILED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);

    res.status(500).json({
      status: 'error',
      error: error.message,
      code: error.code,
      name: error.name
    });
  }
}
