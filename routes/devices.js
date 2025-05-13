const express = require('express');
const router = express.Router();

const { getDevices, getDeviceDetails, updatedevice, sendDownlink } = require('../chirpstack');

// Get all devices
router.get('/getdevices', async (req, res) => {
    try {
        const devices = await getDevices();
        res.json({ success: true, devices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get devices by type
router.get('/getdevices/type/:type', async (req, res) => {
    const { type } = req.params;

    try {
        const devices = await getDevices();
        const filteredDevices = devices.filter(device => 
            device.deviceProfileName && device.deviceProfileName.toLowerCase() === type.toLowerCase()
        );

        res.json({ success: true, devices: filteredDevices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get details of a single device
router.get('/getdevice/:devEui', async (req, res) => {
    const { devEui } = req.params;

    try {
        const deviceDetails = await getDeviceDetails(devEui);
        if (!deviceDetails) {
            return res.status(404).json({ success: false, message: "Device not found" });
        }
        res.json({ success: true, device: deviceDetails });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update a device
router.put('/updatedevice', async (req, res) => {
    const deviceData = req.body;

    if (!deviceData.devEui) {
        return res.status(400).json({ success: false, message: "Missing devEui in request body" });
    }

    try {
        const result = await updatedevice(deviceData);
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/downlink', async (req, res) => {
    const { dev_eui, confirmed, f_port, data } = req.body;

    if (!dev_eui || !data || !Array.isArray(data)) {
        return res.status(400).json({
            success: false,
            message: "Requête invalide : dev_eui et data (array) sont requis",
        });
    }

    try {
        const id = await sendDownlink(dev_eui, data, f_port, confirmed);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


module.exports = router;
