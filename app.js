require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');

const { listDevices } = require('./chirpstack'); // Import fonction gRPC

const app = express();
const port = process.env.PORT || 4050;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.set('trust proxy', true);

// Route index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/getdevices', async (req, res) => {
    try {
        const devices = await listDevices();
        res.json({ success: true, devices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


const server = http.createServer(app);
server.listen(port, () => {
    console.log(`✅ Serveur HTTP lancé sur http://localhost:${port}`);
});
