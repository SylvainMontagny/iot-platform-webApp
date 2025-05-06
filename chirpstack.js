const grpc = require("@grpc/grpc-js");
const device_grpc = require("@chirpstack/chirpstack-api/api/device_grpc_pb");
const device_pb = require("@chirpstack/chirpstack-api/api/device_pb");

const server = process.env.URL_SERVER
const apiToken = process.env.API_TOKEN;
const applicationId = process.env.APP_ID;

const deviceService = new device_grpc.DeviceServiceClient(
    server,
    grpc.credentials.createInsecure()
);

const metadata = new grpc.Metadata();
metadata.set("authorization", "Bearer " + apiToken);

// This function retrieves a list of devices from the ChirpStack server.
function listDevices() {
    return new Promise((resolve, reject) => {
        const req = new device_pb.ListDevicesRequest();
        req.setApplicationId(applicationId);
        req.setLimit(100);

        deviceService.list(req, metadata, (err, resp) => {
            if (err) {
                return reject(err);
            }

            const devices = resp.getResultList().map(device => ({
                devEui: device.getDevEui(),
                name: device.getName(),
                description: device.getDescription(),
                deviceProfileId: device.getDeviceProfileId(),
                deviceProfileName: device.getDeviceProfileName(),
            }));

            resolve(devices);
        });
    });
}


module.exports = { listDevices };
