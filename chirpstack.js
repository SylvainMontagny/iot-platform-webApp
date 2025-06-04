const grpc = require("@grpc/grpc-js");
const device_grpc = require("@chirpstack/chirpstack-api/api/device_grpc_pb");
const device_pb = require("@chirpstack/chirpstack-api/api/device_pb");
const deviceProfile_grpc = require("@chirpstack/chirpstack-api/api/device_profile_grpc_pb");
const deviceProfile_pb = require("@chirpstack/chirpstack-api/api/device_profile_pb");
const tenant_grpc = require("@chirpstack/chirpstack-api/api/tenant_grpc_pb");
const tenant_pb = require("@chirpstack/chirpstack-api/api/tenant_pb");
const application_grpc = require("@chirpstack/chirpstack-api/api/application_grpc_pb");
const application_pb = require("@chirpstack/chirpstack-api/api/application_pb");
const fs = require("fs");
const Papa = require("papaparse");
const path = require("path");
const { console } = require("inspector");


const getSettingsPath = () => {
  if (
    process.mainModule &&
    process.mainModule.filename.indexOf("app.asar") !== -1
  ) {
    // En mode packagé, settings.json est dans resources/
    return path.join(process.resourcesPath, "settings.json");
  }
  // En dev, il est à la racine du projet
  return path.join(__dirname, "settings.json");
};

// Fonction pour charger les settings à chaque appel
function loadSettings() {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(getSettingsPath(), "utf8"));
  } catch {}
  return {
    server: settings.URL_SERVER,
    apiToken: settings.API_TOKEN,
      tenantToken: settings.TENANT_TOKEN,
    tenantId: settings.TENANT_ID,
    applicationId: settings.APP_ID,
  };
}

function checkConfig({ server, apiToken, applicationId }) {
  if (!server || !apiToken) {
    throw new Error(
      "Missing configuration: URL_SERVER or API_TOKEN not set."
    );
  }
}

// Utility function to create a gRPC client using the same connection parameters
function createGrpcClient(ServiceClient, server) {
  console.log(`Creating gRPC client for server:`);
  return new ServiceClient(server + ":8080", grpc.credentials.createInsecure());
}

// Cette fonction récupère la liste des devices
async function getDevices() {
  const { server, apiToken, applicationId } = loadSettings();
  checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    device_grpc.DeviceServiceClient,
    server
  );

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

// Cette fonction récupère les détails d'un device
async function getDeviceDetails(devEui) {
  const { server, apiToken } = loadSettings();
  if (!server || !apiToken) {
    throw new Error("Missing configuration: URL_SERVER or API_TOKEN not set.");
  }
  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    device_grpc.DeviceServiceClient,
    server
  );

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

// Met à jour un device
function updatedevice(deviceData) {
  const { server, apiToken, applicationId } = loadSettings();
  checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    device_grpc.DeviceServiceClient,
    server
  );

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

// Liste les device profiles
function listDeviceProfiles() {
  const { server, apiToken, tenantId, applicationId } = loadSettings();
  checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    deviceProfile_grpc.DeviceProfileServiceClient,
    server
  );

  return new Promise((resolve, reject) => {
    
    const req = new deviceProfile_pb.ListDeviceProfilesRequest();
    req.setTenantId(tenantId);
    req.setLimit(100);
    req.setOffset(0);

    deviceService.list(req, metadata, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp.getResultList().map((profile) => ({ name:profile.getName(), id :profile.getId() })));
    });
  });
}

// Liste les tenants
function listTenants(credentials) {
  const { server, apiToken, applicationId } = credentials ?? loadSettings();
  checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    tenant_grpc.TenantServiceClient,
    server
  );

  return new Promise((resolve, reject) => {
    
    const req = new tenant_pb.ListTenantsRequest();
    req.setLimit(100);
    req.setOffset(0);

    deviceService.list(req, metadata, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp.getResultList().map((tenant) => ({ name:tenant.getName(),id :tenant.getId() })));
    });
  });
}

// Liste les tenants
function getTenantInfo() {
  const { server, apiToken, tenantId, applicationId } = loadSettings();
  checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const tenantService = createGrpcClient(
    tenant_grpc.TenantServiceClient,
    server
  );

  return new Promise((resolve, reject) => {
    
    const req = new tenant_pb.GetTenantRequest();
    req.setId(tenantId);

    tenantService.get(req, metadata, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp.getTenant().toObject());
    });
  });
}

// Liste les applications
function listApplication(credentials) {
  const { server, apiToken, tenantId, applicationId } = credentials ?? loadSettings();
  //checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    application_grpc.ApplicationServiceClient,
    server
  );

  return new Promise((resolve, reject) => {
    
    const req = new application_pb.ListApplicationsRequest();
    req.setLimit(100);
    req.setOffset(0);
    req.setTenantId(tenantId);

    deviceService.list(req, metadata, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp.getResultList().map((app) => ({ name:app.getName(),id :app.getId() })));
    });
  });
}

// Ajoute un device
function adddevice(deviceData) {
  const { server, apiToken, applicationId } = loadSettings();
  checkConfig({ server, apiToken, applicationId });

  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    device_grpc.DeviceServiceClient,
    server
  );

  return new Promise((resolve, reject) => {
    const device = new device_pb.Device();
    device.setDevEui(deviceData.deviceEUI);
    device.setJoinEui(deviceData.deviceAppEUI);
    device.setName(deviceData.deviceName);
    device.setDeviceProfileId(deviceData.deviceprofile);
    device.setApplicationId(applicationId);
    
    const keys = new device_pb.DeviceKeys();
    keys.setNwkKey(deviceData.deviceAppKey);
    keys.setDevEui(deviceData.deviceEUI);

    // Ajouter les tags s'ils sont présents dans la requête
    if (deviceData.tags && typeof deviceData.tags === "object") {
      const tagsMap = device.getTagsMap();
      tagsMap.clear();
      for (const [key, value] of Object.entries(deviceData.tags)) {
        tagsMap.set(key, value);
      }
    }

    const req = new device_pb.CreateDeviceRequest();
    req.setDevice(device);
    const req2 = new device_pb.CreateDeviceKeysRequest();
    req2.setDeviceKeys(keys);

    deviceService.create(req, metadata, (err, resp) => {
      if (err) {
        console.error("Error creating device:", err);
        reject(err);
        return;
      }
      
      // Une fois le device créé, on crée les clés
      deviceService.createKeys(req2, metadata, (err, resp) => {
        if (err) {
          console.error("Error creating device keys:", err);
          reject(err);
          return;
        }
        resolve({ success: true, message: "Device and keys were created successfully" });
      });
    });
  });
}

async function addDeviceFromCsv(csvString) {
  const { server, apiToken, applicationId } = loadSettings();
  checkConfig({ server, apiToken, applicationId });

  // Parse the CSV string
  const parsedData = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsedData.errors.length > 0) {
    throw new Error("CSV parsing error: " + parsedData.errors[0].message);
  }

  let devices = parsedData.data.map((row) => ({
    deviceEUI: row["dev_eui"],
    deviceAppEUI: row["join_eui"],
    deviceName: row["name"],
    deviceAppKey: row["app_key"],
    deviceprofile: row["dev_profile"]
  }));
  let devnum = 0;
  parsedData.data.forEach((row) => {
      // Si des tags sont présents, on les ajoute
      const tags = {};
      Object.keys(row).forEach((key) => {
        if (key.startsWith("tag_")) {
          const tagKey = key.replace("tag_", "");
          tags[tagKey] = row[key];
        }
      });
      devices[devnum].tags = tags;
      devnum++;
  });

   const deviceProfiles = await listDeviceProfiles();

  devices = devices.map(device => {
    const profile = deviceProfiles.find(dp => dp.name === device.deviceprofile);
    if (!profile) {
      throw new Error(`Profile non trouvé: ${device.deviceprofile}`);
    }
    return {
      ...device,
      deviceprofile: profile.id
    };
  });
  
  devices.forEach(device => {
    const propertiesToCheck = ['deviceEUI', 'deviceAppKey', 'deviceAppEUI'];
    propertiesToCheck.forEach( property =>{

      const maxLength = property === 'deviceAppKey' ? 32 : 16;
      const regex = new RegExp(`^[0-9A-Fa-f]{${maxLength}}$`)
        
      const isValid = regex.test(device[property])        
      if (!isValid) {
        device[property].split('').forEach(char => {
          const reg = /[0-9A-Fa-f]/;
          const isValid = reg.test(char);
          if (!isValid) {
            device[property] = device[property].replaceAll(char,'');
          }
      });
      if (device[property].length >= maxLength) {
        device[property] = device[property].slice(0, maxLength)
      }
      }
    });


    if (!device.deviceEUI || !device.deviceAppEUI || !device.deviceName || !device.deviceAppKey || !device.deviceprofile) {
      throw new Error("Missing required fields in device data");
    }
    adddevice(device);
  });
  return { success: true, message: "Devices added successfully" };
}
// Récupère le nom du device profile
function getDeviceProfileName(deviceProfileId) {
  const { server, apiToken } = loadSettings();
  if (!server || !apiToken) {
    throw new Error("Missing configuration: URL_SERVER or API_TOKEN not set.");
  }
  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceProfileService = createGrpcClient(
    deviceProfile_grpc.DeviceProfileServiceClient,
    server
  );

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

// Envoie un downlink
function sendDownlink(devEui, payloadArray, fPort = 1, confirmed = false) {
  const { server, apiToken } = loadSettings();
  if (!server || !apiToken) {
    throw new Error("Missing configuration: URL_SERVER or API_TOKEN not set.");
  }
  const metadata = new grpc.Metadata();
  metadata.set("authorization", "Bearer " + apiToken);

  const deviceService = createGrpcClient(
    device_grpc.DeviceServiceClient,
    server
  );

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

module.exports = { getDevices, getDeviceDetails, updatedevice, listDeviceProfiles, listApplication, listTenants, getTenantInfo, adddevice, addDeviceFromCsv, sendDownlink };
