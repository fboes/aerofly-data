#!/usr/bin/env node

//@ts-check

import GeoJSON from "@fboes/geojson";
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse/sync";
import {
  geoJsonType,
  getAeroflyAirports,
  addCustomAeroflyAirportsToMap,
  getAirportSearchWords,
} from "./src/airport-functions.js";

const inputDirectory = process.argv[2] ?? ".";

// Ensure the output directory exists
const outputDirectory = path.join("data");
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

const aeroflyGeoJson = new GeoJSON.FeatureCollection();
const aeroflyAirports = new Map([
  ...addCustomAeroflyAirportsToMap(path.join(outputDirectory, "airports-custom.md")),
  ...getAeroflyAirports(inputDirectory),
]);
const aeroflyAirportsLength = aeroflyAirports.size;
process.stdout.write(`Found \x1b[92m${aeroflyAirports.size}\x1b[0m Aerofly FS Airports
`);

const airportsSource = fs.readFileSync(`tmp/airports.csv`);

/** @type {string[][]} with a single CSV line from airports.csv */
let airportsRecords = parse(airportsSource, { bom: true });
let airportsRecordsProcessed = 0;

// Collect all ICAO codes

/**
 * @type {string[]}
 */
const icaoCodes = [];

/**
 * @type {{
 *  code: String,
 *  name: String,
 *  lat: Number,
 *  lon: Number
 * }[]}
 */
const icaoCoordinatesObject = [];

/**
 *
 * @param {string[]} searchWords
 * @returns {[number, string]|[undefined, undefined]} Returns the length of the airport and the code if found, otherwise undefined.
 */
const getAeroflyAirport = (searchWords) => {
  for (const word of searchWords) {
    if (aeroflyAirports.has(word)) {
      return [aeroflyAirports.get(word) || 0, word];
    }
  }
  return [undefined, undefined];
};

/**
 * @param {string} aeroflyCode
 * @param {string} bestCode
 * @param {string[]} airportsRecord
 * @param {number} length
 */
const addRecord = (aeroflyCode, bestCode, airportsRecord, length) => {
  // Remove airport from list of Aerofly FS4 Airports
  aeroflyAirports.delete(aeroflyCode);

  const isMilitary =
    airportsRecord[3].match(/\b(base|rnas|raf|naval|air\s?force|coast\s?guard|army|afs|mod|cgas)\b/i) !== null;
  let type = airportsRecord[2];
  if (isMilitary) {
    type = type.replace(/port/, "base");
  }

  // Filter community airports and add regular airports to secondary lists
  if (length > 0) {
    icaoCodes.push(bestCode);
    icaoCoordinatesObject.push({
      code: bestCode,
      name: airportsRecord[3],
      lat: Number(airportsRecord[4]),
      lon: Number(airportsRecord[5]),
    });
  }

  const feature = new GeoJSON.Feature(
    new GeoJSON.Point(Number(airportsRecord[5]), Number(airportsRecord[4]), Number(airportsRecord[6]) * 0.3048),
    {
      title: bestCode,
      type: geoJsonType(type, isMilitary, length),
      description: airportsRecord[3],
      elevation: Number(airportsRecord[6]),
      municipality: airportsRecord[10],
      fileSize: Math.ceil(length),
      "marker-symbol": airportsRecord[2].match(/heliport/)
        ? "heliport"
        : airportsRecord[2].match(/small/)
          ? "airfield"
          : "airport",
      "marker-color": airportsRecord[2].match(/large/)
        ? "#5e6eba"
        : airportsRecord[2].match(/small/)
          ? "#777777"
          : "#555555",
    },
  );
  if (isMilitary) {
    feature.setProperty("isMilitary", true);
  }

  aeroflyGeoJson.addFeature(feature);
};

// -----------------------------------------------------------------------------
// PARSING

// 3685,"KMIA","large_airport","Miami International Airport",25.79319953918457,-80.29060363769531,8,"NA","US","US-FL","Miami","yes","KMIA","MIA","MIA","http://www.miami-airport.com/","https://en.wikipedia.org/wiki/
// 19927,"KGBN","small_airport","Gila Bend Air Force Auxiliary Airport",32.887501,-112.720001,883,"NA","US","US-AZ","Gila Bend","no",,,"KGXF","GXF",,"https://en.wikipedia.org/wiki/Gila_Bend_Air_Force_Auxiliary_Field",

process.stdout.write("ROUND 1: ICAO codes\n");
for (const airportsRecord of airportsRecords) {
  airportsRecordsProcessed++;
  const icaoCode = airportsRecord[12];
  const [length, aeroflyCode] = getAeroflyAirport([icaoCode]);

  if (length !== undefined && aeroflyCode !== undefined) {
    addRecord(aeroflyCode, icaoCode, airportsRecord, length);
  }

  if (airportsRecordsProcessed % 5000 === 0) {
    const index = aeroflyAirportsLength - aeroflyAirports.size;
    process.stdout
      .write(`  Processed \x1b[92m${String(airportsRecordsProcessed).padStart(5)}\x1b[0m airport records, found \x1b[92m${String(index).padStart(5)}\x1b[0m Aerofly FS Airports
`);
  }
}

airportsRecords = parse(airportsSource, { bom: true });
airportsRecordsProcessed = 0;

process.stdout.write("ROUND 2: Other codes\n");
for (const airportsRecord of airportsRecords) {
  airportsRecordsProcessed++;
  const ident = airportsRecord[1];
  const icaoCode = airportsRecord[12];
  const searchWords = getAirportSearchWords(ident, icaoCode, airportsRecord);

  const [length, aeroflyCode] = getAeroflyAirport(searchWords);

  if (length !== undefined && aeroflyCode !== undefined) {
    const bestCode = icaoCode || aeroflyCode || ident;
    addRecord(aeroflyCode, bestCode, airportsRecord, length);
  }

  if (airportsRecordsProcessed % 5000 === 0) {
    const index = aeroflyAirportsLength - aeroflyAirports.size;
    process.stdout
      .write(`  Processed \x1b[92m${String(airportsRecordsProcessed).padStart(5)}\x1b[0m airport records, found \x1b[92m${String(index).padStart(5)}\x1b[0m Aerofly FS Airports
`);
  }
}

icaoCoordinatesObject.sort((a, b) => {
  if (a.code < b.code) {
    return -1;
  }
  if (a.code > b.code) {
    return 1;
  }
  return 0;
});

// -----------------------------------------------------------------------------
// OUTPUT

// Write the GeoJSON data to a file
const outputFilePath = path.join(outputDirectory, "airports.geojson");
fs.writeFileSync(outputFilePath, JSON.stringify(aeroflyGeoJson, null, 2), "utf-8");
process.stdout.write(`GeoJSON data written to \x1b[92m${outputFilePath}\x1b[0m\n`);

// Write the ICAO codes to airport-list.json
const icaoListFilePath = path.join(outputDirectory, "airport-list.json");
fs.writeFileSync(icaoListFilePath, JSON.stringify(icaoCodes.sort(), null, 2) + "\n", "utf-8");
process.stdout.write(`ICAO code list written to \x1b[92m${icaoListFilePath}\x1b[0m\n`);

// Write the ICAO codes with airport names and geocoordinates to airport-coordinates.json
const icaoCoordinates = icaoCoordinatesObject.map((feature) => {
  return [feature.code, feature.name, feature.lat, feature.lon];
});
const icaoCoordinatesFilePath = path.join(outputDirectory, "airport-coordinates.json");
fs.writeFileSync(icaoCoordinatesFilePath, JSON.stringify(icaoCoordinates, null, 2) + "\n", "utf-8");
process.stdout.write(`ICAO coordinates list written to \x1b[92m${icaoCoordinatesFilePath}\x1b[0m\n`);

// Write the ICAO codes with airport names and geocoordinates to airport-coordinates-object.json
const icaoCoordinatesObjectFilePath = path.join(outputDirectory, "airport-coordinates-object.json");
fs.writeFileSync(icaoCoordinatesObjectFilePath, JSON.stringify(icaoCoordinatesObject, null, 2) + "\n", "utf-8");
process.stdout.write(`ICAO coordinates object list written to \x1b[92m${icaoCoordinatesObjectFilePath}\x1b[0m\n`);

// Write the missing codes to airports-unmatched.md
const unmatchedFilePath = path.join(outputDirectory, "airports-unmatched.md");
const unmatchedCodes = [...aeroflyAirports]
  .map((a) => {
    return `1. \`${a[0]}\``;
  })
  .sort()
  .join("\n");
fs.writeFileSync(
  unmatchedFilePath,
  `\
# Aerofly FS4 Unmatched Airports

The following Aerofly FS4 Airports were not matched to any known airport. You may want to add these codes (e.g. as keywords) to [OurAirports](https://ourairports.com/) to improve matching.

${unmatchedCodes}
`,
  "utf-8",
);
process.stdout.write(`Unmatched airports file written to \x1b[92m${unmatchedFilePath}\x1b[0m\n`);

if (aeroflyAirports.size > 0) {
  process.stdout.write(
    `\
Missing airport matches for \x1b[92m${aeroflyAirports.size}\x1b[0m Aerofly FS4 Airports, \x1b[92m${(
      (aeroflyAirports.size / aeroflyAirportsLength) *
      100
    ).toFixed(1)}%\x1b[0m
Missing matches for Aerofly FS4 Airport codes:
\x1b[90m> ${[...aeroflyAirports]
      .sort()
      .map((a) => {
        return a[0];
      })
      .join(", ")}\x1b[0m
`,
  );
}
