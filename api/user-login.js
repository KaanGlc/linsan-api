import { MongoClient } from 'mongodb';
import crypto from 'crypto';

let client = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db('linsanapp');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.SALT).digest('hex');
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
    const { username, password } = req.body;
    const db = await getDb();
    
    // Kullanıcı kontrolü
    const user = await db.collection('users').findOne({ 
      username,
      password: hashPassword(password)
    });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await db.collection('sessions').insertOne({
        token,
        username,
        userType: 'user',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat
      });
      
      return res.status(200).json({ 
        success: true, 
        token, 
        username: user.username,
        email: user.email,
        userType: 'user'
      });
    }

    return res.status(401).json({ success: false, error: 'Kullanıcı adı veya şifre hatalı' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
