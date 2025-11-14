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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
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
