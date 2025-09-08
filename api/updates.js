// api/updates.js
import { MongoClient } from 'mongodb';
import semver from 'semver';

export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return res.status(500).json({ error: 'Database configuration error' });
    }

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('linsanapp');
    const collection = db.collection('updates');

    // En son sürümü al
    const updates = await collection
      .find({})
      .sort({ version: -1 })
      .limit(1)
      .toArray();
    await client.close();

    // Client'tan gelen sürüm
    let currentVersion = (req.query.current_version || '').trim();
    // DB'deki son sürüm (string)
    let latestVersion = updates[0]?.version?.trim() || '';

    // Kayıt yoksa client sürümüne eşitle
    if (!updates.length) {
      return res.status(200).json({
        has_update: false,
        latest_version: currentVersion,
        download_url: '',
        changelog: ''
      });
    }

    // Semver temizleme (örn. "v0.82" → "0.82")
    const cleanCurrent = semver.clean(currentVersion) || currentVersion;
    const cleanLatest  = semver.clean(latestVersion)  || latestVersion;

    // Sürüm geçerliliği kontrolü
    let hasUpdate;
    if (semver.valid(cleanCurrent) && semver.valid(cleanLatest)) {
      // Gerçek semver karşılaştırması
      hasUpdate = semver.gt(cleanLatest, cleanCurrent);
    } else {
      // Fallback: string eşitsizliği
      hasUpdate = cleanCurrent !== cleanLatest;
    }

    return res.status(200).json({
      has_update: hasUpdate,
      latest_version: cleanLatest,
      download_url: updates[0].download_url || '',
      changelog: updates[0].changelog || ''
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
