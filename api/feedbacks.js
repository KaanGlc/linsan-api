import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('❌ MONGODB_URI environment variable not set');
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2
  });

  await client.connect();
  const db = client.db('linsanapp');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // CORS - Daha geniş izinler
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('feedbacks');

      // En yeni 100 geri bildirimi getir
      const feedbacks = await collection
        .find({})
        .sort({ receivedAt: -1 })
        .limit(100)
        .toArray();

      res.status(200).json({
        success: true,
        feedbacks: feedbacks,
        count: feedbacks.length
      });
    } catch (error) {
      console.error('❌ MongoDB Error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
