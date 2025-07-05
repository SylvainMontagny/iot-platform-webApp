# IoT Platform Web Device Controller

A web-based device controller for managing LoRaWAN devices using ChirpStack gRPC API , built with Electron and Node.js.

---

## Features

- Device management interface (list, filter, import, delete)
- ChirpStack integration (gRPC)
- Send real-time downlinks to devices
- Can be connected to any ChirpStack server
- Cross-platform desktop packaging (Windows)

---

## Prerequisites
#### If cloning the repository :
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/) (for cloning the repository)
- [Docker](https://www.docker.com/) (optional, for ChirpStack server)

#### If using the `.exe` file :
   - Using Windows OS (v10+ recomanded)

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/iot-platform-webApp.git
   cd iot-platform-webApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start the app in development mode**

   ```bash
   npm start
   ```

   The Electron app will open and the Express server will run on [http://localhost:4050](http://localhost:4050).

---

## Usage

- Use the **Settings** section to configure your ChirpStack server URL, Port and all the gRPC credentials needed.
- The **Devices** section lists all devices of selected type (based on the device profile name) for the selected application.
- Use the **Actions** section to send downlinks to the selected devices.

---

## Packaging the Application

If you want to distribute the app or repackage it after making changes, follow these steps:

1. **(Optional) Clean previous builds**

   On Windows PowerShell:

   ```powershell
   Remove-Item -Recurse -Force node_modules ; Remove-Item -Recurse -Force dist ; Remove-Item -Force package-lock.json
   npm install
   ```

2. **Build the application**

   ```bash
   npm run dist
   ```

   The settings.json file will also be packaged so if you don't want to spread your credentials erase it before packaging.

   This will generate an installer (e.g., `web-device-controller-Setup-1.0.0.exe`) in the `dist` folder.

3. **Distribute**

   - Share the generated installer with your users.
   - Or upload it to your GitHub Releases page.

**Note:**  
You can customize packaging options (icons, shortcuts, etc.) in the `package.json` under the `"build"` section.

For more details, see the [electron-builder documentation](https://www.electron.build/).

## Development Notes

- Main Electron entry: [`main.js`](main.js)
- Express server and API: [`app.js`](app.js), [`routes/`](routes/)
- Frontend: [`public/`](public/)
- Device logic: [`chirpstack.js`](chirpstack.js)

---

## License

ISC

---