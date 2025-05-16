# IoT Platform Web Device Controller

A web-based device controller for managing LoRaWAN devices via ChirpStack, built with Electron and Node.js.

---

## Features

- Device management interface (list, filter, update)
- ChirpStack integration (gRPC)
- Real-time device actions and downlinks
- Settings management (API token, server, application)
- Cross-platform desktop packaging (Windows)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/) (for cloning the repository)
- [Docker](https://www.docker.com/) (optional, for ChirpStack server)

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

3. **Configure settings**

   - Copy the example environment file and edit it:

     ```bash
     cp .env.example .env
     ```

   - Fill in your ChirpStack `API_TOKEN`, `URL_SERVER`, and `APP_ID` in `.env`.

4. **Start the app in development mode**

   ```bash
   npm start
   ```

   The Electron app will open and the Express server will run on [http://localhost:4050](http://localhost:4050).

---

## Usage

- Use the **Settings** section to configure your ChirpStack server, API token, and application ID.
- The **Devices** section lists all devices for the selected application.
- Use the **Actions** section to send downlinks or perform operations on selected devices.

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

   This will generate an installer (e.g., `web-device-controller-Setup-1.0.0.exe`) in the `dist` folder.

3. **Distribute**

   - Share the generated installer with your users.
   - Or upload it to your GitHub Releases page.

**Note:**  
You can customize packaging options (icons, shortcuts, etc.) in the `package.json` under the `"build"` section.

For more details, see the [electron-builder documentation](https://www.electron.build/).

---

## Updating Settings After Packaging

- Open the app and go to the **Settings** section.
- Change your API token, server, or application ID as needed.
- Click **Save**. The new settings will be used immediately.

---

## Development Notes

- Main Electron entry: [`main.js`](main.js)
- Express server and API: [`app.js`](app.js), [`routes/`](routes/)
- Frontend: [`public/`](public/)
- Device logic: [`chirpstack.js`](chirpstack.js)

---

## License

ISC

---