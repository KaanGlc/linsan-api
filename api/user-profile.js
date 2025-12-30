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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token gerekli' });
    }

    const db = await getDb();
    
    // Session kontrolü
    const session = await db.collection('sessions').findOne({ 
      token,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
    }

    // Kullanıcı bilgilerini getir
    const user = await db.collection('users').findOne(
      { username: session.username },
      { projection: { password: 0 } } // Şifreyi döndürme
    );

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    return res.status(200).json({ 
      success: true,
      user: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        stats: user.stats || {
          totalQuizzes: 0,
          totalCorrect: 0,
          totalWrong: 0
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
