function micropelt_mlr003_encode_port_1(input) {
  let mode = input.data.userMode; // "Ambient_Temperature" or "Valve_Position"
  let safetyMode = input.data.safetyMode; // "Ambient_Temperature" or "Valve_Position"
  let setValue = input.data.setValue; // 0-40 for Ambient_Temperature, 0-100 for Valve_Position
  let roomTemperature = input.data.roomTemperature; // 0-40
  let safetyValue = input.data.safetyValue; // 0-40 for Ambient_Temperature, 0-100 for Valve_Position
  let radioInterval = input.data.radioInterval; // 5, 10, 60, 120, 480
  let doReferenceRunNow = input.data.doReferenceRunNow; // 0 or 1
  let bytes = [0, 0, 0, 0, 0, 0];
  // Byte 1: Set value
  if (mode === "Ambient_Temperature") {
    if (setValue < 0 || setValue > 40) {
      throw new Error("Set value out of range for ambient mode");
    } else {
      bytes[0] = setValue * 2;
    }
  } else if (mode === "Valve_Position") {
    if (setValue < 0 || setValue > 100) {
      throw new Error("Set value out of range for valve mode");
    } else {
      bytes[0] = setValue;
    }
  } else {
    throw new Error("Invalid user mode");
  }
  // Byte 2: Room temperature (0-40)
  if (roomTemperature < 0 || roomTemperature > 40) {
    throw new Error("Room temperature out of range");
  } else {
    bytes[1] = roomTemperature * 4;
  }
  // Byte 3: Safety value
  if (safetyMode === "Ambient_Temperature") {
    if (safetyValue < 0 || safetyValue > 40) {
      throw new Error("Safety value out of range for ambient mode");
    } else {
      bytes[2] = safetyValue * 2;
    }
  } else if (safetyMode === "Valve_Position") {
    if (safetyValue < 0 || safetyValue > 100) {
      throw new Error("Safety value out of range for valve mode");
    } else {
      bytes[2] = safetyValue;
    }
  } else {
    throw new Error("Invalid safety mode");
  }
  // Byte 4: Radio interval, user mode, safety mode
  let radioBits;
  switch (radioInterval) {
    case 5:
      radioBits = 1 << 4; // Radio interval 5 minutes
      break;
    case 10:
      radioBits = 0 << 4; // Radio interval 10 minutes
      break;
    case 60:
      radioBits = 2 << 4; // Radio interval 60 minutes
      break;
    case 120:
      radioBits = 3 << 4; // Radio interval 120 minutes
      break;
    case 480:
      radioBits = 4 << 4; // Radio interval 480 minutes
      break;
    default:
      throw new Error("Invalid radio interval");
  }
  let userModeBits;
  if (mode === "Ambient_Temperature") {
    userModeBits = 2 << 2; // User mode "Ambient_Temperature" in bits 3 and 4
  } else {
    userModeBits = 0 << 2; // User mode "Valve_Position" in bits 3 and 4
  }
  let safetyModeBits;
  if (safetyMode === "Ambient_Temperature") {
    safetyModeBits = 0 << 0; // Safety mode "Ambient_Temperature" in bits 1 and 2
  } else {
    safetyModeBits = 2 << 0; // Safety mode "Valve_Position" in bits 1 and 2
  }
  bytes[3] = radioBits | userModeBits | safetyModeBits;
  // Byte 5: Reserved (set to 0)
  bytes[4] = 0;
  // Byte 6: doReferenceRunNow bit (bit 8)
  if (doReferenceRunNow < 0 || doReferenceRunNow > 1) {
    throw new Error("Invalid doReferenceRunNow value");
  } else {
    bytes[5] = doReferenceRunNow << 7;
  }
  return bytes;
}
function micropelt_mlr003_encode_port_2() {
  return [];
}
function micropelt_mlr003_encode_port_3(input) {
  let bytes = [0];
  let range = String(input.data.motor_operating_range);
  switch (range) {
    case "2.56048":
      bytes[0] = 0;
      break;
    case "0.624":
      bytes[0] = 3;
      break;
    case "0.832":
      bytes[0] = 4;
      break;
    case "1.040":
      bytes[0] = 5;
      break;
    case "1.248":
      bytes[0] = 6;
      break;
    case "1.456":
      bytes[0] = 7;
      break;
    case "1.664":
      bytes[0] = 8;
      break;
    case "1.872":
      bytes[0] = 9;
      break;
    case "2.080":
      bytes[0] = 10;
      break;
    case "2.288":
      bytes[0] = 11;
      break;
    case "2.496":
      bytes[0] = 12;
      break;
    default:
      throw new Error("Invalid Motor Operating Range");
  }
  return bytes;
}
function micropelt_mlr003_encode_port_4(input) {
  let bytes = [0];
  let sf = input.data.spreading_factor;
  switch (sf) {
    case "SF7":
      bytes[0] = 0;
      break;
    case "SF8":
      bytes[0] = 1;
      break;
    default:
      throw new Error("Invalid Spreading Factor");
  }
  return bytes;
}
function micropelt_mlr003_encode_port_5(input) {
  let bytes = [0, 0];
  let opening_point_reset = input.data.opening_point_reset;
  let hot_water_availability = input.data.hot_water_availability;
  let slow_harvesting = input.data.slow_harvesting;
  let max_flow_sensor_raw = input.data.max_flow_sensor_raw;
  let opening_point_reset_bit;
  if (opening_point_reset === true) {
    opening_point_reset_bit = 1 << 4;
  } else {
    opening_point_reset_bit = 0 << 4;
  }
  let hot_water_availability_bit;
  switch (hot_water_availability) {
    case "Use_time_of_year":
      hot_water_availability_bit = 0 << 2;
      break;
    case "OFF":
      hot_water_availability_bit = 1 << 2;
      break;
    case "ON":
      hot_water_availability_bit = 2 << 2;
      break;
    default:
      throw new Error("Invalid Hot Water availabiliy");
  }
  let slow_harvesting_bit;
  switch (slow_harvesting) {
    case "DEFAULT":
      slow_harvesting_bit = 0 << 0;
      break;
    case "DO_OPD_AND_SH":
      slow_harvesting_bit = 1 << 0;
      break;
    case "DO_OPD_ONLY":
      slow_harvesting_bit = 2 << 0;
      break;
    case "DISABLE_OPD_AND_SH":
      slow_harvesting_bit = 3 << 0;
      break;
    default:
      throw new Error("Invalid Slow Harvesting Mode");
  }
  bytes[0] =
    opening_point_reset_bit | hot_water_availability_bit | slow_harvesting_bit;
  if (max_flow_sensor_raw < 0 || max_flow_sensor_raw > 33) {
    throw new Error("Maximum Flow Sensor Raw value out of range");
  } else {
    bytes[1] = max_flow_sensor_raw * 2;
  }
  return bytes;
}
function micropelt_mlr003_encode_port_6(input) {
  let bytes = [0];
  let tdd_action = input.data.tdd_action;
  let tdd_beep = input.data.tdd_beep;
  let tdd_period = input.data.tdd_period;
  let tdd_action_bit;
  switch (tdd_action) {
    case "No_Action":
      tdd_action_bit = 0 << 6;
      break;
    case "Close_to_0%_for_30_minutes":
      tdd_action_bit = 2 << 6;
      break;
    case "Close_to_0%_for_60_minutes":
      tdd_action_bit = 3 << 6;
      break;
    default:
      throw new Error("Invalid Action");
  }
  let tdd_beep_bit;
  if (tdd_beep === true) {
    tdd_beep_bit = 1 << 5;
  } else {
    tdd_beep_bit = 0 << 5;
  }
  let tdd_period_bit;
  switch (tdd_period) {
    case 1:
      tdd_period_bit = 0 << 4;
      break;
    case 2:
      tdd_period_bit = 1 << 4;
      break;
    default:
      throw new Error("Invalid Period");
  }
  bytes[0] = tdd_action_bit | tdd_beep_bit | tdd_period_bit;
  return bytes;
}
function micropelt_mlr003_encode_port_7(input) {
  let bytes = [0, 0, 0, 0, 0, 0, 0];
  let kP = input.data.kP;
  let kI = input.data.kI;
  let kD = input.data.kD;
  let cp = input.data.Closed_Percent;
  let kD_zero = input.data.kD_when_closed;
  let ofp = input.data.Offset_Percent;
  if (kP >= 0 && kP <= 255) {
    bytes[0] = kP;
  } else {
    throw new Error("Invalid kP value");
  }
  if (kI >= 0 && kI <= 5.1) {
    bytes[1] = Math.round(kI / 0.02);
  } else {
    throw new Error("Invalid kI value");
  }
  if (kD >= 0 && kD <= 51) {
    bytes[2] = Math.round(kD / 0.2);
  } else {
    throw new Error("Invalid kD value");
  }
  bytes[3] = 1 << 7;
  if (cp >= 0 && cp <= 100) {
    bytes[4] = cp;
  } else {
    throw new Error("Invalid Closed_Percent value");
  }
  if (kD_zero >= 0 && kD_zero <= 51) {
    bytes[5] = Math.round(kD_zero / 0.2);
  } else {
    throw new Error("Invalid kD_when_closed value");
  }
  if (ofp >= 0 && ofp <= 100) {
    bytes[6] = ofp;
  } else {
    throw new Error("Invalid Offset_Percent value");
  }
  return bytes;
}
function micropelt_mlr003_encode_port_8(input) {
  let bytes = [0];
  let frv_offset = input.data.Flow_Raw_Value_Offset;
  if (frv_offset >= 0 && frv_offset <= 31.75) {
    bytes[0] = Math.round(frv_offset * 4);
  } else if (frv_offset >= -32 && frv_offset < 0) {
    bytes[0] = Math.round((frv_offset + 32) * 4) + 0x80;
  } else {
    throw new Error(
      "Flow_Raw_Value_Offset out of range. Must be between -32.00 and 31.75"
    );
  }
  return bytes;
}
function micropelt_mlr003_encode_port_9(input) {
  let bytes = [0];
  let external_sensor_expiry =
    input.data.External_temperature_sensor_expiry_minutes;
  if (external_sensor_expiry >= 0 && external_sensor_expiry <= 1275) {
    bytes[0] = Math.round(external_sensor_expiry / 5);
  } else {
    throw new Error("Invalid Temperature Sensor expiry time");
  }
  return bytes;
}
function micropelt_mlr003_encode_port_10(input) {
  let bytes = [0];
  let room_temperature = input.data.Room_Temperature;
  if (room_temperature >= 0 && room_temperature <= 40) {
    bytes[0] = room_temperature * 4;
  } else {
    throw new Error("Room_Temperature out of range. Must be between 0 and 40");
  }
  return bytes;
}
function micropelt_mlr003_encode_port_11(input) {
  let bytes = [0];
  let beeps = input.data.Beep;
  if (beeps >= 0 && beeps <= 255) {
    bytes[0] = beeps;
  } else {
    throw new Error("Beep count out of range");
  }
  return bytes;
}
function micropelt_mlr003_encode_port_15(input) {
  let bytes = [0];
  let on = input.data.device_will_operate_if_6_week_reference_run_fails;
  let rec = input.data.do_recalibation_now;
  let off = input.data.turn_off_device;
  let on_bit;
  if (on === true) {
    on_bit = 1 << 7;
  } else {
    on_bit = 0 << 7;
  }
  let rec_bit;
  if (rec === true) {
    rec_bit = 1 << 6;
  } else {
    rec_bit = 0 << 6;
  }
  let off_bit;
  if (off === true) {
    off_bit = 1 << 0;
  } else {
    off_bit = 0 << 0;
  }
  bytes[0] = on_bit | rec_bit | off_bit;
  return bytes;
}
// Encode downlink function.
//
// Input is an object with the following fields:
// - output = Object representing the payload that must be encoded.
// - variables = Object containing the configured device variables.
//
// Output must be an object with the following fields:
// - bytes = Byte array containing the downlink payload.
function encodeDownlink(input) {
  let port = Number(input.fPort);
  switch (port) {
    case 1:
      downlink = micropelt_mlr003_encode_port_1(input);
      break;
    case 2:
      downlink = micropelt_mlr003_encode_port_2();
      break;
    case 3:
      downlink = micropelt_mlr003_encode_port_3(input);
      break;
    case 4:
      downlink = micropelt_mlr003_encode_port_4(input);
      break;
    case 5:
      downlink = micropelt_mlr003_encode_port_5(input);
      break;
    case 6:
      downlink = micropelt_mlr003_encode_port_6(input);
      break;
    case 7:
      downlink = micropelt_mlr003_encode_port_7(input);
      break;
    case 8:
      downlink = micropelt_mlr003_encode_port_8(input);
      break;
    case 9:
      downlink = micropelt_mlr003_encode_port_9(input);
      break;
    case 10:
      downlink = micropelt_mlr003_encode_port_10(input);
      break;
    case 11:
      downlink = micropelt_mlr003_encode_port_11(input);
      break;
    case 15:
      downlink = micropelt_mlr003_encode_port_15(input);
      break;
    default:
      return {
        errors: ["unknown FPort"],
      };
  }
  return {
    bytes: downlink,
    fPort: input.fPort,
  };
}
function Dragino_lht65_encode_port_1(input) {
  let interval = input.data.transmit_interval_time; // in minutes
  let bytes = [0, 0, 0];
  if (interval < 1 || interval > 16777215) {
    throw new Error("Transmit interval time out of range (1-16777215 minutes)");
  }
  bytes[0] = (interval >> 16) & 0xFF; // First byte
  bytes[1] = (interval >> 8) & 0xFF; // Second byte
  bytes[2] = interval & 0xFF; // Third byte
  return bytes;
}
function Dragino_lht65_encode_port_40(input) {
  let timeSync = input.data.time_sync_mode; // boolean value
  let bytes = [0];
  if (timeSync < 1 || timeSync > 255) {
    throw new Error("Time sync mode out of range (1-255)");
  }
  bytes[0] = timeSync; // Set the time sync mode
  return bytes;
}
function Dragino_lht65_encode_port_41(input) {
 let interval = input.data.time_sync_interval; // in days
  let bytes = [0, 0, 0];
  if (interval < 1 || interval > 255) {
    throw new Error("Time sync interval out of range (1-255 days)");
  }
  bytes[0] = interval; // Set the time sync interval
  return bytes;
}
function Dragino_lht65_encode_port_48(input) {
 let time = Math.floor(new Date(input.data.set_system_time).getTime() / 1000);
 console.log("Encoded time:", time);
  let bytes = [0, 0, 0, 0, 0];
  if (time < 0 || time > 4294967295) {
    throw new Error("System time out of range (0-4294967295 seconds since epoch)");
  }
  bytes[0] = 0; // First byte
  bytes[1] = (time >> 24) & 0xFF; // Second byte
  bytes[2] = (time >> 16) & 0xFF; // Third byte
  bytes[3] = (time >> 8) & 0xFF;// Fourth byte
  bytes[4] = time & 0xFF; // Reserved byte
  return bytes;
}
function Dragino_lht65_encode_port_162(input) {
  let bytes = [0, 0, 0, 0, 0];
  return bytes;
}
function Dragino_lht65_encode_port_163(input) {
 let clear = input.data.clear_flash_record; // boolean value
  let bytes = [0];
  if (clear < 1 || clear > 255) {
    throw new Error("clear flash record out of range (1-255)");
  }
  bytes[0] = clear; // Set the time sync mode
  return bytes;
}
function Dragino_lht65_encode_port_168(input) {
 let externalSensor = input.data.external_sensor_mode; // boolean value
  let bytes = [0];
  if (externalSensor < 1 || externalSensor > 255) {
    throw new Error("clear flash record out of range (1-255)");
  }
  bytes[0] = externalSensor; // Set the time sync mode
  return bytes;
}