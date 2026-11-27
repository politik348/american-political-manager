#!/usr/bin/env python3
"""Offline P1 activation: verify manifest, roster, rights and image bytes; no visual approval."""
import hashlib,json,re,sys,importlib.util
from pathlib import Path
from urllib.parse import urlparse
from collections import Counter,defaultdict
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
spec=importlib.util.spec_from_file_location('collector',ROOT/'scripts/p1-auto-portraits.py')
collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
def read(path): return json.loads((ROOT/path).read_text())
def save(path,obj):
    (ROOT/path).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n')
def https(u,hosts,prefix):
    p=urlparse(u or '')
    return p.scheme=='https' and p.hostname in hosts and p.path.startswith(prefix) and not p.username and not p.password
LICENSE=re.compile(r'^(Public domain|CC0(?: 1\.0)?|CC BY(?:-SA)? (?:1\.0|2\.0|2\.5|3\.0|4\.0))$')
people,_,_,_,_=collector.inventory()
byalias=defaultdict(set)
for k,p in people.items():
    for a in p['aliases']: byalias[a].add(k)
# Pilot list contains explicitly documented aliases absent from the static roster.
pilot=read('docs/P1-PORTRAIT-RECOVERY-R1.json')['batch']['entries']
for x in pilot:
    k=x.get('bioguide') or x.get('historicalId')
    if k:
        for a in [x.get('bioguide'),x.get('historicalId')]:
            if a: byalias[a].add(k)
raw=read('data/p1-portraits.json')
existing=read('data/p1-approved.json')
results=[]; candidates=[]; hash_q=defaultdict(set); alias_q=defaultdict(set)
for q,p in raw.items():
    if p.get('sha256'):hash_q[p['sha256']].add(q)
    for a in p.get('aliases',[]):alias_q[a].add(q)
for q,p in raw.items():
    try:
        assert p.get('status')=='metadata_matched_visual_review_pending','unexpected source status'
        assert re.fullmatch(r'Q\d+',q) and p.get('qid')==q,'QID mismatch'
        sha=p.get('sha256','')
        assert re.fullmatch(r'[a-f0-9]{64}',sha) and len(hash_q[sha])==1,'invalid or duplicate hash'
        assert p.get('path')=='assets/p1-portraits/'+q+'-'+sha[:16]+'.webp','invalid path'
        path=ROOT/p['path']
        assert path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==sha,'missing or corrupt asset'
        with Image.open(path) as im: im.verify()
        with Image.open(path) as im:
            assert im.format=='WEBP' and im.size==(p['width'],p['height']) and 120<=min(im.size)<=max(im.size)<=768,'invalid WebP dimensions'
            im.load()
        assert LICENSE.fullmatch(p.get('license','')),'unsupported license'
        if p['license'].startswith('CC'):
            assert https(p.get('licenseUrl'),{'creativecommons.org','www.creativecommons.org'},'/'),'invalid license URL'
            if p['license'].startswith('CC BY'):assert p.get('author'),'missing attribution'
        assert https(p.get('commons'),{'commons.wikimedia.org','en.wikipedia.org'},'/wiki/File:'),'invalid file source'
        assert https(p.get('original'),{'upload.wikimedia.org'},'/wikipedia/commons/'),'invalid image source'
        assert https(p.get('wikipedia'),{'en.wikipedia.org'},'/wiki/'),'invalid article source'
        ids=p.get('aliases',[])
        assert isinstance(ids,list) and p['id'] in ids and p['id'] in byalias,'unregistered primary roster ID'
        roster_keys=byalias[p['id']]
        assert len(roster_keys)==1,'ambiguous primary ID'
        roster=people.get(next(iter(roster_keys)),{})
        if roster.get('qid'):assert roster['qid']==q,'stored roster QID mismatch'
        ev=p.get('identityEvidence')
        if p.get('method')=='Wikipedia PageImages direct':
            assert isinstance(ev,dict) and (ev.get('storedWikipediaTitle') or ev.get('storedQid')),'missing article association'
            if ev.get('storedQid'):assert ev['storedQid']==q,'article QID mismatch'
            assert ev.get('resolvedWikipediaTitle'),'missing resolved article'
        else:
            assert p.get('method') in ('P18','NARA-confirmed Commons file','Senate-sourced Commons file','Wikipedia PageImages'),'unrecognized acquisition method'
        assert not collector.BAD.search(p.get('fileTitle','')),'non-portrait filename signal'
        aliases=sorted({a for a in ids if a in byalias and byalias[a]==roster_keys and len(alias_q[a])==1})
        assert p['id'] in aliases,'conflicting primary alias'
        row={k:p.get(k) for k in ('id','qid','name','sha256','path','commons','wikipedia','license','licenseUrl','author','date','modified','width','height')}
        row.update(aliases=aliases,status='metadata_connected_visual_review_pending',validation={'file':True,'rights':True,'roster':True,'individualVisualReview':False})
        candidates.append(row)
        results.append({'qid':q,'id':p['id'],'status':'connected','excludedAliases':sorted(set(ids)-set(aliases))})
    except (AssertionError,KeyError,ValueError,OSError,TypeError) as e:
        results.append({'qid':q,'id':p.get('id'),'status':'held','reason':str(e)})
    if len(results)%500==0:print('Offline validation',len(results),'/',len(raw),flush=True)
assert candidates,'No portraits passed validation; refusing empty activation'
save('data/p1-connected.json',candidates)
counts=Counter(x['status'] for x in results)
save('docs/P1-R4-ACTIVATION.json',{'sourceRecords':len(raw),'connected':counts['connected'],'held':counts['held'],'connectedAliases':len({a for p in candidates for a in p['aliases']}),'individuallyApproved':len(existing),'individualVisualReviewCompleted':False,'heldReasons':dict(Counter(x['reason'] for x in results if x['status']=='held')),'heldRecords':[x for x in results if x['status']=='held'],'excludedAliases':[x for x in results if x.get('excludedAliases')],'scope':'offline provenance and image integrity, not independent human visual inspection'})
print(json.dumps({'sourceRecords':len(raw),'connected':counts['connected'],'held':counts['held'],'individuallyApproved':len(existing)},ensure_ascii=False),flush=True)
