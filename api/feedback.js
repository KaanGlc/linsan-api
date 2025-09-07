// MongoDB connection'ı global yap (pooling için)
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,  // ⬅️ Connection pool
    minPoolSize: 2    // ⬅️ Minimum connections
  });

  await client.connect();
  const db = client.db('linsanapp');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { db, client } = await connectToDatabase();
      const collection = db.collection('feedbacks');
      
      const feedback = {
        ...req.body,
        receivedAt: new Date(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      };
      
      await collection.insertOne(feedback);
      // client.close() YAPMA - pooling için açık kalsın
      
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('MongoDB Error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
