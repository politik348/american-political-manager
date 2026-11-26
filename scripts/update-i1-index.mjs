import fs from 'node:fs/promises';
const root=new URL('../data/dialogue-packs/',import.meta.url),url=new URL('i1-index.json',root),m=JSON.parse(await fs.readFile(url,'utf8'));
m.parts=(await Promise.all(['P01','P02'].map(async p=>(await fs.readdir(new URL(p+'/',root))).filter(f=>/^part-\d+\.json$/.test(f)).map(f=>p+'/'+f)))).flat().sort();
await fs.writeFile(url,JSON.stringify(m,null,2)+'\n');console.log('I1 manifest: '+m.parts.length+' parts');
