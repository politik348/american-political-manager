import hashlib, io, json, pathlib, urllib.request, urllib.parse, time
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=ROOT/'data/dialogue-packs/i1-index.json'
policy=json.loads((ROOT/'docs/I1-R5-PORTRAIT-LOCAL-POLICY.json').read_text())
idx=json.loads(manifest.read_text())
approved={p['id']:p for p in policy['approved']}
out=ROOT/'assets/i1-approved-portraits'
out.mkdir(parents=True,exist_ok=True)
ledger=[]
failed=[]
for p in idx['photos']:
    if p['id'] not in approved: continue
    a=approved[p['id']]
    if any(p.get(k)!=a[k] for k in ('url','metadata','rights','credit','date','sceneId')): raise ValueError('approval changed: '+p['id'])
    u=urllib.parse.urlsplit(p['url'])
    if u.scheme!='https' or u.hostname not in ('upload.wikimedia.org','history.house.gov'): raise ValueError('unexpected host')
    url=urllib.parse.urlunsplit((u.scheme,u.netloc,u.path,'',''))
    error=None
    for attempt in range(3):
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
            if fmt not in ('JPEG','PNG') or min(size)<50: raise ValueError('invalid format or dimensions')
            ext={'JPEG':'jpg','PNG':'png'}[fmt]
            digest=hashlib.sha256(data).hexdigest()
            relative=f'assets/i1-approved-portraits/{p["id"]}-{digest[:16]}.{ext}'
            (ROOT/relative).write_bytes(data)
            p['localPath']='./'+relative
            p['localSha256']=digest
            ledger.append(dict(a,localPath=p['localPath'],sha256=digest,bytes=len(data),width=size[0],height=size[1],downloadUrl=url))
            print('I1 approved local',p['id'],digest,len(data),flush=True)
            error=None
            break
        except Exception as e:
            error=str(e)
            time.sleep(2*(attempt+1))
    if error:
        failed.append({'id':p['id'],'reason':error})
        print('I1 local download held',p['id'],error,flush=True)
    time.sleep(0.5)
if not set(policy['required']).issubset({p['id'] for p in ledger}): raise SystemExit('required original image downloads failed; no commit')
(out/'manifest.json').write_text(json.dumps({'schema':1,'sourceCommit':policy['sourceCommit'],'assets':ledger,'held':failed},ensure_ascii=False,indent=2)+'\n')
manifest.write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')
