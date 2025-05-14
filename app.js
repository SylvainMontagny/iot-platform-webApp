require("dotenv").config();
const express = require("express");
const path = require("path");
const http = require("http");
const cors = require("cors");

const deviceRoutes = require("./routes/devices");
const settingsRoutes = require("./routes/settings");

const app = express();
const port = process.env.PORT || 4050;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

// Route index
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API routes
app.use("/api", deviceRoutes);
app.use("/api/settings", settingsRoutes);

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`✅ Serveur HTTP lancé sur http://localhost:${port}`);
});
