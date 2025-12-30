import { MongoClient } from 'mongodb';

let client = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db('linsanapp');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await getDb();

  // POST - Yeni feedback ekle
  if (req.method === 'POST') {
    try {
      const feedback = {
        ...req.body,
        receivedAt: new Date(),
        ip: req.headers['x-forwarded-for'] || 'unknown'
      };

      const result = await db.collection('feedbacks').insertOne(feedback);
      return res.status(200).json({ status: 'success', id: result.insertedId });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET - Feedbackleri listele (admin)
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const session = await db.collection('sessions').findOne({ 
        token,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const feedbacks = await db.collection('feedbacks')
        .find({})
        .sort({ receivedAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        feedbacks: feedbacks,
        count: feedbacks.length
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
