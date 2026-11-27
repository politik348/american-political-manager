#!/usr/bin/env python3
"""Import pinned public MEDSL V15 mirror; preserve source provenance and avoid fabricated margins."""
import csv, hashlib, io, json, pathlib, subprocess, urllib.request
URL = "https://raw.githubusercontent.com/grantbw4/2026-midterms-forecast/2be8e042235962b225d1562a8720b45f039d240b/data/MIT_Election_files/1976-2024-house.tab"
BLOB = "91ff5e069127682059ed743093c20cb79c5b9241"
ROOT = pathlib.Path(__file__).resolve().parents[1]
with urllib.request.urlopen(URL, timeout=60) as res:
    raw = res.read(12_000_000)
assert hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest() == BLOB, "Source blob digest mismatch"
decoded = raw.decode("utf-8-sig")
delimiter = "\t" if "\t" in decoded.splitlines()[0] else ","
reader = csv.DictReader(io.StringIO(decoded), delimiter=delimiter)
required = {"year","state_po","district","stage","special","mode","candidate","party","candidatevotes","totalvotes","writein","fusion_ticket"}
assert required <= set(reader.fieldnames or []), reader.fieldnames
def flag(x):
    x = str(x or "").strip().lower()
    return True if x in ("true","1","t") else False if x in ("false","0","f") else None
def number(x):
    try:
        n = float(x)
        return int(n) if n.is_integer() else None
    except (TypeError,ValueError,OverflowError):
        return None
rows = []
for r in reader:
    rows.append({"year":number(r["year"]),"state_po":r["state_po"].strip().upper(),"district":number(r["district"]),"stage":r["stage"].strip().upper(),"special":flag(r["special"]),"mode":r["mode"].strip().upper(),"candidate":r["candidate"],"party":r["party"],"candidatevotes":number(r["candidatevotes"]),"totalvotes":number(r["totalvotes"]),"writein":flag(r["writein"]),"fusion_ticket":flag(r["fusion_ticket"]),"runoff":flag(r.get("runoff")),"unofficial":flag(r.get("unofficial"))})
assert len(rows)>20000, len(rows)
script = """import fs from 'node:fs';import {houseMargins} from './v18-career.js';const rows=JSON.parse(fs.readFileSync(0,'utf8'));let years={};for(let y=1976;y<=2024;y+=2){years[y]=houseMargins(rows,y);if(Object.keys(years[y]).length<200)throw Error('Too few validated races '+y+': '+Object.keys(years[y]).length)}process.stdout.write(JSON.stringify(years));"""
result = subprocess.run(["node","--input-type=module","-e",script], cwd=ROOT, input=json.dumps(rows), text=True, capture_output=True)
if result.returncode: raise RuntimeError(result.stderr)
years = json.loads(result.stdout)
for district, max_margin in [("CA-13",1),("CA-45",1),("IA-1",1),("CO-8",2)]:
    assert years["2024"][district]["margin"] < max_margin, (district,years["2024"].get(district))
obj = {"schema":1,"source":"https://doi.org/10.7910/DVN/IG0UN2","sourceMirror":URL,"gitBlob":BLOB,"years":years}
out = ROOT/"data/v18-house-margins.json"
out.write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("Validated years:",len(years),"district-years:",sum(len(x) for x in years.values()))
