# Update livery-to-ICAO mappings

Review `data/aircraft-liveries-missing.md` and update `src/livery-to-icao.json` with mappings for entries that are clearly official airlines.

- Use each livery name, converted to lowercase, as the JSON key.
- Use the airline's official three-letter ICAO designator, not its IATA code.
- Add a mapping only when both the airline identity and its ICAO designator are unambiguous. Check reliable sources when needed.
- For clear airline-branded variants (such as cargo, anniversary, or special liveries), use the airline's ICAO designator.
- Leave ambiguous names, fictional liveries, military/government liveries, and other non-airline designs unmapped. Do not guess.
- Preserve all existing mappings; do not overwrite a mapping with a different code without confirming and explaining the correction.
- Keep the JSON valid and do not modify the missing-livery list.

After editing, verify that the JSON parses, all keys are lowercase, no duplicate keys were introduced, and the aircraft-functions module still loads.
