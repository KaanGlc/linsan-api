// api/test-simple.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('✅ Simple test endpoint called');
    
    return res.status(200).json({
      status: 'success',
      message: 'Simple endpoint is working!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in simple test:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
}
