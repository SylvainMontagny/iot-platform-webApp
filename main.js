const { app, Menu, shell, BrowserWindow} = require("electron");
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

const template = [
  // ... other menus ...
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'documentation',
        click: async () => {
          await shell.openExternal('https://github.com/SylvainMontagny/iot-platform-webApp/wiki');
        }
      },
      {
        label: 'About',
        click: async () => {
          await shell.openExternal('https://github.com/SylvainMontagny/iot-platform-webApp/blob/main/README.md');
        }
      },
      {
        label: 'Csv Import Template',
        click: async () => {
          await shell.openExternal('https://github.com/SylvainMontagny/iot-platform-webApp/blob/dev/template.csv');
        }
      }
      // Add more items here
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);


function createWindow() {
  console.log("Creation of the Electron window...");
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
    console.log(`✅ HTTP server started on http://localhost:${port}`);
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
