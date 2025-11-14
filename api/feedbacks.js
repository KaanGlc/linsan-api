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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
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
