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

    // İstemci sürümü
    const rawCurrent = (req.query.current_version || '').trim();
    // DB'deki son sürüm
    const rawLatest  = updates[0]?.version?.trim() || '';

    // Hiç kayıt yoksa direkt güncelleme yok
    if (updates.length === 0) {
      return res.status(200).json({
        has_update: false,
        latest_version: rawCurrent,
        download_url: '',
        changelog: ''
      });
    }

    // Semver'e uyarlanmış hale getir
    const curSem = semver.coerce(rawCurrent);
    const latSem = semver.coerce(rawLatest);

    // Gerçek semver karşılaştırması - BURAYI DEĞİŞTİRDİK
    let hasUpdate = false;
    if (curSem && latSem) {
      // SADECE en son sürüm daha büyükse güncelleme göster
      const shouldUpdate = semver.gt(latSem, curSem);
      hasUpdate = shouldUpdate;
    } else {
      // Fallback - sürümler farklıysa güncelleme var say
      hasUpdate = rawLatest !== rawCurrent;
    }

    return res.status(200).json({
      has_update: hasUpdate,
      latest_version: rawLatest,
      download_url: updates[0].download_url || '',
      changelog: updates[0].changelog || ''
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
