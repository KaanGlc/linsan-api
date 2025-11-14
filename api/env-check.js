export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const mongodbUri = process.env.MONGODB_URI;
    
    return res.status(200).json({
      status: 'success',
      mongodb_uri_configured: !!mongodbUri,
      mongodb_uri_preview: mongodbUri ? 
        mongodbUri.replace(/:[^:]*@/, ':****@') : 
        'not configured',
      node_env: process.env.NODE_ENV || 'not set',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
}
