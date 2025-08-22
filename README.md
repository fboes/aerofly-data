# Aerofly Airports

This project contains data sets for airports and aircraft present in [Aerofly FS 4](https://www.aerofly.com/). This airport data is based on data from [OurAirports](https://ourairports.com/).

There is also a [ICAO code checker](https://fboes.github.io/aerofly-data/dist/), which checks if a given ICAO airport code exists in Aerofly FS 4.

It also contains [airport and navigation aid icons](./icons/) suitable for maps.

## Enclosed files

The `data` directory contains the following files:

| File                                                                    | Description                                                                             |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`aircraft-liveries.json`](./data/aircraft-liveries.json)               | JSON file containing detailed information about all aircraft, including liveries.       |
| [`aircraft-select-optgroup.html`](./data/aircraft-select-optgroup.html) | HTML snippet file containing all aircraft, sorted by category                           |
| [`aircraft-select.html`](./data/aircraft-select.html)                   | HTML snippet file containing all aircraft                                               |
| [`aircraft.json`](./data/aircraft.json)                                 | JSON file containing abbreviated information about all aircraft (without liveries).     |
| [`aircraft.md`](./data/aircraft.md)                                     | Markdown file containing abbreviated information about all aircraft (without liveries). |
| [`airport-list.json`](./data/airport-list.json)                         | JSON file containing an array of all ICAO codes.                                        |
| [`airports-unmatched.md`](./data/airports-unmatched.md)                 | Markdown file containing all airports not contained in `aiports.geojson`                |
| [`airports.geojson`](./data/airports.geojson)                           | GeoJSON file containing the location of all airports in Aerofly FS 4.                   |

## Building

To generate a new list of all airports available in Aerofly FS 4:

1. Install this project  
   `npm install`
2. Download a list of all airports from https://ourairports.com/data/ to `tmp/airports.csv`.  
   `npm run fetch-csv`
3. Generate airport output files via:  
   `node ./get-airports.js 'C:\SteamLibrary\steamapps\common\Aerofly FS 4 Flight Simulator\scenery\airports_db'`
4. Generate aircraft output files via:  
   `node ./get-aircraft.js 'C:\SteamLibrary\steamapps\common\Aerofly FS 4 Flight Simulator\aircraft'`

## Status

[![GitHub Tag](https://img.shields.io/github/v/tag/fboes/aerofly-data)](https://github.com/fboes/aerofly-data)
[![NPM Version](https://img.shields.io/npm/v/%40fboes%2Faerofly-data.svg)](https://www.npmjs.com/package/@fboes/aerofly-data)
![GitHub License](https://img.shields.io/github/license/fboes/aerofly-data)

## Legal stuff

Author: [Frank Boës](https://3960.org)

Copyright & license: See [LICENSE.txt](LICENSE.txt)

This tool is NOT affiliated with, endorsed, or sponsored by IPACS GbR. As stated in the [LICENSE.txt](LICENSE.txt), this tool comes with no warranty.

The base data for geo locations was taken from [OurAirports](https://ourairports.com/), which is licensed as: "All data is released to the Public Domain, and comes with no guarantee of accuracy or fitness for use."

The icons are based on [Maki icons](https://github.com/mapbox/maki), which are licensed via CC0 1.0 Universal.
