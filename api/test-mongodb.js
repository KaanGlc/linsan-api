export default async function handler(req, res) {
  // ⭐⭐⭐ CORS HEADERS - BU SATIRLARI EKLEYİN ⭐⭐⭐
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // ⭐⭐⭐ CORS HEADERS BİTTİ ⭐⭐⭐
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const connectionString = process.env.MONGODB_URI;
    
    if (!connectionString) {
      return res.status(500).json({
        status: 'error',
        message: 'MONGODB_URI environment variable missing'
      });
    }

    const client = new MongoClient(connectionString);
    await client.connect();
    
    const db = client.db('linsanapp');
    const collections = await db.listCollections().toArray();
    
    await client.close();
    
    res.status(200).json({
      status: 'success',
      mongodb_connected: true,
      database: 'linsanapp',
      collections: collections.map(c => c.name),
      message: 'MongoDB connection successful!'
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      mongodb_connected: false,
      error: error.message
    });
  }
}
