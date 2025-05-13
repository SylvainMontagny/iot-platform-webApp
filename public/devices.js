// État du type de device actif
let currentDeviceType = "usmb-valve"; // Par défaut, on affiche les valves

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
      '<tr><td colspan="5" class="no-data">Aucun device trouvé</td></tr>';
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

// Fonction pour gérer le changement de section
function handleSectionChange(section) {
  // Mettre à jour le type de device actif
  currentDeviceType =
    section === "thermostat" ? "usmb-valve" : "temperature-sensor";

  // Mettre à jour la classe active dans le menu
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });
  document.querySelector(`a[href="#${section}"]`).classList.add("active");

  // Mettre à jour le titre de la page
  const title = document.querySelector("h1");
  if (title) {
    title.textContent =
      section === "thermostat"
        ? "Thermostatic Valve Device Management"
        : "Temperature Sensor Device Management";
  }

  // Rafraîchir les devices avec le nouveau type
  refreshDevices();
}

// Ajouter les écouteurs d'événements
document.addEventListener("DOMContentLoaded", () => {
  // Rafraîchir les devices au chargement de la page
  refreshDevices();

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
      const actionForm = document.getElementById("action-form");
      if (!actionForm) return;

      // Récupère les valeurs du formulaire d'action
      const mode = actionForm.mode?.value || actionForm.userMode?.value;
      const safetyMode = actionForm.safetyMode.value;
      const setValue = Number(actionForm.setValue.value);
      const roomTemperature = Number(actionForm.roomTemperature.value);
      const safetyValue = Number(actionForm.safetyValue.value);
      const radioInterval = Number(actionForm.radioInterval.value);
      const doReferenceRunNow = Number(actionForm.doReferenceRunNow.value);

      let setValueMax = mode === "Valve_Position" ? 100 : 40;
      let safetyValueMax = safetyMode === "Valve_Position" ? 100 : 40;

      const finalSetValue = Math.max(0, Math.min(setValue, setValueMax));
      const finalSafetyValue = Math.max(
        0,
        Math.min(safetyValue, safetyValueMax)
      );

      // Récupère les devices sélectionnés
      const checkedBoxes = document.querySelectorAll(
        ".device-checkbox:checked"
      );
      if (checkedBoxes.length === 0) {
        alert("Sélectionnez au moins un device.");
        return;
      }

      // Pour chaque checkbox, récupère le dev_eui et prépare le payload encodé
      const payloads = {};
      checkedBoxes.forEach((cb) => {
        const idx = Number(cb.getAttribute("data-device-index"));
        const device = loadedDevices[idx];
        if (!device) return;
        const dev_eui = device.devEui || device.dev_eui || device.devEUI;
        if (!dev_eui) return;

        // Construction de l'objet à encoder
        const objectToEncode = {
          userMode: mode,
          safetyMode,
          setValue: finalSetValue,
          roomTemperature,
          safetyValue: finalSafetyValue,
          radioInterval,
          doReferenceRunNow,
        };

        // Appel de l'encodeur (port 1)
        const encoded = encode_port_1({ data: objectToEncode });

        payloads[dev_eui] = {
          dev_eui,
          confirmed: false,
          f_port: 1,
          data: encoded,
        };
      });

      // Si un seul device, envoie l'objet seul, sinon un objet de json
      let toSend;
      const keys = Object.keys(payloads);
      if (keys.length === 1) {
        toSend = payloads[keys[0]];
      } else {
        toSend = payloads;
      }

      // Envoi de l'action à l'API
      try {
        const response = await fetch("/api/sendaction", {
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

      // Affiche le JSON qui serait envoyé
      console.log(toSend);
    });
  }
});
