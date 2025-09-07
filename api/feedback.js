import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const connectionString = process.env.MONGODB_URI;
      
      if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration error' });
      }

      // MongoDB connection timeout ayarla
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 10000, // 10 saniye
        connectTimeoutMS: 10000          // 10 saniye
      });
      
      await client.connect();
      
      const db = client.db('linsanapp');
      const collection = db.collection('feedbacks');
      
      const feedback = {
        ...req.body,
        receivedAt: new Date(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      };
      
      await collection.insertOne(feedback);
      await client.close();
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('MongoDB Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
