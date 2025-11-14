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
  const salt = process.env.SALT || 'comolokko_kaan';
  console.log('Using SALT:', salt);
  return crypto.createHash('sha256').update(password + salt).digest('hex');
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
    const { masterKey, username, password } = req.body;
    
    // Master key kontrolü
    if (masterKey !== process.env.MASTER_KEY) {
      return res.status(403).json({ error: 'Invalid master key' });
    }

    const db = await getDb();
    
    console.log('CREATE - SALT:', process.env.SALT);
    console.log('CREATE - Password:', password);
    console.log('CREATE - Hashed:', hashPassword(password));
    
    // Kullanıcı zaten var mı?
    const existing = await db.collection('admins').findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    await db.collection('admins').insertOne({
      username,
      password: hashPassword(password),
      createdAt: new Date()
    });

    return res.status(200).json({ success: true, message: 'Admin created' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
