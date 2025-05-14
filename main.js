const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const cors = require("cors");
const http = require("http");

// Importation directe des routes plutôt que de lancer app.js séparément
const deviceRoutes = require("./routes/devices");
const settingsRoutes = require("./routes/settings");

let mainWindow;
let expressApp;
let server;

function createWindow() {
  console.log("Création de la fenêtre Electron...");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadURL("http://localhost:4050");
}

function startExpressServer() {
  expressApp = express();
  const port = process.env.PORT || 4050;

  expressApp.use(express.static(path.join(__dirname, "public")));
  expressApp.use(express.json());
  expressApp.use(cors());
  expressApp.set("trust proxy", true);

  // Route index
  expressApp.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // API routes
  expressApp.use("/api", deviceRoutes);
  expressApp.use("/api/settings", settingsRoutes);

  server = http.createServer(expressApp);
  server.listen(port, () => {
    console.log(`✅ Serveur HTTP lancé sur http://localhost:${port}`);
    createWindow();
  });
}

app.on("ready", startExpressServer);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
  if (server) server.close();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
