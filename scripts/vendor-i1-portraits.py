import hashlib, io, json, pathlib, urllib.request, urllib.parse, urllib.error
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=ROOT/'data/dialogue-packs/i1-index.json'
policy=json.loads((ROOT/'docs/I1-R5-PORTRAIT-LOCAL-POLICY.json').read_text())
idx=json.loads(manifest.read_text())
approved={p['id']:p for p in policy['approved']}
out=ROOT/'assets/i1-approved-portraits'
out.mkdir(parents=True,exist_ok=True)
ledger_file=out/'manifest.json'
ledger=json.loads(ledger_file.read_text())['assets'] if ledger_file.exists() else []
failed=[]
throttled=False
for p in idx['photos']:
    if p['id'] not in policy['phase1']: continue
    a=approved[p['id']]
    if any(p.get(k)!=a[k] for k in ('url','metadata','rights','credit','date','sceneId')): raise ValueError('approval changed: '+p['id'])
    if p.get('localPath'):
        prior=next((x for x in ledger if x['id']==p['id']),None)
        if not prior or hashlib.sha256((ROOT/p['localPath'][2:]).read_bytes()).hexdigest()!=p['localSha256']: raise ValueError('existing asset digest mismatch')
        continue
    if throttled:
        failed.append({'id':p['id'],'reason':'not requested after rate/access limit'})
        continue
    url=a.get('downloadUrl',a['url'])
    u=urllib.parse.urlsplit(url); orig=urllib.parse.urlsplit(a['url'])
    if u.scheme!='https' or u.hostname!=orig.hostname or u.path!=orig.path: raise ValueError('unexpected source')
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'AmericanPoliticalManager/1.0 (historical educational portrait archive; github.com/politik348/american-political-manager)','Accept':'image/jpeg,image/png,image/*'})
        with urllib.request.urlopen(req,timeout=35) as response:
            if urllib.parse.urlsplit(response.geturl()).hostname!=u.hostname: raise ValueError('unexpected redirect')
            if not response.headers.get_content_type().startswith('image/'): raise ValueError('not image content')
            data=response.read(30*1024*1024+1)
        if len(data)>30*1024*1024: raise ValueError('size cap')
        with Image.open(io.BytesIO(data)) as im:
            fmt=im.format; size=im.size; im.verify()
        with Image.open(io.BytesIO(data)) as im: im.load()
        if fmt not in ('JPEG','PNG') or min(size)<50: raise ValueError('invalid image')
        if a.get('dimensions') and list(size)!=a['dimensions']: raise ValueError('Q3-D dimensions differ')
        digest=hashlib.sha256(data).hexdigest()
        if a.get('expectedSha256') and digest!=a['expectedSha256']: raise ValueError('prior verified original digest differs')
        ext={'JPEG':'jpg','PNG':'png'}[fmt]
        relative=f'assets/i1-approved-portraits/{p["id"]}-{digest[:16]}.{ext}'
        (ROOT/relative).write_bytes(data)
        p['localPath']='./'+relative; p['localSha256']=digest
        ledger.append(dict(a,localPath=p['localPath'],sha256=digest,bytes=len(data),width=size[0],height=size[1],downloadUrl=url))
        print('I1 approved local',p['id'],digest,len(data),flush=True)
    except urllib.error.HTTPError as e:
        failed.append({'id':p['id'],'reason':str(e)})
        print('I1 local held',p['id'],str(e),flush=True)
        if e.code in (403,429): throttled=True
    except Exception as e:
        failed.append({'id':p['id'],'reason':str(e)})
        print('I1 local held',p['id'],str(e),flush=True)
(out/'manifest.json').write_text(json.dumps({'schema':1,'policySource':policy['q3dPolicyBlob'],'assets':ledger,'held':failed},ensure_ascii=False,indent=2)+'\n')
manifest.write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')
print('I1 local result',json.dumps({'stored':len(ledger),'requiredComplete':set(policy['required']).issubset({p['id'] for p in ledger}),'held':failed}),flush=True)
