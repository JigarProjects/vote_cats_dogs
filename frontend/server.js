const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the current directory
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Frontend running on port ${PORT}`);
});
