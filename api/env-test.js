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
  
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const envVars = {
      mongodb_uri: process.env.MONGODB_URI ? 'configured' : 'missing',
      node_env: process.env.NODE_ENV || 'not set'
    };
    
    console.log('Environment variables:', envVars);
    
    return res.status(200).json({
      status: 'success',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Env test error:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
}
