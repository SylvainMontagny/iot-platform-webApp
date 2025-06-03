// État du type de device actif
let currentDeviceType = "micropelt-mlr003"; // Par défaut, on affiche les valves

// Fonction pour récupérer les devices depuis l'API
async function fetchDevices() {
  try {
    const response = await fetch(`/api/getdevices/type/${currentDeviceType}`);
    const data = await response.json();

    if (data.success) {
      return data.devices;
    } else {
      throw new Error(
        data.message || "Erreur lors de la récupération des devices"
      );
    }
  } catch (error) {
    console.error("Erreur:", error);
    return [];
  }
}

// État du tri
let currentSort = {
  column: null,
  direction: "asc",
};

// Fonction pour trier les devices
function sortDevices(devices, column, direction) {
  return [...devices].sort((a, b) => {
    let valueA, valueB;

    if (column === "name") {
      valueA = a.name || "N/A";
      valueB = b.name || "N/A";
    } else {
      valueA = a.tags?.[column] || "N/A";
      valueB = b.tags?.[column] || "N/A";
    }

    // Si l'une des valeurs est "N/A", la placer à la fin
    if (valueA === "N/A" && valueB !== "N/A") return 1;
    if (valueA !== "N/A" && valueB === "N/A") return -1;
    if (valueA === "N/A" && valueB === "N/A") return 0;

    // Sinon, trier normalement
    if (direction === "asc") {
      return valueA.localeCompare(valueB);
    } else {
      return valueB.localeCompare(valueA);
    }
  });
}

// Fonction pour mettre à jour le tableau des devices
function updateDevicesTable(devices) {
  const tbody = document.querySelector(".devices-table tbody");

  if (devices.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="no-data">No devices found</td></tr>';
    return;
  }

  // Appliquer le tri si une colonne est sélectionnée
  if (currentSort.column) {
    devices = sortDevices(devices, currentSort.column, currentSort.direction);
  }

  tbody.innerHTML = devices
    .map(
      (device, idx) => `
        <tr data-row-index="${idx}">
            <td>
              <input type="checkbox" class="device-checkbox" data-device-index="${idx}" />
            </td>
            <td>${device.name || "N/A"}</td>
            <td>${device.tags?.site || "N/A"}</td>
            <td>${device.tags?.building || "N/A"}</td>
            <td>${device.tags?.room || "N/A"}</td>
        </tr>
    `
    )
    .join("");

  // Ajoute le clic sur la ligne pour sélectionner la checkbox
  tbody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", function (e) {
      // Ne pas déclencher si on clique directement sur la checkbox
      if (e.target.type === "checkbox") return;
      const checkbox = row.querySelector(".device-checkbox");
      if (checkbox) checkbox.checked = !checkbox.checked;
    });
  });

  // Gestion du "select all"
  const selectAll = document.getElementById("select-all-devices");
  if (selectAll) {
    selectAll.checked = false;
    selectAll.addEventListener("change", function () {
      document
        .querySelectorAll(".device-checkbox")
        .forEach((cb) => (cb.checked = selectAll.checked));
    });
  }
}

// Fonction pour gérer le tri
function handleSort(column) {
  const th = document.querySelector(`th[data-column="${column}"]`);

  // Réinitialiser les classes de tri sur toutes les colonnes
  document.querySelectorAll("th.sortable").forEach((header) => {
    header.classList.remove("asc", "desc");
  });

  if (currentSort.column === column) {
    // Inverser la direction si on clique sur la même colonne
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    // Nouvelle colonne, tri ascendant par défaut
    currentSort.column = column;
    currentSort.direction = "asc";
  }

  // Mettre à jour la classe de tri
  th.classList.add(currentSort.direction);

  // Rafraîchir le tableau avec le nouveau tri
  refreshDevices();
}

// Stocke les devices chargés pour accès rapide
let loadedDevices = [];

// Fonction pour rafraîchir les devices
async function refreshDevices() {
  const devices = await fetchDevices();
  loadedDevices = devices; // <-- Ajouté
  updateDevicesTable(devices);
}
// Fonctions pour gérer l'affichage du changement de section
function ControlDisplay() {
  document.querySelectorAll(".page-sections section").forEach((section) => {
    let isControlRelated =  section.classList.contains("device-settings-section") || 
                            section.classList.contains("device-section") || 
                            section.classList.contains("action-section") ;
    !isControlRelated ? section.style.display = "none" : section.style.display = "block";
  });
}
function SettingsDisplay() {
  document.querySelectorAll(".page-sections section").forEach((section) => {
    let isSettingsRelated = section.classList.contains("settings-section");
  !isSettingsRelated ? section.style.display = "none" : section.style.display = "block";
  });
}
function ProvisionningDisplay() {
  document.querySelectorAll(".page-sections section").forEach((section) => {
    let isProvisionningRelated =  section.classList.contains("add-device-section") || 
                                  section.classList.contains("add-device-from-csv-section");
    !isProvisionningRelated ? section.style.display = "none" : section.style.display = "block";
  });
}
// Fonction pour gérer le changement de section
function handleSectionChange(section) {
  // Mettre à jour le type de device actif
  currentDeviceType =
    section === "thermostat" ? "micropelt-mlr003" : "Dragino-lht65";

  // Mettre à jour la classe active dans le menu pour les liens
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });
  document.querySelector(`a[href="#${section}"]`).classList.add("active");

  // Mettre à jour la classe active dans le menu pour les listes
  document.querySelectorAll(".nav-links li").forEach((list) => {
      list.classList.remove("active");
  });
  document.querySelector(`a[href="#${section}"]`).parentElement.parentElement.parentElement.classList.add("active");

  // Mettre à jour le titre de la page
  const title = document.querySelector("h1");
  if (title) {
    switch (section) {
      case "thermostat":
        title.textContent = "Thermostatic Valve Device Management";
        ControlDisplay();
        break;
      case "temperature":
        title.textContent = "Temperature Sensor Device Management";
        ControlDisplay();
        break;
      case "add-device":
        title.textContent = "Add a new device";
        ProvisionningDisplay();
        break;
      case "settings":
        title.textContent = "Settings";
        SettingsDisplay();
        break;
      default:
        title.textContent = "Device Management";
    }
  }
  
  const select = document.getElementById("action-type-select");
  if (select){
    select.innerHTML = "";
    switch (currentDeviceType) {
      case "micropelt-mlr003":
        select.innerHTML = `<option value="1">Operate</option>
                            <option value="2">Version</option>
                            <option value="3">Motor Travel Distance</option>
                            <option value="4">Data Rate</option>
                            <option value="5">
                              Opening Point Detection & Slow Harvesting
                            </option>
                            <option value="6">Temperature Drop Detection</option>
                            <option value="7">PID</option>
                            <option value="8">Temperature Estimate</option>
                            <option value="9">External Sensor</option>
                            <option value="10">External Temperature</option>
                            <option value="11">Beep</option>
                            <option value="15">On/Off</option>`;
        break;
      case "Dragino-lht65":
        select.innerHTML = `<option value="1">Transmit Interval Time</option>
                            <option value="40">Time Sync Mode</option>
                            <option value="41">Time Sync Interval</option>
                            <option value="48">Set system time</option>
                            <option value="162">External Sensor Mode</option>
                            <option value="163">Clear Flash Record</option>
                            <option value="168">
                              Enable/Disable uplink DS18B20 probe ID
                            </option>`;
                          //
        break;
      default:
        console.warn("Unknown device type:", currentDeviceType);
    }  
  }

  const actionForm = document.getElementById("action-form");
  if (actionForm) {
    actionForm.innerHTML = ""; // Effacer le contenu précédent
    renderActionForm(1); // Afficher le formulaire pour le port 1 par défaut
  }
  // Rafraîchir les devices avec le nouveau type
  refreshDevices();
}

// Définition des formulaires pour chaque action
const actionForms = {
  "micropelt-mlr003": {
    1: {
      fields: [
        {
          label: "User Mode",
          name: "userMode",
          type: "select",
          options: ["Ambient_Temperature", "Valve_Position"],
        },
        {
          label: "Safety Mode",
          name: "safetyMode",
          type: "select",
          options: ["Ambient_Temperature", "Valve_Position"],
        },
        {
          label: "Set Value",
          name: "setValue",
          type: "number",
          min: 0,
          max: 40,
          value: 21,
        },
        {
          label: "Room Temperature",
          name: "roomTemperature",
          type: "number",
          min: 0,
          max: 40,
          value: 20,
        },
        {
          label: "Safety Value",
          name: "safetyValue",
          type: "number",
          min: 0,
          max: 40,
          value: 19,
        },
        {
          label: "Radio Interval",
          name: "radioInterval",
          type: "select",
          options: [5, 10, 60, 120, 480],
        },
        {
          label: "Do Reference Run Now",
          name: "doReferenceRunNow",
          type: "select",
          options: [
            { label: "No", value: 0 },
            { label: "Yes", value: 1 },
          ],
        },
      ],
    },
    2: { fields: [] },
    3: {
      fields: [
        {
          label: "Motor Operating Range",
          name: "motor_operating_range",
          type: "select",
          options: [
            "2.56048",
            "0.624",
            "0.832",
            "1.040",
            "1.248",
            "1.456",
            "1.664",
            "1.872",
            "2.080",
            "2.288",
            "2.496",
          ],
        },
      ],
    },
    4: {
      fields: [
        {
          label: "Spreading Factor",
          name: "spreading_factor",
          type: "select",
          options: ["SF7", "SF8"],
        },
      ],
    },
    5: {
      fields: [
        {
          label: "Opening Point Reset",
          name: "opening_point_reset",
          type: "select",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
        },
        {
          label: "Hot Water Availability",
          name: "hot_water_availability",
          type: "select",
          options: ["Use_time_of_year", "OFF", "ON"],
        },
        {
          label: "Slow Harvesting",
          name: "slow_harvesting",
          type: "select",
          options: [
            "DEFAULT",
            "DO_OPD_AND_SH",
            "DO_OPD_ONLY",
            "DISABLE_OPD_AND_SH",
          ],
        },
        {
          label: "Max Flow Sensor Raw",
          name: "max_flow_sensor_raw",
          type: "number",
          min: 0,
          max: 33,
          value: 27,
        },
      ],
    },
    6: {
      fields: [
        {
          label: "TDD Action",
          name: "tdd_action",
          type: "select",
          options: [
            "No_Action",
            "Close_to_0%_for_30_minutes",
            "Close_to_0%_for_60_minutes",
          ],
        },
        {
          label: "TDD Beep",
          name: "tdd_beep",
          type: "select",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
        },
        {
          label: "TDD Period",
          name: "tdd_period",
          type: "select",
          options: [1, 2],
        },
      ],
    },
    7: {
      fields: [
        { label: "kP", name: "kP", type: "number", min: 0, max: 255, value: 20 },
        {
          label: "kI",
          name: "kI",
          type: "number",
          min: 0,
          max: 5.1,
          step: 0.01,
          value: 1.5,
        },
        {
          label: "kD",
          name: "kD",
          type: "number",
          min: 0,
          max: 51,
          step: 0.1,
          value: 21,
        },
        {
          label: "Closed Percent",
          name: "Closed_Percent",
          type: "number",
          min: 0,
          max: 100,
          value: 32,
        },
        {
          label: "kD when closed",
          name: "kD_when_closed",
          type: "number",
          min: 0,
          max: 51,
          step: 0.1,
          value: 14,
        },
        {
          label: "Offset Percent",
          name: "Offset_Percent",
          type: "number",
          min: 0,
          max: 100,
          value: 42,
        },
      ],
    },
    8: {
      fields: [
        {
          label: "Flow Raw Value Offset",
          name: "Flow_Raw_Value_Offset",
          type: "number",
          min: -32,
          max: 31.75,
          step: 0.01,
          value: 2.5,
        },
      ],
    },
    9: {
      fields: [
        {
          label: "External Temperature Sensor Expiry (min)",
          name: "External_temperature_sensor_expiry_minutes",
          type: "number",
          min: 0,
          max: 1275,
          value: 5,
        },
      ],
    },
    10: {
      fields: [
        {
          label: "Room Temperature",
          name: "Room_Temperature",
          type: "number",
          min: 0,
          max: 40,
          value: 22,
        },
      ],
    },
    11: {
      fields: [
        {
          label: "Beep",
          name: "Beep",
          type: "number",
          min: 0,
          max: 255,
          value: 3,
        },
      ],
    },
    15: {
      fields: [
        {
          label: "Device will operate if 6 week reference run fails",
          name: "device_will_operate_if_6_week_reference_run_fails",
          type: "select",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
        },
        {
          label: "Do recalibration now",
          name: "do_recalibation_now",
          type: "select",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
        },
        {
          label: "Turn off device",
          name: "turn_off_device",
          type: "select",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
        },
      ],
    }
  },
  "Dragino-lht65": {
    1: {
      fields: [
        {
          label: "Transmit Interval Time",
          name: "transmit_interval_time",
          type: "select",
          options: [
            { label: "30 sec", value: 30 },
            { label: "1 min", value: 60 },
            { label: "10 min", value: 600 },
            { label: "30 min", value: 1800 },
            { label: "1 h", value: 3600 },
            { label: "12 h", value: 43200 },
            { label: "24 h", value: 86400 },
          ],
        },
      ],
    },
    40: {
      fields: [
        {
          label: "Time Sync Mode",
          name: "time_sync_mode",
          type: "select",
          options: [
            { label: "Disabled", value: 0 },
            { label: "Enabled", value: 1 },
          ],
        }
      ]
    },
    41: {
      fields: [
        {
          label: "Time Sync Interval",
          name: "time_sync_interval",
          type: "select",
          options: [
            { label: "1 day", value: 1 },
            { label: "5 days", value: 5 },
            { label: "10 days", value: 10 },
            { label: "15 days", value: 15 },
            { label: "20 days", value: 20 },
            { label: "25 days", value: 25 },
            { label: "30 days", value: 30 },
          ],
        }
      ]
    },
    48:{
      fields: [
        {
          label: "Set System Time",
          name: "set_system_time",
          type: "datetime-local",
          value: new Date().toISOString().slice(0, 16), // Format YYYY-MM-DDTHH:mm
        }
      ]
    },
    162:{
      fields: [
        {
          label: "External Sensor Mode",
          name: "external_sensor_mode",
          type: "select",
          options: [
            { label: "Interrupt mode", value: 1024 },
            { label: "ADC sensor mode", value: 393216 },
            { label: "4 Byte counting mode", value: 524544 },
            { label: "counting mode", value: 1792 },
            { label: "Illumination sensor mode", value: 5 },
            { label: "external DS18B20 with timestamp", value: 9 },
            { label: "Sensor mode 1", value: 1 }
          ],
        },
        {
          label: "Interrupt Mode",
          name: "interrupt_mode",
          type: "select",
          options: [
            { label: "Falling", value: 2 },
            { label: "Rising", value: 3 },
            { label: "Both", value: 1 },
          ],
        },
        {
          label: "Counting Mode",
          name: "counting_mode",
          type: "select",
          options: [
            { label: "Falling", value: 0 },
            { label: "Rising", value: 1 }
          ],
        },
        {
          label: "Time before sampling",
          name: "time_before_sampling",
          type: "number"
        }
      ]
    },
    163:{
      fields: [
        {
          label: "Clear Flash Record",
          name: "clear_flash_record",
          type: "select",
          options: [
            { label: "No", value: 0 },
            { label: "Yes", value: 1 },
          ],
        }
      ]
    },
    168:{
      fields: [
        {
          label: "External Sensor Mode",
          name: "external_sensor_mode",
          type: "select",
          options: [
            { label: "Disabled", value: 0 },
            { label: "Enabled", value: 1 },
          ],
        }
      ]
    }
  }
};

// Génère dynamiquement le formulaire d'action
function renderActionForm(port) {
  const form = document.getElementById("action-form");
  form.innerHTML = "";
  const config = actionForms[currentDeviceType][port];
  if (!config || !config.fields.length) {
    form.innerHTML =
      "<div class='action-content'>No action form available for this port</div>";
    return;
  }
  let row = null;
  config.fields.forEach((field, idx) => {
    // Nouvelle ligne tous les 3 champs
    if (idx % 3 === 0 && currentDeviceType != "Dragino-lht65") {
      row = document.createElement("div");
      row.className = "form-row";
      form.appendChild(row);
    }else if (currentDeviceType == "Dragino-lht65" && idx === 0) {
      row = document.createElement("div");
      row.className = "form-row";
      form.appendChild(row);
    }
    const group = document.createElement("div");
    group.className = "form-group";
    const label = document.createElement("label");
    label.htmlFor = field.name;
    label.textContent = field.label;
    group.appendChild(label);

    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      input.name = field.name;
      input.id = field.name;
      (field.options || []).forEach((opt) => {
        let option = document.createElement("option");
        if (typeof opt === "object") {
          option.value = opt.value;
          option.textContent = opt.label;
        } else {
          option.value = opt;
          option.textContent = opt;
        }
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type;
      input.name = field.name;
      input.id = field.name;
      if (field.value !== undefined) input.value = field.value;
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step !== undefined) input.step = field.step;
      input.required = true;
    }
    group.appendChild(input);
    row.appendChild(group);
  });

  const SelectDraginoSensorMode = document.querySelector(".action-form #external_sensor_mode");
  if (SelectDraginoSensorMode) {
    SelectDraginoSensorMode.addEventListener("change", (e) => {
      const timeBeforeSamplingInput = document.querySelector(".action-form #time_before_sampling").closest(".form-group");
      const interruptModeSelect = document.querySelector(".action-form #interrupt_mode").closest(".form-group");
      const countingModeSelect = document.querySelector(".action-form #counting_mode").closest(".form-group");
      const selectedValue = e.target.value;
      if (selectedValue === "1792" || selectedValue === "524544") {
        timeBeforeSamplingInput.style.display = "none";
        interruptModeSelect.style.display = "none";
        countingModeSelect.style.display = "flex";
      } else if (selectedValue === "1024") {
        timeBeforeSamplingInput.style.display = "none";
        interruptModeSelect.style.display = "flex";
        countingModeSelect.style.display = "none";
      } else if (selectedValue === "393216") {
        timeBeforeSamplingInput.style.display = "flex";
        interruptModeSelect.style.display = "none";
        countingModeSelect.style.display = "none";
      } else {
        timeBeforeSamplingInput.style.display = "none";
        interruptModeSelect.style.display = "none";
        countingModeSelect.style.display = "none";
      }

    });
    SelectDraginoSensorMode.dispatchEvent(new Event("change")); // Pour initialiser l'affichage
  }
}

async function setTenantOptions() {
  const tenantSelect = document.querySelector(".tenant-select #tenant");
  const tenantIdInput = document.querySelector(".settings-section #tenant-id");

  const res = await fetch("/api/gettenants");
  const data = await res.json();
  if (!data.success) {
    console.error("Erreur lors de la récupération des tenants:", data.message);
    tenantSelect.innerHTML = "";
    if (data.message.includes("UNAUTHENTICATED") && tenantIdInput) {
      const result = await fetch("/api/gettenantinfo");
      const datas = await result.json();
      if (datas.success) {
        tenantSelect.innerHTML = "<option value=''> "+ datas.tenant.name +" </option>";
      }
    }else {
      tenantSelect.innerHTML = "<option value=''>No options</option>";
      tenantSelect.value = "";
      }
  }else {
    const tenants = data.tenants;
    tenantSelect.innerHTML = "";
    tenants.forEach((tenant) => {
      const option = document.createElement("option");
      option.value = tenant.id;
      option.textContent = tenant.name;
      tenantSelect.appendChild(option);
    });
    tenantSelect.dispatchEvent(new Event("change"));
  }
}

async function setApplicationOptions() {
  const applicationSelect = document.querySelector(".application-select #application");

  const res = await fetch("/api/getapplications");
  const data = await res.json();
  if (!data.success) {
    console.error("Erreur lors de la récupération des applications:", data.message);
     applicationSelect.innerHTML = "";
      applicationSelect.innerHTML = "<option value=''>No options</option>";
    return;
  }
  const applicatons = data.applications;
  applicationSelect.innerHTML = "";
  applicatons.forEach((app) => {
    const option = document.createElement("option");
    option.value = app.id;
    option.textContent = app.name;
    applicationSelect.appendChild(option);
  });
  applicationSelect.dispatchEvent(new Event("change"));
}

async function setDeviceProfileOptions() {
  const res = await fetch("/api/getdeviceprofile");
  const data = await res.json();
  if (!data.success) {
    console.error("Erreur lors de la récupération des devices profiles:", data.message);
    return;
  }
  const deviceProfiles = data.deviceProfiles;
  const deviceProfileSelect = document.querySelector(".add-device-section #device-profile");
  deviceProfileSelect.innerHTML = "";
  deviceProfiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    deviceProfileSelect.appendChild(option);
  });
  deviceProfileSelect.dispatchEvent(new Event("change"));
}

async function loadSettings() {
  let settings = {};
  try {
    const res = await fetch("/api/settings", { method: "GET" });
    settings = await res.json();
    if (!settings) {
      throw new Error("Settings not found");
    }
    return {
      server: settings.URL_SERVER,
      apiToken: settings.API_TOKEN,
      tenantToken: settings.TENANT_TOKEN,
      tenantId: settings.TENANT_ID,
      applicationId: settings.APP_ID,
    };
  } catch {}
}

/**
 * Sauvegarde les paramètres de configuration
 * @async
 * @param {Array<string>} settings - Liste des paramètres à sauvegarder
 * @returns {Promise<void>}
 * @example
 * // Sauvegarder les paramètres
 * await saveSettings();
 */
async function saveSettings(settings) {
  const { server, apiToken, tenantId, applicationId, tenantToken } = await loadSettings();
  const tenantTokenCheckbox = document.querySelector(".settings-section #tenant-key-checkbox");
  const apiTokenInput = document.querySelector(".settings-section #api-token");
  const tenantIdInput = document.querySelector(".settings-section #tenant-id");
  const tenantIdSelect = document.querySelector(".tenant-select #tenant");
  const applicationSelect = document.querySelector(".application-select #application");
  const serverInput = document.querySelector(".settings-section #network-server");

  let API_TOKEN = apiToken || apiTokenInput.value;
  let TENANT_TOKEN = tenantToken || tenantTokenCheckbox.checked;
  let URL_SERVER = server || serverInput.value;
  let TENANT_ID = tenantId || (tenantTokenCheckbox.checked ? tenantIdInput.value : tenantIdSelect.value);
  let APP_ID = applicationId || applicationSelect.value;

  settings.forEach((setting) => {
    switch (setting) {
      case "API_TOKEN":
        API_TOKEN = apiTokenInput.value;
        break;
      case "TENANT_TOKEN":
        TENANT_TOKEN = tenantTokenCheckbox.checked;
        break;
      case "URL_SERVER":
        URL_SERVER = serverInput.value;
        break;
      case "TENANT_ID":
        TENANT_ID = tenantTokenCheckbox.checked? tenantIdInput.value : tenantIdSelect.value;
        break;
      case "APP_ID":
        APP_ID = applicationSelect.value;
        break;
      default:
        console.warn(`Unknown setting: ${setting}`);
        break;
    }
  });

    try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ API_TOKEN, URL_SERVER, TENANT_TOKEN, TENANT_ID, APP_ID }),
        });

        const data = await res.json();
        if (data.success) {
          return {success: true, message: "Settings saved successfully"};
        } else {
          alert("Erreur : " + (data.message || "Impossible de sauvegarder"));
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des paramètres:", error);
        alert("Erreur de connexion. Veuillez réessayer.");
      }
}

/**
 * Test Connection to the server
 * @async
 * @returns {Promise<void>}
 * @example
 * // Test Connection
 * await testConnection();
 */
async function testConnection() {
  const tenantTokenCheckbox = document.querySelector(".settings-section #tenant-key-checkbox");
  const apiTokenInput = document.querySelector(".settings-section #api-token");
  const tenantIdInput = document.querySelector(".settings-section #tenant-id");
  const serverInput = document.querySelector(".settings-section #network-server");
  const inputs = document.querySelectorAll(".settings-form input");
  const msgDiv = document.querySelector(".settings-message");
  let response;

  if (tenantTokenCheckbox.checked && !document.querySelector(".settings-section #tenant-id").value) {
    alert("Veuillez entrer un Tenant ID.");
  }else if (tenantTokenCheckbox.checked) {
    try {
      const data = await fetch("/api/testconnection", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({server: serverInput.value, apiToken: apiTokenInput.value, tenantId: tenantIdInput.value}),
      });
      const response = await data.json();
    
      if (!response.success) {
        throw new Error(response.message || "Impossible de se connecter");
      }else {
        if (msgDiv) {
          msgDiv.textContent = "Connection successfull!";
          msgDiv.style.color = "#2ecc40";
          // Efface le message après 3 secondes
          setTimeout(() => {
            msgDiv.textContent = "";
          }, 3000);
        }
      }
      return response;
    } catch (err) {
      alert("Erreur réseau : " + err);
      response = { success: false, message: err|| "Erreur réseau" };
      return response;
    }
  } else if (!tenantTokenCheckbox.checked) {
    try {
      const data = await fetch("/api/testconnection", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({server: serverInput.value, apiToken: apiTokenInput.value}),
      });
      const response = await data.json();
    
      if (!response.success) {
        throw new Error(response.message || "Impossible de se connecter");
      }else {
        if (msgDiv) {
          msgDiv.textContent = "Connection successfull!";
          msgDiv.style.color = "#2ecc40";
          // Efface le message après 3 secondes
          setTimeout(() => {
            msgDiv.textContent = "";
          }, 3000);
        }
      }
      return response;
    } catch (err) {
      alert("Erreur réseau : " + err);
      response = { success: false, message: err|| "Erreur réseau" };
      return response;
    }
  }

}

// Initialisation du formulaire d'action au chargement
document.addEventListener("DOMContentLoaded", () => {

  //Ajouter l'écouteur d'événement pour la selection du tenant
  const tenantSelect = document.querySelector(".tenant-select #tenant");
  tenantSelect.addEventListener("change", async (e) => {
      

      try {
        const data = await saveSettings(["TENANT_ID"]);
        if (data.success) {
          setApplicationOptions();
        } else {
          alert("Erreur : " + (data.message || "Impossible de sauvegarder"));
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des paramètres:", error);
        alert("Erreur de connexion. Veuillez réessayer.");
      }
  });

  //Ajouter l'écouteur d'événement pour la selection de l'application
  const appSelect = document.querySelector(".application-select #application");
  appSelect.addEventListener("change", async (e) => {

      try {

        const data = await saveSettings(["APP_ID"]);

        if (data.success) {
          refreshDevices();
          setDeviceProfileOptions();
        } else {
          alert("Erreur : " + (data.message || "Impossible de sauvegarder"));
        }
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des paramètres:", error);
        alert("Erreur de connexion. Veuillez réessayer.");
      }
  });

  const checkboxDiv = document.querySelector(".checkbox");
  checkboxDiv.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (e.target.type == "checkbox" && e.target.id == "tenant-key-checkbox") {
      // Si on clique sur la checkbox, on ne fait rien de plus
    }else{
      tenantApiKeyCheckbox.checked = !tenantApiKeyCheckbox.checked;
      tenantApiKeyCheckbox.dispatchEvent(new Event("change"));
    }
  });

  // Ajouter l'écouteur d'événement pour la checkbox tenant api key
  const tenantApiKeyCheckbox = document.querySelector(".settings-section #tenant-key-checkbox");
  tenantApiKeyCheckbox.addEventListener("change", async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const tenantIdLabel = document.querySelector(".settings-section #tenant-id-label");
    const tenantIdInput = document.querySelector(".settings-section #tenant-id");
    if (e.target.checked) {
      tenantIdInput.style.display = "block";
      tenantIdLabel.style.display = "block";
    } else {
      tenantIdInput.style.display = "none";
      tenantIdInput.value = ""; // Effacer la valeur si désactivé
      tenantIdLabel.style.display = "none";
    }
    await saveSettings(["TENANT_TOKEN"]);
  });

  //#region ////////// Gestion du drop down /////////////
  const dropdown = document.querySelector(".drop-zone"); 
  const fileInput = document.querySelector(".file-input");

  // Empêcher le comportement par défaut
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropdown.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Gérer les effets visuels
    ['dragenter', 'dragover'].forEach(eventName => {
        dropdown.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropdown.addEventListener(eventName, unhighlight, false);
    });

    // Gérer le drop
    dropdown.addEventListener('drop', handleDrop, false);

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropdown.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropdown.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                fileInput.files = files;
                // Déclencher l'événement change
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            } else {
                alert('Veuillez sélectionner un fichier CSV');
            }
        }
    }
   
  fileInput.addEventListener('change', async (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    const fileName = file.name;
    const dropZoneText = document.querySelector('.drop-zone-text');
    const filedisplay = document.createElement('div');
    if (file.size / 1024 > 1) {
      filedisplay.innerHTML = `<strong>Fichier sélectionné :</strong> ${fileName} ${(file.size / 1024).toFixed(2)} Ko`;
    }else {
    filedisplay.innerHTML = `<strong>Fichier sélectionné :</strong> ${fileName} ${file.size} octets`;
    }
    dropZoneText.appendChild(filedisplay);
  });
//#endregion

  // Ajouter l'écouteur d'événement pour le bouton de rafraîchissement
  const refreshButton = document.querySelector(".refresh-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", refreshDevices);
  }

  // Ajouter les écouteurs d'événements pour le tri
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const column = th.getAttribute("data-column");
      handleSort(column);
    });
  });

  // Ajouter les écouteurs d'événements pour le changement de section
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = e.target.getAttribute("href").substring(1);
      handleSectionChange(section);
    });
  });

  // Bouton Send pour envoyer l'action aux devices sélectionnés
  const sendBtn = document.getElementById("send-action-btn");
    if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
      const actionTypeSelect = document.getElementById("action-type-select");
      const port = Number(actionTypeSelect.value);
      const actionForm = document.getElementById("action-form");
      if (!actionForm) return;

      // Récupère les valeurs du formulaire dynamiquement
      const formData = {};
      Array.from(actionForm.elements).forEach((el) => {
        if (!el.name) return;
        if (el.type === "number") {
          formData[el.name] = Number(el.value);
        } else if (el.type === "select-one") {
          // Pour les booléens
          if (el.value === "true") formData[el.name] = true;
          else if (el.value === "false") formData[el.name] = false;
          else if (!isNaN(Number(el.value)))
            formData[el.name] = Number(el.value);
          else formData[el.name] = el.value;
        } else {
          formData[el.name] = el.value;
        }
      });

      // Récupère les devices sélectionnés
      const checkedBoxes = document.querySelectorAll(
        ".device-checkbox:checked"
      );
      if (checkedBoxes.length === 0) {
        alert("Sélectionnez au moins un device.");
        return;
      }

      // Pour chaque checkbox, prépare le payload encodé
      const payloads = {};
      checkedBoxes.forEach((cb) => {
        const idx = Number(cb.getAttribute("data-device-index"));
        const device = loadedDevices[idx];
        if (!device) return;
        const dev_eui = device.devEui || device.dev_eui || device.devEUI;
        if (!dev_eui) return;

        // Appel de l'encodeur dynamique
        let encoded;
        try {
          encoded = window[`${currentDeviceType.replaceAll('-','_')}_encode_port_${port}`]
            ? window[`${currentDeviceType.replaceAll('-','_')}_encode_port_${port}`]({ data: formData })
            : [];
        } catch (e) {
          alert("Erreur d'encodage : " + e.message);
          return;
        }

        payloads[dev_eui] = {
          dev_eui,
          confirmed: false,
          f_port: port,
          data: encoded,
        };
      });

      let toSend;
      const keys = Object.keys(payloads);
      if (keys.length === 1) {
        toSend = [payloads[keys[0]]];
      } else {
        toSend = Object.values(payloads);
      }
      console.log("toSend", toSend);

      // Envoi de l'action à l'API
      try {
        const response = await fetch("/api/downlink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toSend),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          alert(
            "Erreur lors de l'envoi : " + (error.message || response.statusText)
          );
          return;
        }

        const result = await response.json();
        alert("Action envoyée avec succès !");
        console.log("Réponse du back :", result);
      } catch (err) {
        alert("Erreur réseau : " + err.message);
      }
      console.log("Form data:", formData);
    });
  }

  const actionTypeSelect = document.getElementById("action-type-select");
  if (actionTypeSelect) {
    renderActionForm(Number(actionTypeSelect.value));
    actionTypeSelect.addEventListener("change", (e) => {
      renderActionForm(Number(e.target.value));
    });
  }

  fetch("/api/settings")
        .then((res) => res.json())
        .then(async (settings) => {
          if (settings.API_TOKEN) {
            document.querySelector(".settings-section #api-token").value = settings.API_TOKEN;
          }
          if (settings.URL_SERVER) {
            document.querySelector(".settings-section #network-server").value = settings.URL_SERVER;
          }
          if (settings.API_TOKEN && settings.URL_SERVER) {
            // Initialiser les options des sélecteurs tenant et application
            await setTenantOptions();
            const tenantSelectDiv = document.querySelector(".tenant-select");
            tenantSelectDiv.style.display = "block";
          }
          if (settings.API_TOKEN && settings.URL_SERVER && settings.TENANT_ID) {
            // Si les settings sont déjà chargés, on peut initialiser les options
            await setApplicationOptions();
            const applicationSelectDiv = document.querySelector(".application-select");
            applicationSelectDiv.style.display = "block";
            await setDeviceProfileOptions();
          }
          if (settings.TENANT_TOKEN) {
            const tenantTokenCheckbox = document.querySelector(".settings-section #tenant-key-checkbox");
            tenantTokenCheckbox.checked = true;
            tenantTokenCheckbox.dispatchEvent(new Event("change"));
          }
        });
  
  // Ajouter un device manuellement
  document
    .querySelector(".add-device-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const deviceName = document.getElementById("device-name")?.value;
      const deviceEUI = document.getElementById("device-eui")?.value;
      const deviceAppKey = document.getElementById("device-app-key")?.value;
      const deviceAppEUI = document.getElementById("device-app-eui")?.value;
      const deviceprofile = document.getElementById("device-profile")?.value;

      try {
        const res = await fetch("/api/adddevice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceName, deviceEUI, deviceAppKey, deviceAppEUI, deviceprofile }),
        });

        const data = await res.json();

        if (data.success) {
          alert("Device added successfully!");
          refreshDevices();
        } else {
          alert("Erreur : " + (data.message || "Impossible d'ajouter le device"));
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du device:", error);
        alert("Erreur de connexion. Veuillez réessayer.");
      }
    });

// Ajouter un device depuis un fichier CSV
    document
    .querySelector(".add-device-from-csv-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.querySelector(".file-input");
      const file = fileInput.files[0];

      const csvString = await file.text();
      alert("Fichier CSV chargé avec succès : " + csvString);

      try {
        const res = await fetch("/api/adddevicefromcsv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvData : csvString}),
        });

        const data = await res.json();

        if (data.success) {
          alert("Device added successfully!");
          refreshDevices();
        } else {
          alert("Erreur : " + (data.message || "Impossible d'ajouter le device"));
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout du device:", error);
        alert("Erreur de connexion. Veuillez réessayer.");
      }
    });
    
  // Sauvegarder les settings
  document
    .querySelector(".settings-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitter = e.submitter.id;
      const tenantTokenCheckbox = document.querySelector(".settings-section #tenant-key-checkbox");
      const apiTokenInput = document.querySelector(".settings-section #api-token");
      const tenantIdInput = document.querySelector(".settings-section #tenant-id");
      const serverInput = document.querySelector(".settings-section #network-server");
      const inputs = document.querySelectorAll(".settings-form input");
      const msgDiv = document.querySelector(".settings-message");
      let data = {success: false, message: ""};

      switch (submitter) {
        case "save-credentials":
          const res = await testConnection();
          if (res.success) {
            if (tenantTokenCheckbox.checked && !document.querySelector(".settings-section #tenant-id").value) {
              alert("Veuillez entrer un Tenant ID.");
            }else if (tenantTokenCheckbox.checked) {
            
              data = await saveSettings(["API_TOKEN", "URL_SERVER", "TENANT_ID",]);
            
            } else if (!tenantTokenCheckbox.checked) {
            
              data = await saveSettings(["API_TOKEN", "URL_SERVER"]);

            }

          
            if (data.success) {
              // Afficher le message à côté du bouton Save
              if (msgDiv) {
                msgDiv.textContent = "Settings saved successfully!";
                msgDiv.style.color = "#2ecc40";
                // Efface le message après 3 secondes
                setTimeout(() => {
                  msgDiv.textContent = "";
                }, 3000);
              }
              await setTenantOptions();
              await setApplicationOptions();
              await setDeviceProfileOptions();

              inputs.forEach((input) => {
                input.classList.add("saved-input");
                setTimeout(() => {
                  input.classList.remove("saved-input");
                }, 1000);
              });
            
              refreshDevices();
            } else {
              alert("Erreur : " + (data.message || "Impossible de sauvegarder"));
            }
          }else {
            if (msgDiv) {
              msgDiv.textContent = "Connection error!";
              msgDiv.style.color = "#ff4136";
              // Efface le message après 3 secondes
              setTimeout(() => {
                msgDiv.textContent = "";
              }, 3000);
            }
          }
          break;
        case "test-connection":
          await testConnection();
          break;
        default:
          console.warn("Formulaire inconnu:", target.id);
          return;
      }
    });
});
