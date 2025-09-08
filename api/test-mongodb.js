import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('🔍 Testing MongoDB connection with new user...');
    
    const connectionString = process.env.MONGODB_URI;
    console.log('📋 Connection string preview:', connectionString ? connectionString.replace(/:[^:]*@/, ':****@') : 'MISSING');
    
    if (!connectionString) {
      return res.status(500).json({ error: 'MONGODB_URI missing' });
    }

    const client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });

    console.log('🔗 Attempting to connect...');
    await client.connect();
    console.log('✅ MongoDB connected successfully');

    const db = client.db('linsanapp');
    console.log('📊 Database selected:', db.databaseName);

    // Yetkileri test et
    console.log('🔐 Testing privileges...');
    
    // feedbacks collection yazma testi
    try {
      const feedbacksCollection = db.collection('feedbacks');
      const testDoc = { test: 'privilege test', timestamp: new Date() };
      const result = await feedbacksCollection.insertOne(testDoc);
      console.log('✅ feedbacks insert privilege: OK');
      
      // Test dokümanını temizle
      await feedbacksCollection.deleteOne({ _id: result.insertedId });
    } catch (insertError) {
      console.error('❌ feedbacks insert privilege failed:', insertError.message);
    }

    // updates collection okuma testi  
    try {
      const updatesCollection = db.collection('updates');
      await updatesCollection.find({}).limit(1).toArray();
      console.log('✅ updates find privilege: OK');
    } catch (findError) {
      console.error('❌ updates find privilege failed:', findError.message);
    }

    await client.close();

    res.status(200).json({
      status: 'success',
      message: 'MongoDB connection and privilege test successful'
    });

  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    res.status(500).json({
      status: 'error',
      error: error.message,
      code: error.code,
      name: error.name
    });
  }
}
