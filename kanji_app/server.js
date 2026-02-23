const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory (where index.html is)
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for Hotpepper API
app.get('/api/search', async (req, res) => {
    try {
        const API_KEY = 'f15b7ad9efab6381'; // Provided API Key
        const queryParams = new URLSearchParams(req.query);
        queryParams.append('key', API_KEY);
        queryParams.append('format', 'json');

        const hotpepperUrl = `https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?${queryParams.toString()}`;

        const response = await fetch(hotpepperUrl);

        if (!response.ok) {
            throw new Error(`Hotpepper API responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from Hotpepper API:', error);
        res.status(500).json({ error: 'Failed to fetch data from Hotpepper API' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
