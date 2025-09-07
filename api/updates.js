const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        try {
            const client = new MongoClient(process.env.MONGODB_URI);
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
};
