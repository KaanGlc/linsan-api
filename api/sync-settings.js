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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = await verifyToken(token);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = await getDb();

  // GET - Ayarları getir
  if (req.method === 'GET') {
    try {
      const user = await db.collection('users').findOne(
        { username: session.username },
        { projection: { settings: 1 } }
      );

      return res.status(200).json({ 
        success: true,
        settings: user?.settings || { theme: 'light' }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Ayarları kaydet
  if (req.method === 'POST') {
    try {
      const { theme } = req.body;

      await db.collection('users').updateOne(
        { username: session.username },
        { 
          $set: { 
            'settings.theme': theme,
            'settings.lastUpdated': new Date()
          }
        }
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
