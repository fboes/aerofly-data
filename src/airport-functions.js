// @ts-check

import * as fs from "node:fs";
import * as path from "path";

/**
 *
 * @param {string} type
 * @param {boolean} isMilitary
 * @param {number|undefined} length in Bytes
 * @returns {string}
 */
export const geoJsonType = (type, isMilitary, length) => {
  if (type === "heliport" && length !== undefined && length > 0) {
    return type;
  }

  if (length !== undefined) {
    let size = "closed";
    if (length > 1200) {
      size = "large";
    } else if (length > 1050) {
      size = "medium";
    } else if (length > 920) {
      size = "small";
    } else if (length <= 0) {
      return "private_airfield";
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
export const getAeroflyAirports = (directory, icaoFilter) => {
  const aeroflyAirports = new Map();
  let maxLength = 0;
  let minLength = 10000;

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

/**
 *
 * @param {string} filename
 * @returns {Map<string,number>}
 */
export const addCustomAeroflyAirportsToMap = (filename) => {
  const aeroflyAirports = new Map();
  const fileContent = fs.readFileSync(filename, "utf-8");
  const lines = fileContent.split(/\r?\n/).sort();

  for (const line of lines) {
    const match = line.match(/^(?:-|\*)\s*([A-Z0-9]+)/);
    if (match && match[1]) {
      aeroflyAirports.set(match[1], 0);
    }
  }

  return aeroflyAirports;
};

/**
 *
 * @param {string} ident
 * @param {string} icaoCode
 * @param {string[]} airportsRecord
 * @returns {string[]}
 */
export const getAirportSearchWords = (ident, icaoCode, airportsRecord) => {
  /**
   * @type {string[]}
   */
  const extraWords = [];

  if (airportsRecord[8] === "US" && airportsRecord[15]) {
    extraWords.push("K" + airportsRecord[15]);
  }

  return [
    ident,
    icaoCode,
    airportsRecord[13],
    airportsRecord[14],
    airportsRecord[15],
    ...airportsRecord[18].split(/,\s*/),
    ...extraWords,
  ].filter((word) => word && word.length > 0);
};
