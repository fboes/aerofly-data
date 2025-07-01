// @ts-check

import * as fs from "node:fs";
import * as path from "path";

/**
 *
 * @param {string} type
 * @param {boolean} isMilitary
 * @param {number|undefined} lenght in Bytes
 * @returns {string}
 */
export const geoJsonType = (type, isMilitary, lenght) => {
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
