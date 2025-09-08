// api/updates.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connectionString = process.env.MONGODB_URI;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const client = new MongoClient(connectionString);
    await client.connect();
    
    const db = client.db('linsanapp');
    const collection = db.collection('updates');
    
    // En son eklenen güncellemeyi bul
    const updates = await collection
      .find({})
      .sort({ version: -1 })
      .limit(1)
      .toArray();
    
    await client.close();

    // İstemciden gelen sürüm
    const currentVersion = req.query.current_version || '';

    // Eğer DB'de hiç kayıt yoksa:
    if (updates.length === 0) {
      return res.status(200).json({
        has_update: false,
        latest_version: currentVersion,
        download_url: '',
        changelog: ''
      });
    }

    // DB'de kayıt varsa normal akış
    const latest = updates[0];
    const latestVersion = (latest.version || '').trim();

    const hasUpdate = currentVersion !== latestVersion;

    res.status(200).json({
      has_update: hasUpdate,
      latest_version: latestVersion,
      download_url: latest.download_url || '',
      changelog: latest.changelog || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
