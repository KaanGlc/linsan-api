import { MongoClient } from 'mongodb';

// Global cache (Vercel lambda instance başına)
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { db } = await connectToDatabase();
      const collection = db.collection('feedbacks');

      const feedbackData = req.body;
      if (!feedbackData || typeof feedbackData !== 'object') {
        return res.status(400).json({ error: 'Invalid feedback payload' });
      }

      const feedback = {
        ...feedbackData,
        receivedAt: new Date(),
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null
      };

      const result = await collection.insertOne(feedback);

      res.status(200).json({ status: 'success', insertedId: result.insertedId });
    } catch (error) {
      console.error('❌ MongoDB Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
