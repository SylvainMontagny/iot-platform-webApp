// Fonction pour récupérer les devices depuis l'API
async function fetchDevices() {
  try {
    const response = await fetch("/api/getdevices");
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

// Fonction pour mettre à jour le tableau des devices
function updateDevicesTable(devices) {
  const tbody = document.querySelector(".devices-table tbody");

  if (devices.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="no-data">Aucun device trouvé</td></tr>';
    return;
  }

  tbody.innerHTML = devices
    .map(
      (device) => `
        <tr>
            <td>${device.name || "N/A"}</td>
            <td>${device.tags?.site || "N/A"}</td>
            <td>${device.tags?.building || "N/A"}</td>
            <td>${device.tags?.room || "N/A"}</td>
        </tr>
    `
    )
    .join("");
}

// Fonction pour rafraîchir les devices
async function refreshDevices() {
  const devices = await fetchDevices();
  updateDevicesTable(devices);
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
});
