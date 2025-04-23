const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./db');

app.use(cors());
app.use(express.json());

function isValidAnimal(animal) {
    return animal === 'cats' || animal === 'dogs';
}

app.get('/results', async (req, res) => {
    try {
        const results = await db.getVotes();
        res.json(results);
    } catch (error) {
        console.log('Vote processing error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/vote/:animal', async (req, res) => {
    const { animal } = req.params;

    if (!isValidAnimal(animal)) {
        return res.status(400).json({ 
            error: 'Please select either cats or dogs' 
        });
    }

    try {
        await db.updateVote(animal);
        res.json({ success: true });
    } catch (error) {
        console.log('Vote processing error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});