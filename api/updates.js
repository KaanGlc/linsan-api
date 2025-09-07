// api/updates.js - ES6 Modules
export default async function handler(req, res) {
  // ⭐⭐⭐ CORS HEADERS - BU SATIRLARI EKLEYİN ⭐⭐⭐
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // ⭐⭐⭐ CORS HEADERS BİTTİ ⭐⭐⭐
import { MongoClient } from 'mongodb';
  if (req.method === 'GET') {
    try {
      const connectionString = process.env.MONGODB_URI;
      
      if (!connectionString) {
        return res.status(500).json({ error: 'Database configuration error' });
      }

      const client = new MongoClient(connectionString);
      await client.connect();
      
      const db = client.db('linsanapp');
      const collection = db.collection('updates');
      
      const latestUpdate = await collection
        .find({})
        .sort({ version: -1 })
        .limit(1)
        .toArray();
      
      await client.close();
      
      const currentVersion = req.query.current_version || '0.0';
      const latestVersion = latestUpdate[0]?.version || '0.82';
      
      res.status(200).json({
        has_update: currentVersion !== latestVersion,
        latest_version: latestVersion,
        download_url: latestUpdate[0]?.download_url || '',
        changelog: latestUpdate[0]?.changelog || ''
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
