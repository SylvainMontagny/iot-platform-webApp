# web-device-controller

**web-device-controller** is a Node.js application that communicates with a ChirpStack server using gRPC to fetch information about LoRaWAN devices.

## Requirements

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/)
- [ChirpStack](https://www.chirpstack.io/)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/elias-qzo/web-device-controller
cd web-device-controller
```

### 2. Setup environment
Create a .env file from the example:
```bash
cp .env.example .env
```
Fill in your ChirpStack server address and API token.

2. Start the Webapp container
```shell
cd web-device-controller
docker compose up -d --build
```

3. Stop the containers
```shell
docker compose down
```

## Usage

### 3. List Devices
This project includes a function to list LoRaWAN devices associated with a given applicationId in ChirpStack.

### Endpoint

`GET http://localhost:3000/api/getdevices`

### Response

```json
{
  "success": true,
  "devices": [
    {
      "devEui": "a1b2c3d4e5f67890",
      "name": "device-01",
      "description": "Temperature sensor",
      "deviceProfileId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "deviceProfileName": "temp-sensor-profile"
    }
  ]
}
```

### 3. Get Device Details
This project includes a function to retrieve the details of a single LoRaWAN device based on its devEui.

### Endpoint

`GET http://localhost:3000/api/getdevice/:devEui`

### Path Parameters

- `devEui` (string): The unique identifier of the device you want to retrieve details for.

### Response

```json
{
  "success": true,
  "device": {
    "devEui": "a1b2c3d4e5f67890",
    "name": "device-01",
    "description": "Temperature sensor",
    "deviceProfileId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "deviceProfileName": "temp-sensor-profile",
    "lastSeen": "2023-05-01T12:00:00Z",
    "deviceStatus": "active"
  }
}
