const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

function getSettingsPath() {
  // Si packagé, settings.json est dans resources/
  if (
    process.mainModule &&
    process.mainModule.filename.indexOf("app.asar") !== -1
  ) {
    return path.join(process.resourcesPath, "settings.json");
  }
  // Sinon, à la racine du projet
  return path.join(__dirname, "..", "settings.json");
}

// GET settings
router.get("/", (req, res) => {
  fs.readFile(getSettingsPath(), "utf8", (err, data) => {
    if (err) return res.json({});
    try {
      res.json(JSON.parse(data));
    } catch {
      res.json({});
    }
  });
});

// POST settings
router.post("/", (req, res) => {
  const { API_TOKEN, URL_SERVER, APP_ID } = req.body;
  if (!API_TOKEN || !URL_SERVER || !APP_ID) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  fs.writeFile(
    getSettingsPath(),
    JSON.stringify({ API_TOKEN, URL_SERVER, APP_ID }, null, 2),
    (err) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Failed to save settings" });
      res.json({ success: true });
    }
  );
});

module.exports = router;
