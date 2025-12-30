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
  const { type } = req.query; // stats, words, settings

  // GET - Veri getir
  if (req.method === 'GET') {
    try {
      if (type === 'words') {
        const user = await db.collection('users').findOne(
          { username: session.username },
          { projection: { unknownWords: 1 } }
        );
        return res.status(200).json({ 
          success: true,
          unknownWords: user?.unknownWords || []
        });
      }

      if (type === 'settings') {
        const user = await db.collection('users').findOne(
          { username: session.username },
          { projection: { settings: 1 } }
        );
        return res.status(200).json({ 
          success: true,
          settings: user?.settings || { theme: 'light' }
        });
      }

      return res.status(400).json({ error: 'Invalid type' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Veri kaydet
  if (req.method === 'POST') {
    try {
      if (type === 'stats') {
        const { totalQuizzes, totalCorrect, totalWrong } = req.body;
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
      }

      if (type === 'words') {
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
      }

      if (type === 'settings') {
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
      }

      return res.status(400).json({ error: 'Invalid type' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Veri sil
  if (req.method === 'DELETE') {
    try {
      if (type === 'words') {
        const { word } = req.body;
        if (word === 'ALL') {
          await db.collection('users').updateOne(
            { username: session.username },
            { $set: { unknownWords: [] } }
          );
        } else {
          await db.collection('users').updateOne(
            { username: session.username },
            { $pull: { unknownWords: { word } } }
          );
        }
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid type' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
