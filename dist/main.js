// @ts-check

/**
 * @global Loaded from Mapbox GL JS script in index.html
 * @type {any} mapboxgl
 */
var mapboxgl;

/**
 * @typedef {[string, string, number, number]} AirportFromJson
 */
/**
 * @typedef {[string, string, number, number, string]} Airport
 */

/**
 * @type {Airport[]}
 */
let airportList = [];

const inputField = document.getElementById("icaoInput");
const statusField = document.getElementById("status");
const datalist = document.getElementById("icaoInputList");
const statusAirportCount = document.getElementById("data-status");

if (!inputField || !(inputField instanceof HTMLInputElement) || !statusField || !datalist || !statusAirportCount) {
  throw new Error("Missing required HTML elements");
}

// -----------------------------------------------------------------------------
// Set #icaoInput value from URL anchor if present
window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    inputField.value = hash.substring(1).toUpperCase();
    if (typeof onInput === "function") {
      onInput();
    }
  }
});

// -----------------------------------------------------------------------------
// Mapbox
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/fboes/cls6d447f00xy01qsds04606f",
  accessToken: "pk.eyJ1IjoiZmJvZXMiLCJhIjoiY2xjZWsyZmo2MDh3cjNybWljM2cxNDA4cSJ9.jsRuxcBPqXXsDjDOnUAZFw",
  projection: "globe",
  zoom: 2,
  center: [15, 30],
});

map.addControl(new mapboxgl.NavigationControl(), "bottom-left");
map.addControl(
  new mapboxgl.GeolocateControl({
    fitBoundsOptions: {
      maxZoom: 10,
    },
  }),
  "bottom-left",
);
map.addControl(
  new mapboxgl.ScaleControl({
    maxWidth: 240,
    unit: "nautical",
  }),
  "bottom-right",
);

map.on("style.load", () => {
  map.setFog({}); // Set the default atmosphere style

  // Currently broken with the custom map style
  map.addSource("mapbox-dem", {
    type: "raster-dem",
    url: "mapbox://mapbox.mapbox-terrain-dem-v1",
    tileSize: 512,
    maxzoom: 14,
  });
  map.setTerrain({ source: "mapbox-dem" });
});

// -----------------------------------------------------------------------------
// Input handling
const onInput = () => {
  const inputValue = inputField.value.trim().toUpperCase();

  /**
   * @type {Airport[]}
   */
  let filtered = [];

  // Autocomplete: Populate datalist if input has 2+ chars
  if (inputValue.length >= 2) {
    // Filter airportList for codes starting with inputValue
    filtered = airportList.filter((entry) => entry[0].startsWith(inputValue) || entry[4]?.startsWith(inputValue));
    // Clear existing options
    datalist.innerHTML = "";
    // Add filtered options
    filtered.forEach((entry) => {
      const option = document.createElement("option");
      option.value = entry[0]; // ICAO code
      option.textContent = `${entry[0]} - ${entry[1]}`;
      datalist.appendChild(option);
    });
  } else {
    // Restore default options if input < 2 chars
    datalist.innerHTML = `\
      <option value="KATL">KATL - Atlanta Airport</option>
      <option value="KLAX">KLAX - Los Angeles International Airport</option>
      <option value="EGLL">EGLL - London Heathrow Airport</option>
      <option value="OMDB">OMDB - Dubai International Airport</option>
      <option value="RJTT">RJTT - Tokyo Haneda Airport</option>
    `;
  }

  if (filtered.length === 1 && inputValue.length >= 4) {
    statusField.textContent = "✅"; // Green checkmark
    statusField.title = "Airport is present in Aerofly FS 4";
    map.flyTo({
      center: [filtered[0][3], filtered[0][2]], // Longitude, Latitude
      zoom: 10,
    });
  } else if (inputValue.trim() === "") {
    statusField.textContent = "❓"; // Question mark for empty input
    statusField.title = "Enter an ICAO code to check if the airport is present in Aerofly FS 4";
  } else {
    statusField.textContent = "🚫"; // Red forbidden sign
    statusField.title = "Airport is NOT present in Aerofly FS 4";
  }
  statusField.setAttribute("aria-label", statusField.title);
};

// Load the airport list from the JSON file
fetch("../data/airport-coordinates.json")
  .then((response) => response.json())
  .then(
    /**
     * @param {AirportFromJson[]} data
     */
    (data) => {
      airportList = data.map((entry) => [...entry, entry[1].toUpperCase()]);

      statusAirportCount.textContent = `Loaded ${airportList.length} airports`;
      onInput(); // Initial call to set status based on empty input
    },
  )
  .catch((error) => {
    console.error("Error loading airport list:", error);
  });

inputField.addEventListener("input", onInput);
