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
      res.status(200).json({
        status: 'online',
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        version: '1.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}
