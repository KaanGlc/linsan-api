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
    const { token } = req.body;
    const db = await getDb();
    
    const session = await db.collection('sessions').findOne({ 
      token,
      expiresAt: { $gt: new Date() }
    });

    if (session) {
      return res.status(200).json({ valid: true, username: session.username });
    }

    return res.status(401).json({ valid: false });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
