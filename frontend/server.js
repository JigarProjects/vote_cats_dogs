const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || 'http://localhost:3001';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', async (req, res) => {
    try {
        const response = await fetch(`${MIDDLEWARE_URL}/results`);
        const data = await response.json();

        const template = fs.readFileSync(path.join(__dirname, 'public', 'results.html'), 'utf8');
        const html = template
            .replace('{{cats}}', data.cats)
            .replace('{{dogs}}', data.dogs);

        res.send(html);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading results');
    }
});

app.post('/vote/:animal', async (req, res) => {
    try {
        const { animal } = req.params;
        const response = await fetch(`${MIDDLEWARE_URL}/vote/${animal}`, {
            method: 'POST'
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error submitting vote' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Frontend running on port ${PORT}`);
    console.log(`Middleware URL: ${MIDDLEWARE_URL}`);
});
