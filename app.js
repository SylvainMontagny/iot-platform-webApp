require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4050;

// Public static link
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

/* ROUTES */

// Route index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* INIT */
const server = http.createServer(app);

// Start server on port 4050
server.listen(port, () => {
    console.log(`HTTP server running at http://localhost:${port}`);
});