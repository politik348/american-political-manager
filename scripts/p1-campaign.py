#!/usr/bin/env python3
"""One serial 100-person chunk; further chunks gated by first real batch result."""
import json, os, subprocess, hashlib, time
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
os.chdir(ROOT)
p=Path('docs/P1-CAMPAIGN-R5.json')
report=Path('docs/P1-AUTO-R2-REPORT.json')
manifest=Path('data/p1-portraits.json')
run=os.environ['GITHUB_RUN_ID']
def load(path,default):
    return json.loads(path.read_text()) if path.exists() else default
def write(x): p.write_text(json.dumps(x,indent=2)+'\n')
old=load(p,{})
prev=load(report,{})
if (prev.get('pauseUntil') or 0)>time.time():
    print('Server backoff remains in force; no network requests'); raise SystemExit(0)
state=old if old.get('run')==run else {'run':run,'targetAttempts':1000,'chunks':[],'status':'pilot100','threshold':60}
if state['status'] not in ('pilot100','expand'): 
    print('Campaign stopped:',state['status']); raise SystemExit(0)
if len(state['chunks'])>=10: raise SystemExit(0)
before=load(manifest,{})
cmd=['python','scripts/p1-auto-portraits.py','--expand','--limit','100']
if not state['chunks']: cmd.append('--retry-improved')
subprocess.run(cmd,check=True)
after=load(manifest,{})
res=load(report,{})
for q,v in after.items():
    path=Path(v['path']); raw=path.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=v['sha256']: raise ValueError('hash mismatch '+q)
    with Image.open(path) as im:
        im.verify()
    with Image.open(path) as im:
        if im.format!='WEBP' or im.size!=(v['width'],v['height']) or max(im.size)>768: raise ValueError('image dimensions/format '+q)
ids=res.get('thisRunIds',[])
n=res.get('thisRunAttempted',0); added=len(set(after)-set(before))
chunk={'attempted':n,'newCandidates':added,'totalCandidates':len(after),'attemptedIds':ids,'pauseUntil':res.get('pauseUntil')}
state['chunks'].append(chunk)
state['totalAttempts']=sum(c['attempted'] for c in state['chunks'])
state['newCandidates']=sum(c['newCandidates'] for c in state['chunks'])
if res.get('pauseUntil'): state['status']='server_pause'
elif len(state['chunks'])==1 and (n!=100 or added<state['threshold']): state['status']='pilot_gate_not_met'
elif len(state['chunks'])>=10 or n<100: state['status']='complete_or_queue_exhausted'
else: state['status']='expand'
write(state)
print(json.dumps(chunk),state['status'],flush=True)
