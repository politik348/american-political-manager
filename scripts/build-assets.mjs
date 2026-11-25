// Run in CI with upstream repositories checked out. Generates an offline package without fabricating portraits.
import fs from 'node:fs/promises';import path from 'node:path';
const out=process.env.APM_ASSET_OUT||'offline-assets';
await fs.mkdir(path.join(out,'data'),{recursive:true});await fs.mkdir(path.join(out,'portraits'),{recursive:true});
const mapDir=process.argv[2]||'_sources/maps/GeoJson',photoDir=process.argv[3]||'_sources/photos/congress/225x275';
const mapFiles=(await fs.readdir(mapDir)).filter(n=>/\.geojson$/i.test(n)&&/_\d+_to_\d+\.geojson$/i.test(n)).map(n=>'GeoJson/'+n);
if(!mapFiles.length)throw Error('No source map filenames found');await fs.writeFile(path.join(out,'data/map-index.json'),JSON.stringify(mapFiles));
const photos=(await fs.readdir(photoDir)).filter(n=>/^[A-Z]\d{6}\.jpg$/i.test(n));if(!photos.length)throw Error('No congressional portraits found');
const manifest=[];for(const f of photos){await fs.copyFile(path.join(photoDir,f),path.join(out,'portraits',f));manifest.push({id:f.slice(0,-4),file:'portraits/'+f,source:'https://unitedstates.github.io/images/congress/225x275/'+f,rights:'Public domain according to the upstream repository'})}
await fs.writeFile(path.join(out,'data/portraits.json'),JSON.stringify(manifest));await fs.writeFile(path.join(out,'SOURCES.txt'),'Portraits: https://github.com/unitedstates/images (public domain as described by source). Map filenames: https://github.com/JeffreyBLewis/congressional-district-boundaries (MIT), Lewis, DeVine, Pitcher and Martis (2013). Map geometries are retrieved on demand, not included in this pack.\n');
console.log(JSON.stringify({maps:mapFiles.length,portraits:photos.length}));
const base='https://unitedstates.github.io/congress-legislators/';
const raw=(await Promise.all(['legislators-historical.json','legislators-current.json'].map(async f=>{const r=await fetch(base+f,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw Error('Legislators HTTP '+r.status);return r.json()}))).flat();
const people=[...new Map(raw.filter(p=>p.id?.bioguide&&p.terms?.some(t=>+t.end.slice(0,4)>=1900)).map(p=>[p.id.bioguide,{id:p.id.bioguide,name:p.name.official_full||[p.name.first,p.name.middle,p.name.last,p.name.suffix].filter(Boolean).join(' '),birthday:p.bio?.birthday,source:'https://bioguide.congress.gov/search/bio/'+p.id.bioguide,terms:p.terms}])).values()];
await fs.writeFile(path.join(out,'data/people.json'),JSON.stringify({people}));
console.log(JSON.stringify({nativePeople:people.length}));