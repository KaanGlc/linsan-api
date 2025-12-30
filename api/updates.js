import { MongoClient } from 'mongodb';
import semver from 'semver';

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
  const session = await db.collection('sessions').findOne({ token });
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return session;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = await getDb();

  // GET - Güncelleme kontrolü
  if (req.method === 'GET') {
    try {
      const updates = await db.collection('updates')
        .find({})
        .sort({ version: -1 })
        .limit(1)
        .toArray();

      if (updates.length === 0) {
        return res.status(200).json({
          has_update: false,
          latest_version: req.query.current_version || '0.0.0'
        });
      }

      const currentVersion = req.query.current_version || '0.0.0';
      const latestVersion = updates[0].version;
      const hasUpdate = semver.gt(semver.coerce(latestVersion), semver.coerce(currentVersion));

      return res.status(200).json({
        has_update: hasUpdate,
        latest_version: latestVersion,
        download_url: updates[0].download_url || '',
        changelog: updates[0].changelog || ''
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Yeni güncelleme ekle (admin)
  if (req.method === 'POST') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = await verifyToken(token);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const { version, download_url, changelog } = req.body;
      
      if (!version || !download_url || !changelog) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await db.collection('updates').insertOne({
        version,
        download_url,
        changelog,
        createdAt: new Date().toISOString()
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
