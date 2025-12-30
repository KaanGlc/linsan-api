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
    const { username, email, password } = req.body;

    // Validasyon
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    const db = await getDb();
    
    // Kullanıcı adı kontrolü
    const existingUser = await db.collection('users').findOne({ 
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.username === username 
          ? 'Bu kullanıcı adı zaten kullanılıyor' 
          : 'Bu e-posta zaten kayıtlı'
      });
    }

    // Yeni kullanıcı oluştur
    await db.collection('users').insertOne({
      username,
      email,
      password: hashPassword(password),
      createdAt: new Date(),
      stats: {
        totalQuizzes: 0,
        totalCorrect: 0,
        totalWrong: 0
      }
    });

    // Otomatik giriş için token oluştur
    const token = crypto.randomBytes(32).toString('hex');
    await db.collection('sessions').insertOne({
      token,
      username,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat
    });

    return res.status(201).json({ 
      success: true, 
      token, 
      username 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
