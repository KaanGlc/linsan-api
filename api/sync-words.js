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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

  // GET - Bilinmeyen kelimeleri getir
  if (req.method === 'GET') {
    try {
      const user = await db.collection('users').findOne(
        { username: session.username },
        { projection: { unknownWords: 1 } }
      );

      return res.status(200).json({ 
        success: true,
        unknownWords: user?.unknownWords || []
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Bilinmeyen kelime ekle
  if (req.method === 'POST') {
    try {
      const { word, meanings, level } = req.body;

      await db.collection('users').updateOne(
        { username: session.username },
        { 
          $addToSet: { 
            unknownWords: {
              word,
              meanings,
              level,
              addedAt: new Date()
            }
          }
        }
      );

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Bilinmeyen kelime sil
  if (req.method === 'DELETE') {
    try {
      const { word } = req.body;

      if (word === 'ALL') {
        // Tümünü sil
        await db.collection('users').updateOne(
          { username: session.username },
          { $set: { unknownWords: [] } }
        );
      } else {
        // Tek kelime sil
        await db.collection('users').updateOne(
          { username: session.username },
          { $pull: { unknownWords: { word } } }
        );
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
