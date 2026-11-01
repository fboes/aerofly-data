#!/usr/bin/env node

//@ts-check

import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  getAeroflyAircraft,
  getSelectLiveryOptgroupOptions,
  getSelectOptgroupOptions,
  getSelectOptions,
  MISSING_LIVERIES,
} from "./src/aircraft-functions.js";

const inputDirectory = process.argv[2] ?? ".";
const aeroflyAircraft = getAeroflyAircraft(inputDirectory);

/**
 * @type {Promise<void>[]}
 */
const promises = [];

process.stdout
  .write(`Found \x1b[92m${aeroflyAircraft.length}\x1b[0m Aerofly FS Aircraft with \x1b[92m${aeroflyAircraft.reduce((sum, aircraft) => sum + aircraft.liveries.length, 0)}\x1b[0m liveries
`);

// Ensure the output directory exists
const outputDirectory = path.join("data");
await fs.mkdir(outputDirectory, { recursive: true });

// Write the full output (with liveries) to aircraft-liveries.json
const outputFilePathWithLiveries = path.join(outputDirectory, "aircraft-liveries.json");
promises.push(
  fs.writeFile(outputFilePathWithLiveries, JSON.stringify(aeroflyAircraft, null, 2), "utf-8").then(() => {
    process.stdout.write(
      `Full aircraft data (with liveries) written to \x1b[92m${outputFilePathWithLiveries}\x1b[0m\n`,
    );
  }),
);

// Write missing livery file
const outputMissingLiveries = path.join(outputDirectory, "aircraft-liveries-missing.md");
/**
 * @type {string[]}
 */
const missingLiveries = [];
MISSING_LIVERIES.forEach((m) => {
  missingLiveries.push(`- ${m}`);
});
const outputMissingLiveriesContent =
  "# Aerofly FS: Liveries without ICAO code match\n\n" + missingLiveries.sort().join("\n") + "\n";
promises.push(
  fs.writeFile(outputMissingLiveries, outputMissingLiveriesContent, "utf-8").then(() => {
    process.stdout.write(`Missing livery file written to \x1b[92m${outputMissingLiveries}\x1b[0m\n`);
  }),
);

// Write the abbreviated output (without liveries) to aircraft.json
const outputFilePathWithoutLiveries = path.join(outputDirectory, "aircraft.json");
promises.push(
  fs
    .writeFile(
      outputFilePathWithoutLiveries,
      JSON.stringify(aeroflyAircraft, (key, value) => (key === "liveries" ? undefined : value), 2),
      "utf-8",
    )
    .then(() => {
      process.stdout.write(
        `Abbreviated aircraft data (without liveries) written to \x1b[92m${outputFilePathWithoutLiveries}\x1b[0m\n`,
      );
    }),
);

// Sort aeroflyAircraft by nameFull
const sortedAircraft = aeroflyAircraft.sort((a, b) => a.nameFull.localeCompare(b.nameFull));

// Write summary to aircraft.md
const summaryFilePath = path.join(outputDirectory, "aircraft.md");

/**
 * Formats a number with commas as thousands separators.
 * @param {number} number - The number to format.
 * @returns {string} The formatted number.
 */
const numberFormat = (number) => new Intl.NumberFormat("en-US").format(number);

const summaryContent =
  `\
# Aerofly FS Aircraft Summary

| Aircraft Name                        | ICAO Code | Aerofly FS Code | Approach Speed (kts) | Cruise Altitude (ft) | Cruise Speed (kts) | Maximum Range (nm) | Liveries |
| ------------------------------------ | --------- | --------------- | -------------------: | -------------------: | -----------------: | -----------------: | --------: |
` +
  sortedAircraft
    .map((aircraft) => {
      return (
        "| " +
        [
          aircraft.nameFull,
          aircraft.icaoCode ? `\`${aircraft.icaoCode}\`` : "",
          `\`${aircraft.aeroflyCode}\``,
          numberFormat(aircraft.approachAirspeedKts),
          numberFormat(aircraft.cruiseAltitudeFt),
          numberFormat(aircraft.cruiseSpeedKts),
          numberFormat(aircraft.maximumRangeNm),
          numberFormat(aircraft.liveries.length),
        ].join(" | ") +
        " |"
      );
    })
    .join("\n") +
  `\

- Total Aircraft: **${numberFormat(sortedAircraft.length)}**
- Total Liveries: **${numberFormat(sortedAircraft.reduce((sum, aircraft) => sum + aircraft.liveries.length, 0))}**
`;

promises.push(
  fs.writeFile(summaryFilePath, summaryContent, "utf-8").then(() => {
    process.stdout.write(`Summary written to \x1b[92m${summaryFilePath}\x1b[0m\n`);
  }),
);

// Write HTML <select> options to aircraft-select.html
const selectFilePath = path.join(outputDirectory, "aircraft-select.html");
let selectContent = getSelectOptions(sortedAircraft);
promises.push(
  fs.writeFile(selectFilePath, selectContent, "utf-8").then(() => {
    process.stdout.write(`HTML <select> options written to \x1b[92m${selectFilePath}\x1b[0m\n`);
  }),
);

// Write HTML <select> with <optgroup> to aircraft-select-optgroup.html
const selectOptgroupFilePath = path.join(outputDirectory, "aircraft-select-optgroup.html");
let selectOptgroupContent = getSelectOptgroupOptions(sortedAircraft);
promises.push(
  fs.writeFile(selectOptgroupFilePath, selectOptgroupContent, "utf-8").then(() => {
    process.stdout.write(
      `HTML aircraft <select> with category <optgroup> options written to \x1b[92m${selectOptgroupFilePath}\x1b[0m\n`,
    );
  }),
);

// Write HTML <select> with <optgroup> to aircraft-select-optgroup.html
const selectOptgroupLiveryFilePath = path.join(outputDirectory, "aircraft-livery-select-optgroup.html");
let selectOptgroupLiveryContent = getSelectLiveryOptgroupOptions(sortedAircraft);
promises.push(
  fs.writeFile(selectOptgroupLiveryFilePath, selectOptgroupLiveryContent, "utf-8").then(() => {
    process.stdout.write(
      `HTML livery <select> with aircraft <optgroup> options written to \x1b[92m${selectOptgroupLiveryFilePath}\x1b[0m\n`,
    );
  }),
);

Promise.all(promises).then(() => {
  process.stdout.write(`\nAll aircraft files written to \x1b[92m${path.resolve(outputDirectory)}\x1b[0m\n`);
});
