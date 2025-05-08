const grpc = require("@grpc/grpc-js");
const device_grpc = require("@chirpstack/chirpstack-api/api/device_grpc_pb");
const device_pb = require("@chirpstack/chirpstack-api/api/device_pb");

const server = process.env.URL_SERVER;
const apiToken = process.env.API_TOKEN;
const applicationId = process.env.APP_ID;

const deviceService = new device_grpc.DeviceServiceClient(
  server,
  grpc.credentials.createInsecure()
);

const metadata = new grpc.Metadata();
metadata.set("authorization", "Bearer " + apiToken);

// This function retrieves a list of devices from the ChirpStack server.
async function getDevices() {
  return new Promise((resolve, reject) => {
    const req = new device_pb.ListDevicesRequest();
    req.setApplicationId(applicationId);
    req.setLimit(100);

    deviceService.list(req, metadata, async (err, resp) => {
      if (err) return reject(err);

      const devEuis = resp.getResultList().map((device) => device.getDevEui());

      try {
        const devicesWithTags = await Promise.all(
          devEuis.map((devEui) => getDeviceDetails(devEui))
        );
        resolve(devicesWithTags);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// This function retrieves the details of a single device based on its devEui
function getDeviceDetails(devEui) {
  return new Promise((resolve, reject) => {
    const req = new device_pb.GetDeviceRequest();
    req.setDevEui(devEui);

    deviceService.get(req, metadata, (err, resp) => {
      if (err) return reject(err);

      const result = resp.getDevice();

      // Conversion propre de la Map des tags
      const tagsMap = result.getTagsMap();
      const tags = {};
      tagsMap.forEach((value, key) => {
        tags[key] = value;
      });

      const device = {
        devEui: result.getDevEui ? result.getDevEui() : null,
        name: result.getName ? result.getName() : null,
        description: result.getDescription ? result.getDescription() : null,
        deviceProfileId: result.getDeviceProfileId
          ? result.getDeviceProfileId()
          : null,
        deviceProfileName: result.getDeviceProfileName
          ? result.getDeviceProfileName()
          : null,
        lastSeen: result.getLastSeen ? result.getLastSeen() : null,
        deviceStatus: result.getStatus ? result.getStatus() : null,
        tags: tags,
      };

      resolve(device);
    });
  });
}

// Updates the information of an existing device on the ChirpStack server
function updatedevice(deviceData) {
  return new Promise((resolve, reject) => {
    const device = new device_pb.Device();
    device.setDevEui(deviceData.devEui);
    device.setName(deviceData.name);
    device.setDescription(deviceData.description);
    device.setDeviceProfileId(deviceData.deviceProfileId);
    device.setApplicationId(applicationId);

    // Ajouter les tags s'ils sont présents dans la requête
    if (deviceData.tags && typeof deviceData.tags === "object") {
      const tagsMap = device.getTagsMap();
      tagsMap.clear();
      for (const [key, value] of Object.entries(deviceData.tags)) {
        tagsMap.set(key, value);
      }
    }

    const req = new device_pb.UpdateDeviceRequest();
    req.setDevice(device);

    deviceService.update(req, metadata, (err, resp) => {
      if (err) {
        return reject(err);
      }
      resolve({ success: true, message: "Device updated successfully" });
    });
  });
}

module.exports = { getDevices, getDeviceDetails, updatedevice };
