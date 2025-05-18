#!/usr/bin/env node

//@ts-check

import GeoJSON from "@fboes/geojson";
import * as fs from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse/sync";

/**
 *
 * @param {string} type
 * @param {boolean} isMilitary
 * @param {number|undefined} lenght in Bytes
 * @returns {string}
 */
const geoJsonType = (type, isMilitary, lenght) => {
  if (type === "heliport") {
    return type;
  }

  if (lenght !== undefined) {
    let size = "closed";
    if (lenght > 1200) {
      size = "large";
    } else if (lenght > 1050) {
      size = "medium";
    } else if (lenght > 920) {
      size = "small";
    }

    if (size === "closed") {
      return size;
    }

    return size + "_" + (isMilitary ? "airbase" : "airport");
  }

  return type;
};

/**
 *
 * @param {string} directory
 * @param {RegExp?} icaoFilter
 * @returns {Map<string,number>}
 */
const getAeroflyAirports = (directory, icaoFilter) => {
  const aeroflyAirports = new Map();
  let maxLength = 0;
  let minLength = 10_000;

  const files = fs
    .readdirSync(directory)
    .filter((fn) => fn.endsWith(".wad"))
    .sort();

  for (const file of files) {
    const icaoCode = file.replace(/\.wad$/, "").toUpperCase();
    if (!icaoFilter || icaoCode.match(icaoFilter)) {
      const stats = fs.statSync(path.join(directory, file));
      maxLength = Math.max(maxLength, stats.size);
      minLength = Math.min(minLength, stats.size);
      aeroflyAirports.set(icaoCode, stats.size);
    }
  }

  return aeroflyAirports;
};

// -----------------------------------------------------------------------------

const inputDirectory = process.argv[2] ?? ".";
const icaoFilterArg = process.argv[3]?.replace(/[^A-Z]/, "").toUpperCase();
const icaoFilter = icaoFilterArg
  ? new RegExp("^[" + icaoFilterArg + "]")
  : null;

const aeroflyGeoJson = new GeoJSON.FeatureCollection();
const aeroflyAirports = getAeroflyAirports(inputDirectory, icaoFilter);
const aeroflyAirportsLength = aeroflyAirports.size;
process.stderr
  .write(`Found \x1b[92m${aeroflyAirports.size}\x1b[0m Aerofly FS Airports
`);

const airportsSource = fs.readFileSync(`tmp/airports.csv`);
/** @type {string[][]} with a single CSV line from airports.csv */
const airportsRecords = parse(airportsSource, { bom: true });

let airportsRecordsProcessed = 0;

// Collect all ICAO codes
const icaoCodes = [];

for (const airportsRecord of airportsRecords) {
  // 'id',             'ident',
  // 'type',           'name',
  // 'latitude_deg',   'longitude_deg',
  // 'elevation_ft',   'continent',

  // 3685,"KMIA","large_airport","Miami International Airport",25.79319953918457,-80.29060363769531,8,"NA","US","US-FL","Miami","yes","KMIA","MIA","MIA","http://www.miami-airport.com/","https://en.wikipedia.org/wiki/

  const icaoCode = airportsRecord[1];
  const icaoCodeAlternate = airportsRecord[12];

  // EL = Europe
  // K = US
  if (
    icaoFilter &&
    !icaoCode.match(icaoFilter) &&
    !icaoCodeAlternate.match(icaoFilter)
  ) {
    continue;
  }

  airportsRecordsProcessed++;

  const length =
    aeroflyAirports.get(icaoCode) ?? aeroflyAirports.get(icaoCodeAlternate);

  if (length !== undefined) {
    // Add the ICAO code to the list
    icaoCodes.push(icaoCode);

    // Remove airport from list of Aerofly FS4 Airports
    aeroflyAirports.delete(icaoCode) ||
      aeroflyAirports.delete(icaoCodeAlternate);

    const isMilitary =
      airportsRecord[3].match(
        /\b(base|rnas|raf|naval|air\s?force|coast\s?guard|army|afs|mod)\b/i
      ) !== null;
    let type = airportsRecord[2];
    if (isMilitary) {
      type = type.replace(/port/, "base");
    }

    const feature = new GeoJSON.Feature(
      new GeoJSON.Point(
        Number(airportsRecord[5]),
        Number(airportsRecord[4]),
        Number(airportsRecord[6]) * 0.3048
      ),
      {
        title: icaoCode,
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
      }
    );
    if (isMilitary) {
      feature.setProperty("isMilitary", true);
    }

    aeroflyGeoJson.addFeature(feature);
  }

  if (airportsRecordsProcessed % 5000 === 0) {
    const index = aeroflyAirportsLength - aeroflyAirports.size;
    process.stderr
      .write(`  Processed \x1b[92m${String(airportsRecordsProcessed).padStart(5)}\x1b[0m airport records, found \x1b[92m${String(index).padStart(5)}\x1b[0m Aerofly FS Airports
`);
  }
}

// Ensure the output directory exists
const outputDirectory = path.join("data");
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Write the GeoJSON data to a file
const outputFilePath = path.join(outputDirectory, "airports.geojson");
fs.writeFileSync(outputFilePath, JSON.stringify(aeroflyGeoJson, null, 2), "utf-8");

// Write the ICAO codes to airport-list.json
const icaoListFilePath = path.join(outputDirectory, "airport-list.json");
fs.writeFileSync(icaoListFilePath, JSON.stringify(icaoCodes, null, 2), "utf-8");

// Log a message to STDERR to confirm the files were written
process.stderr.write(`GeoJSON data written to \x1b[92m${outputFilePath}\x1b[0m\n`);
process.stderr.write(`ICAO code list written to \x1b[92m${icaoListFilePath}\x1b[0m\n`);

if (aeroflyAirports.size > 0) {
  process.stderr.write(
    `Missing airport matches for \x1b[92m${
      aeroflyAirports.size
    }\x1b[0m Aerofly FS4 Airports, \x1b[92m${(
      (aeroflyAirports.size / aeroflyAirportsLength) *
      100
    ).toFixed(1)}%\x1b[0m
Missing matches for Aerofly FS4 Airport codes:
\x1b[90m> ${[...aeroflyAirports]
      .map((a) => {
        return a[0];
      })
      .join(", ")}\x1b[0m
`
  );
}
