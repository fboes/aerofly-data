import { Feature, FeatureCollection } from '@fboes/geojson';
import fs from 'fs';
import path from 'path';

/**
 * @type {import('./src/aircraft-functions.js').AeroflyAircraft[]}
 */
export const aircraftLiveries = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'aircraft-liveries.json'), 'utf8')
);

/**
 * @type {string[]}
 */
export const airportList = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'airport-list.json'), 'utf8')
);

/**
 * @type {FeatureCollection<Feature>}
 */
export const airports = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'airports.json'), 'utf8')
);
