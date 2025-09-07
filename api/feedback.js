const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            const client = new MongoClient(process.env.MONGODB_URI);
            await client.connect();
            
            const db = client.db('linsanapp');
            const collection = db.collection('feedbacks');
            
            const feedback = {
                ...req.body,
                receivedAt: new Date(),
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            };
            
            await collection.insertOne(feedback);
            await client.close();
            
            res.status(200).json({ status: 'success' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
