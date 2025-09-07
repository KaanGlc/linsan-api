module.exports = async (req, res) => {
    if (req.method === 'GET') {
        res.status(200).json({ 
            status: 'online', 
            timestamp: new Date().toISOString(),
            service: 'Linsan API',
            version: '1.0'
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
