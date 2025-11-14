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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
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
