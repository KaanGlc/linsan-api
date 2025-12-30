import { MongoClient } from 'mongodb';

let client = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db('linsanapp');
}

async function verifyToken(token) {
  if (!token) return null;
  const db = await getDb();
  const session = await db.collection('sessions').findOne({ 
    token,
    expiresAt: { $gt: new Date() }
  });
  return session;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = await verifyToken(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { totalQuizzes, totalCorrect, totalWrong } = req.body;
    const db = await getDb();

    await db.collection('users').updateOne(
      { username: session.username },
      { 
        $set: { 
          'stats.totalQuizzes': totalQuizzes || 0,
          'stats.totalCorrect': totalCorrect || 0,
          'stats.totalWrong': totalWrong || 0,
          'stats.lastUpdated': new Date()
        }
      }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
