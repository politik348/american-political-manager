#!/usr/bin/env python3
"""Resume the original pilot without resetting counters; serial chunks, safe checkpoints."""
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
state=load(p,{'run':run,'targetAttempts':None,'chunks':[],'status':'expand'})
prev=load(report,{})
# Migrate the old 1000 cap without changing any attempted IDs or success counts.
if state.get('targetAttempts')==1000 and state.get('status')=='complete_or_queue_exhausted' and state.get('totalAttempts',0)>=1000:
    state['status']='expand'
state['targetAttempts']=None
state['mode']='wikipedia_first_full_roster'
state['pilotGateRequired']=False
if state.get('status') in ('pilot100','pilot_gate_not_met'): state['status']='expand'
state['scope']='all eligible static game-roster IDs (1900–2026 Congress, historical records, dialogue cast)'
state['milestones']=[100,1000]

# Stop after a new pause in this run; a later authorized run resumes from this checkpoint.
if state.get('status')=='server_pause' and state.get('lastRun',state.get('run'))==run:
    print('Campaign paused in this run; no network requests'); raise SystemExit(0)
if state['status'] in ('complete_or_queue_exhausted','primary_queue_exhausted'):
    print('Campaign stopped:',state['status']); raise SystemExit(0)
pause=prev.get('pauseUntil') or 0
if pause>time.time():
    delay=pause-time.time()+10
    if delay>3600:
        print('Backoff exceeds one-hour runner budget; no network requests'); raise SystemExit(0)
    print('Respecting recorded server backoff, no API requests until deadline',flush=True)
    time.sleep(delay)
n0=sum(c['attempted'] for c in state['chunks'])
added0=sum(c['newCandidates'] for c in state['chunks'])
limit=100
before=load(manifest,{})
cmd=['python','scripts/p1-auto-portraits.py','--expand','--limit',str(limit),'--exclude-campaign']
if state.get('lastRun',state.get('run'))!=run: cmd.append('--retry-improved')
subprocess.run(cmd,check=True)
after=load(manifest,{})
res=load(report,{})
hashes=set()
for q,v in after.items():
    path=Path(v['path']); raw=path.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=v['sha256']: raise ValueError('hash mismatch '+q)
    if v['sha256'] in hashes: raise ValueError('duplicate hash '+q)
    hashes.add(v['sha256'])
    with Image.open(path) as im: im.verify()
    with Image.open(path) as im:
        if im.format!='WEBP' or im.size!=(v['width'],v['height']) or max(im.size)>768: raise ValueError('image dimensions/format '+q)
ids=res.get('thisRunIds',[])
n=res.get('thisRunAttempted',0); added=len(set(after)-set(before))
oldids={i for c in state['chunks'] for i in c['attemptedIds']}
if len(ids)!=n or len(set(ids))!=n or oldids.intersection(ids): raise ValueError('duplicate campaign IDs')
chunk={'attempted':n,'newCandidates':added,'totalCandidates':len(after),'attemptedIds':ids,'pauseUntil':res.get('pauseUntil'),'run':run}
state['chunks'].append(chunk)
state['lastRun']=run
state['totalAttempts']=n0+n
state['newCandidates']=added0+added
state['milestone1000Reached']=n0+n>=1000
state['remainingEligibleEstimate']=res.get('remainingEligibleAfterChunk')
state['queueSize']=res.get('queueSize')
state['reviewRequired']=sum(x.get('status')=='review_required' for x in res.get('results',{}).values())
state['retryRequired']=sum(x.get('status') in ('temporary_error','technical_error') for x in res.get('results',{}).values())
if res.get('pauseUntil'): state['status']='server_pause'
elif n<limit: state['status']='primary_queue_exhausted'
else: state['status']='expand'
write(state)
print(json.dumps(chunk),state['status'],flush=True)
