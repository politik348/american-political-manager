# V7 integrated development build
## Run
Web: GitHub Pages (main/root), or locally `python -m http.server 8000`. Browser install requires HTTPS/localhost and compatible browser.
## New
- Automatic matching of the selected state and Congress to UCLA/Lewis GeoJSON filename ranges; raw source link, zoom, district metadata, manual fallback. The map browser does not change the fictional candidate's state.
- On-device bounded portrait cache (up to 180 entries, subject to browser storage policy); optional offline asset package of public-domain congressional portraits, people records and historical maps. The package is produced by Actions, not committed as a large binary collection.
- Dossiers: recorded terms, service duration without duplicate overlap, offices, parties, states, birth date where available and source links.
- Observed peer graph: concurrent term dates and common state/chamber/party; no assertion of personal friendship, ideology or alliance.
- Fictional bicameral legislative management: draft, referral, hearing, markup, calendar, floor, second chamber, reconciliation, presentment, archive. Not an exact historical procedural simulator. Current committee snapshot is not a historical assignment.
- Unity native UI Toolkit scene setup, C# rules, map view, offline portraits and personal-device cache, JSON-compatible saves. Install asset pack and assign font/theme before building. Native C# compilation and real device build not confirmed.
## Verification
`npm test` runs JS checks and core tests. The browser workflow uses Chromium desktop/mobile fixtures, including V7 map/profile/bill screens. Real source data, real Pages deployment, and Unity platform build need independent verification. Fixtures are synthetic and are not shipped as historical facts.
## Data credits
- Lewis, DeVine, Pitcher/Pritcher and Martis (2013), Digital Boundary Definitions of U.S. Congressional Districts, updated to v2 in 2025: https://cdmaps.polisci.ucla.edu/ and https://github.com/JeffreyBLewis/congressional-district-boundaries . Web uses original geometries; native display maps sample vertices and are not research-grade GIS.
- Congressional biographical records and current committees: https://github.com/unitedstates/congress-legislators
- Congressional public-domain photos: https://github.com/unitedstates/images . Wikimedia presidential images are external and not included in redistributed asset pack; check individual licenses.
- Official historical election records: https://www.archives.gov/electoral-college/results
- The complete governor source and missing pictures are not guaranteed. No modern election forecasts, inferred politician skill scores or invented historical connections.
