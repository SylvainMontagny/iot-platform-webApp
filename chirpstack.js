const grpc = require("@grpc/grpc-js");
const device_grpc = require("@chirpstack/chirpstack-api/api/device_grpc_pb");
const device_pb = require("@chirpstack/chirpstack-api/api/device_pb");
const deviceProfile_grpc = require("@chirpstack/chirpstack-api/api/device_profile_grpc_pb");
const deviceProfile_pb = require("@chirpstack/chirpstack-api/api/device_profile_pb");

const server = process.env.URL_SERVER;
const apiToken = process.env.API_TOKEN;
const applicationId = process.env.APP_ID;

// Create a gRPC metadata object used to include the authorization token in each request
const metadata = new grpc.Metadata();
metadata.set("authorization", "Bearer " + apiToken); // Add the API token to the "authorization" header

// Utility function to create a gRPC client using the same connection parameters
function createGrpcClient(ServiceClient) {
  return new ServiceClient(server, grpc.credentials.createInsecure()); // Uses an insecure connection (should be secured in production)
}

// Create the gRPC client to interact with the ChirpStack Device service
const deviceService = createGrpcClient(device_grpc.DeviceServiceClient);

// Create the gRPC client to interact with the ChirpStack DeviceProfile service
const deviceProfileService = createGrpcClient(deviceProfile_grpc.DeviceProfileServiceClient);

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
async function getDeviceDetails(devEui) {
  return new Promise((resolve, reject) => {
    const req = new device_pb.GetDeviceRequest();
    req.setDevEui(devEui);

    deviceService.get(req, metadata, async (err, resp) => {
      if (err) return reject(err);

      const result = resp.getDevice();
      const tagsMap = result.getTagsMap();
      const tags = {};
      tagsMap.forEach((value, key) => {
        tags[key] = value;
      });

      const deviceProfileId = result.getDeviceProfileId();
      const deviceProfileName = await getDeviceProfileName(deviceProfileId);

      const device = {
        devEui: result.getDevEui(),
        name: result.getName(),
        description: result.getDescription(),
        deviceProfileId: deviceProfileId,
        deviceProfileName: deviceProfileName,
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

function getDeviceProfileName(deviceProfileId) {
  return new Promise((resolve, reject) => {
    const req = new deviceProfile_pb.GetDeviceProfileRequest();
    req.setId(deviceProfileId);

    deviceProfileService.get(req, metadata, (err, resp) => {
      if (err) return resolve(null); // on ignore l’erreur pour ne pas bloquer

      const dp = resp.getDeviceProfile();
      resolve(dp.getName());
    });
  });
}

function sendDownlink(devEui, payloadArray, fPort = 1, confirmed = false) {
  return new Promise((resolve, reject) => {
      const item = new device_pb.DeviceQueueItem();
      item.setDevEui(devEui);
      item.setFPort(fPort);
      item.setConfirmed(confirmed);
      item.setData(Uint8Array.from(payloadArray));

      const enqueueReq = new device_pb.EnqueueDeviceQueueItemRequest();
      enqueueReq.setQueueItem(item);

      deviceService.enqueue(enqueueReq, metadata, (err, resp) => {
          if (err) {
              return reject(err);
          }
          resolve(resp.getId());
      });
  });
}


module.exports = { getDevices, getDeviceDetails, updatedevice, sendDownlink };
