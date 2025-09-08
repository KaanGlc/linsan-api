// api/feedback.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const connectionString = process.env.MONGODB_URI;
      if (!connectionString) {
        return res.status(500).json({ error: 'MONGODB_URI missing' });
      }

      // Gelen veriyi al
      const feedbackData = req.body;
      if (!feedbackData || typeof feedbackData !== 'object') {
        return res.status(400).json({ error: 'Invalid feedback payload' });
      }

      // Zaman damgası ekle
      feedbackData.created_at = new Date();

      // MongoDB bağlantısı
      const client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000
      });

      await client.connect();
      const db = client.db('linsanapp');
      const collection = db.collection('feedbacks');

      // Kaydet
      const result = await collection.insertOne(feedbackData);

      await client.close();

      return res.status(200).json({
        status: 'success',
        inserted_id: result.insertedId,
        message: 'Feedback saved successfully'
      });

    } catch (error) {
      console.error('❌ Feedback insert failed:', error);
      return res.status(500).json({
        error: 'MongoDB insert failed',
        message: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
