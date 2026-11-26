#!/usr/bin/env python3
"""P1 pilot: metadata-based discovery and conservative Commons ingestion."""
import argparse, hashlib, html, io, json, re, time, unicodedata
from pathlib import Path
from urllib.parse import quote, urlparse
import requests
from PIL import Image, ImageOps
from p1_wikipedia_batch import Batch, key, filekey

ROOT=Path(__file__).resolve().parents[1]
WD='https://www.wikidata.org/w/api.php'
WP='https://en.wikipedia.org/w/api.php'
CM='https://commons.wikimedia.org/w/api.php'
UA='AmericanPoliticalManager-Portraits/2.0 (https://github.com/politik348/american-political-manager; repository issues)'
session=requests.Session()
session.headers['User-Agent']=UA
BATCH=None
cache=ROOT/'.p1-cache'
cache.mkdir(exist_ok=True)
Image.MAX_IMAGE_PIXELS=40_000_000
class Temporary(Exception): pass
class RatePause(Temporary):
    def __init__(self,message,delay=3600):
        super().__init__(message); self.until=time.time()+max(3600,delay)
class Hold(Exception): pass
def read(p): return json.loads((ROOT/p).read_text())
def save(p,obj):
    path=ROOT/p
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix(path.suffix+'.tmp')
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
    tmp.replace(path)
def digest(b): return hashlib.sha256(b).hexdigest()
def clean(s): return html.unescape(re.sub(r'<[^>]*>',' ',str(s or ''))).strip()
def norm(s): return ' '.join(re.findall(r'[a-z0-9]+',unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower()))
def request(url,params=None,binary=False):
    key=digest(json.dumps([url,params],sort_keys=True).encode())
    f=cache/(key+'.json')
    if not binary and f.exists() and time.time()-f.stat().st_mtime<7*86400: return json.loads(f.read_text())
    for attempt in range(4):
        time.sleep(12.0)  # single worker, slower after repeated server backoff
        try:
            with session.get(url,params=params,timeout=(15,60),stream=binary) as res:
                if res.status_code in (429,503):
                    delay=res.headers.get('Retry-After','')
                    if delay.isdigit(): delay=int(delay)
                    else:
                        from email.utils import parsedate_to_datetime
                        from datetime import datetime,timezone
                        try: delay=max(0,(parsedate_to_datetime(delay)-datetime.now(timezone.utc)).total_seconds())
                        except Exception: delay=0
                    # Stop this run rather than ignore a long server-requested delay.
                    if delay>120: raise RatePause('Retry-After exceeds run budget',delay)
                    time.sleep(max(delay,5*2**attempt)); continue
                res.raise_for_status()
                if binary:
                    chunks=[]; size=0
                    for chunk in res.iter_content(65536):
                        size+=len(chunk)
                        if size>30_000_000: raise Hold('image exceeds 30MB source budget')
                        chunks.append(chunk)
                    return b''.join(chunks)
                data=res.json()
                if data.get('error',{}).get('code') in ('maxlag','ratelimited'):
                    delay=res.headers.get('Retry-After','5')
                    if delay.isdigit() and int(delay)>120: raise RatePause('Retry-After exceeds run budget',int(delay))
                    time.sleep(max(5*2**attempt,int(delay) if delay.isdigit() else 5)); continue
                if 'error' in data: raise Hold('API: '+str(data['error']))
                f.write_text(json.dumps(data)); return data
        except requests.RequestException as e:
            if getattr(e.response,'status_code',None) in (400,403,404): raise Temporary(str(e))
            if attempt==3: raise Temporary(str(e))
            time.sleep(5*2**attempt)
    raise RatePause('rate limit or maxlag retries exhausted')
def api(url,**p): return request(url,dict(format='json',formatversion=2,maxlag=5,**p))
def claims(e,k):
    return [c['mainsnak']['datavalue']['value'] for c in e.get('claims',{}).get(k,[]) if c.get('rank')!='deprecated' and 'datavalue' in c.get('mainsnak',{})]
def year(e,k):
    vals=claims(e,k)
    return int(vals[0]['time'][1:5]) if vals else None
def entity(q):
    if not re.fullmatch(r'Q[0-9]+',q or ''): raise Hold('invalid QID')
    if BATCH and q in BATCH.entities: return BATCH.entities[q]
    return api(WD,action='wbgetentities',ids=q,props='labels|aliases|claims|sitelinks',languages='en',sitefilter='enwiki')['entities'][q]
def page(title):
    if BATCH and key(title) in BATCH.pages: return BATCH.pages[key(title)]
    return api(WP,action='query',titles=title,redirects=1,prop='pageprops|pageimages',piprop='name',pilicense='free')['query']['pages'][0]
def inventory():
    people={}; bywiki={}; unresolved=[]; overlap=set()
    for f in ('legislators-historical.json','legislators-current.json'):
        for p in read('data/'+f):
            ids=p.get('id',{}); k=ids.get('bioguide')
            if not k: continue
            n=p['name']; name=n.get('official_full') or ' '.join(n.get(x,'') for x in ('first','middle','last','suffix')).strip()
            people[k]={'id':k,'name':name,'wiki':ids.get('wikipedia'),'qid':ids.get('wikidata'),'bioguide':k,'birth':(p.get('bio',{}).get('birthday') or '')[:4],'death':(p.get('bio',{}).get('deathday') or '')[:4],'aliases':[k],'terms':p.get('terms',[])}
            if any(t.get('end','')[:4]>='1900' and t.get('start','')[:4]<='2026' for t in p.get('terms',[])): overlap.add(k)
            if ids.get('wikipedia'): bywiki.setdefault(norm(ids['wikipedia']),set()).add(k)
    for p in read('data/historical-people.json')['people']+read('data/encounter-records.json').get('people',[])+read('data/world.json').get('seed',[]):
        k=p.get('id'); n=p.get('name')
        if not isinstance(k,str) or not n: continue
        matches=bywiki.get(norm(p.get('wiki')),set()) if p.get('wiki') else set()
        if k in people: continue
        if len(matches)==1:
            people[next(iter(matches))]['aliases'].append(k)
        else: people[k]={'id':k,'name':n,'wiki':p.get('wiki'),'aliases':[k],'terms':p.get('terms',[])}
    aliasmap={a:k for k,p in people.items() for a in p['aliases']}
    parts=read('data/dialogue-packs/i1-index.json')['parts']
    slots=0; cast_counts={}
    for part in parts:
        for scene in read('data/dialogue-packs/'+part)['scenes']:
            for cast in scene.get('cast',[]):
                slots+=1; k=cast.get('id')
                if k:
                    canonical=aliasmap.get(k,k)
                    cast_counts[canonical]=cast_counts.get(canonical,0)+1
                if k and k not in aliasmap:
                    if k not in people: people[k]={'id':k,'name':cast.get('name'),'aliases':[k]}
                elif not k: unresolved.append({'scene':scene['id'],'name':cast.get('name')})
    return people,overlap,slots,unresolved,cast_counts
OFFICES={'prez':{'Q11696'},'vp':{'Q11699'},'justice':{'Q11144','Q11147'},'chief':{'Q11147'}}
def official_office_match(p,e,title):
    # Require exact stored article and documented office with overlapping term.
    if not p.get('wiki') or norm(p['wiki'])!=norm(title): return False
    for t in p.get('terms',[]):
        allowed=OFFICES.get(t.get('type'),set())
        if not allowed or not str(t.get('source','')).startswith(('https://www.whitehouse.gov/','https://www.senate.gov/','https://www.supremecourt.gov/')): continue
        start=str(t.get('start',''))[:4]; end=str(t.get('end',''))[:4]
        if not start.isdigit() or not end.isdigit(): continue
        for c in e.get('claims',{}).get('P39',[]):
            if c.get('rank')=='deprecated' or c.get('mainsnak',{}).get('datavalue',{}).get('value',{}).get('id') not in allowed: continue
            qs=c.get('qualifiers',{})
            def y(key):
                try: return int(qs[key][0]['datavalue']['value']['time'][1:5])
                except (KeyError,IndexError,ValueError): return None
            a,z=y('P580'),y('P582')
            if a is not None and int(start)-1<=a<=int(end)+1 and (z is None or z>=int(start)-1): return True
    return False
def identity(p):
    q=p.get('qid'); wp=None
    if p.get('wiki'):
        wp=page(p['wiki']); props=wp.get('pageprops',{})
        if 'missing' not in wp and 'disambiguation' not in props:
            page_q=props.get('wikibase_item')
            if q and page_q and q!=page_q: raise Hold('stored Wikidata and Wikipedia QID disagree')
            q=q or page_q
    if not q:
        # Bioguide P1157 lookup, then exact Wikipedia title (not fuzzy auto-approval).
        if p.get('bioguide'):
            s=api(WD,action='query',list='search',srsearch='haswbstatement:P1157='+p['bioguide'],srnamespace=0,srlimit=5)
            hits=[x['title'] for x in s['query']['search'] if re.fullmatch(r'Q\d+',x['title'])]
            if len(hits)==1: q=hits[0]
        if not q:
            wp=page(p.get('wiki') or p['name']); props=wp.get('pageprops',{})
            if 'disambiguation' not in props: q=props.get('wikibase_item')
    if not q: raise Hold('no unambiguous Wikidata match')
    e=entity(q)
    if not any(x.get('id')=='Q5' for x in claims(e,'P31')): raise Hold('not a Wikidata human')
    names=[e.get('labels',{}).get('en',{}).get('value','')]+[x['value'] for x in e.get('aliases',{}).get('en',[])]
    title=e.get('sitelinks',{}).get('enwiki',{}).get('title')
    if title: names.append(re.sub(r' \([^)]*\)$','',title))
    for field,prop in [('birth','P569'),('death','P570')]:
        if p.get(field) and year(e,prop)!=int(p[field]): raise Hold(field+' mismatch or missing')
    if p.get('bioguide'):
        if p['bioguide'] not in claims(e,'P1157'): raise Hold('Bioguide P1157 mismatch')
    else:
        if norm(p['name']) not in [norm(n) for n in names] or not ((p.get('birth') and (p.get('death') or p.get('wiki'))) or official_office_match(p,e,title)):
            raise Hold('non-Bioguide match needs exact alias, birth year and death year or stored Wikipedia title')
        if not claims(e,'P106') and not claims(e,'P39'): raise Hold('occupation/office missing')
    return q,e,title
BAD=re.compile(r'\b(group|grave|tomb|statue|bust|monument|signature|autograph|document|cartoon|memorial|building|headstone|coin|stamp|plaque|family|with|and wife|and husband)\b',re.I)
def metadata(file):
    p=BATCH.files.get(filekey(file)) if BATCH else None
    if p is None:
        result=api(CM,action='query',titles=filekey(file),redirects=1,prop='imageinfo',iiprop='url|mime|size|extmetadata|sha1',iiurlwidth=768)
        p=result['query']['pages'][0]
    rows=p.get('imageinfo',[])
    if not rows: raise Hold('not a Commons image')
    i=rows[0]; m=i.get('extmetadata',{})
    val=lambda k:clean(m.get(k,{}).get('value',''))
    lic=val('LicenseShortName'); licurl=val('LicenseUrl'); author=val('Artist'); source=val('Credit')
    allowed=lic in ('Public domain','CC0','CC0 1.0') or bool(re.fullmatch(r'CC BY(?:-SA)? (?:1\.0|2\.0|2\.5|3\.0|4\.0)',lic))
    if not allowed or val('Restrictions') or val('NonFree') or (lic.startswith('CC') and not licurl) or (lic.startswith('CC BY') and not author):
        raise Hold('license or attribution not automatically cleared: '+lic)
    if lic.startswith('CC') and urlparse(licurl).hostname not in ('creativecommons.org','www.creativecommons.org'): raise Hold('unexpected license URL')
    if i.get('mime') not in ('image/jpeg','image/png','image/webp','image/tiff'): raise Hold('not a supported raster photo')
    if min(i['width'],i['height'])<120: raise Hold('source too small')
    desc=val('ImageDescription')
    if BAD.search(p['title'].replace('_',' ')): raise Hold('non-portrait filename signal')
    return i,dict(commons=i['descriptionurl'],original=i['url'],author=author,source=source,license=lic,licenseUrl=licurl,date=val('DateTimeOriginal'),description=desc,commonsSha1=i.get('sha1'),fileTitle=p['title'])
def collect(p,records):
    q,e,title=identity(p)
    candidates=[]
    if p.get('wiki'):
        wp=page(p['wiki']); props=wp.get('pageprops',{})
        if 'missing' not in wp and 'disambiguation' not in props and props.get('wikibase_item')==q and wp.get('pageimage'):
            candidates.append((wp['pageimage'],'Wikipedia PageImages'))
    candidates.extend((f,'P18') for f in claims(e,'P18'))
    # Exact, independently sourced official-photo lead for the priority subject.
    if p.get('bioguide')=='S001136':
        candidates.insert(0,('Portrait of W. Stuart Symington.jpg','NARA-confirmed Commons file'))
    if p.get('bioguide')=='M000851':
        candidates.insert(0,('Walter Mondale 1977 vice presidential portrait.jpg','Senate-sourced Commons file'))
    if title and not candidates:
        wp=page(title)
        if wp.get('pageprops',{}).get('wikibase_item')==q and wp.get('pageimage'): candidates.append((wp['pageimage'],'Wikipedia PageImages'))
    # Discover additional leads but never auto-publish a mere search hit.
    if not candidates:
        s=api(CM,action='query',list='search',srsearch='"'+p['name']+'" portrait',srnamespace=6,srlimit=5)
        raise Hold('no P18/PageImages; Commons leads: '+', '.join(x['title'] for x in s['query']['search']))
    notes=[]
    for file,method in sorted(dict(reversed(candidates)).items(),key=lambda pair: 0 if pair[1]=='Wikipedia PageImages' else 1 if pair[1]=='P18' else 2):
        try:
            i,m=metadata(file)
            # Association is source metadata, not facial recognition. Reject ambiguous descriptive evidence.
            tokens=norm(p['name']).split()
            surname=next((x for x in reversed(tokens) if x not in ('jr','sr','ii','iii','iv')), '')
            evidence=norm(m['fileTitle']+' '+m['description'])
            if not surname or surname not in evidence.split(): raise Hold('portrait description lacks surname')
            if BAD.search(m['fileTitle']) or method not in ('P18','Wikipedia PageImages','NARA-confirmed Commons file','Senate-sourced Commons file'): raise Hold('requires individual-portrait review')
            # A linked P18 is a candidate, not independent visual confirmation.
            # Commons sometimes returns thumbnail error or alternate URLs. Prefer only validated HTTPS upload URLs; fall back to the original when the thumbnail is unusable.
            def trusted(u):
                v=urlparse(u or '')
                return v.scheme=='https' and v.hostname=='upload.wikimedia.org' and v.path.startswith('/wikipedia/commons/')
            urls=[u for u in (i.get('thumburl'),i.get('url')) if trusted(u)]
            if not urls: raise Hold('unexpected download host: thumb='+str(urlparse(i.get('thumburl') or '').hostname)+', original='+str(urlparse(i.get('url') or '').hostname))
            url=urls[0]
            raw=request(url,binary=True)
            im=Image.open(io.BytesIO(raw)); im.verify()
            im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
            if min(im.size)<120: raise Hold('decoded source too small')
            im.thumbnail((768,768)); out=io.BytesIO(); im.save(out,format='WEBP',quality=85,method=6)
            b=out.getvalue()
            if len(b)>150000:
                out=io.BytesIO(); im.save(out,format='WEBP',quality=72,method=6); b=out.getvalue()
            if digest(b) in {v['sha256'] for v in records.values() if v.get('qid')!=q}: raise Hold('duplicate image across different QIDs')
            for v in records.values():
                if v.get('qid')==q and (ROOT/v['path']).is_file() and digest((ROOT/v['path']).read_bytes())==v['sha256']: return dict(v,aliases=sorted(set(v['aliases']+p['aliases'])))
            path='assets/p1-portraits/'+q+'-'+digest(b)[:16]+'.webp'
            (ROOT/path).parent.mkdir(parents=True,exist_ok=True)
            (ROOT/path).write_bytes(b)
            return dict(m,id=p['id'],name=p['name'],aliases=p['aliases'],bioguide=p.get('bioguide'),qid=q,wikipedia='https://en.wikipedia.org/wiki/'+quote(title.replace(' ','_')) if title else None,method=method,path=path,sha256=digest(b),downloadSha256=digest(raw),width=im.width,height=im.height,bytes=len(b),modified='EXIF orientation, proportional resize if needed, WebP encoding',status='metadata_matched_visual_review_pending')
        except Hold as ex: notes.append(str(ex))
    s=api(CM,action='query',list='search',srsearch='"'+p['name']+'" portrait',srnamespace=6,srlimit=5)
    raise Hold('; '.join(notes)+'; Commons leads: '+', '.join(x['title'] for x in s['query']['search']))
def main():
    global BATCH
    BATCH=Batch(api,WP,WD,CM)
    parser=argparse.ArgumentParser()
    parser.add_argument('--limit',type=int,default=20)
    parser.add_argument('--expand',action='store_true')
    parser.add_argument('--retry-improved',action='store_true')
    parser.add_argument('--exclude-campaign',action='store_true')
    args=parser.parse_args()
    people,overlap,slots,unresolved,cast_counts=inventory()
    local=read('data/portraits.json')
    valid={x['id'] for x in local if (ROOT/x['file']).is_file()}
    manifest='data/p1-portraits.json'; report='docs/P1-AUTO-R2-REPORT.json'
    records=read(manifest) if (ROOT/manifest).exists() else {}
    previous=read(report).get('results',{}) if (ROOT/report).exists() else {}
    batch=read('docs/P1-PORTRAIT-RECOVERY-R1.json')['batch']['entries']
    queue=[]
    for x in batch:
        k=x.get('bioguide') or x.get('historicalId')
        if not k: continue
        p=dict(people.get(k,{'id':k,'aliases':[k]}))
        p['name']=x['name']; p['bioguide']=x.get('bioguide')
        ys=re.findall(r'\d{4}',x['years'])
        if ys: p['birth']=ys[0]
        if len(ys)>1: p['death']=ys[1]
        p['aliases']=sorted(set(p['aliases']+[a for a in (x.get('historicalId'),x.get('bioguide')) if a]))
        queue.append(p)
    if args.expand:
        def priority(p):
            roles={t.get('type') for t in p.get('terms',[])}
            rank=0 if roles&{'prez','vp','candidate','chief','justice','cabinet'} else 1 if cast_counts.get(p['id']) else 2 if 'sen' in roles else 3
            return (rank,-cast_counts.get(p['id'],0),p['id'])
        queue+=sorted((p for k,p in people.items() if (k in overlap or k in cast_counts or k.startswith('hist:')) and not any(a in valid for a in p['aliases'])),key=priority)
    seen=set(); queue=[p for p in queue if not (p['id'] in seen or seen.add(p['id']))]
    attempted=0; pause_until=None; run_ids=[]
    excluded=set()
    if args.exclude_campaign and (ROOT/'docs/P1-CAMPAIGN-R5.json').exists():
        excluded={i for c in read('docs/P1-CAMPAIGN-R5.json').get('chunks',[]) for i in c.get('attemptedIds',[])}
    def checkpoint():
        save(manifest,records)
        save(report,{'scope':'static roster IDs; dynamic governors and cross-source unresolved aliases excluded from unique-person claims','rosterIds':len(people),'congress1900to2026':len(overlap),'indexedLocalCongress':len(valid&overlap),'castSlots':slots,'unresolvedCast':unresolved,'existingIndexMissingFiles':len(local)-len(valid),'newDownloads':len(records),'thisRunAttempted':attempted,'thisRunIds':run_ids,'batchStats':BATCH.stats,'pauseUntil':pause_until,'queueSize':len(queue),'remainingEligibleAfterChunk':max(0,eligible_total-attempted),'results':previous,'browserVerified':None,'manualRequests':0})
    eligible=[]
    for p in queue:
        k=p['id']
        if k in excluded: continue
        if any(a in valid for a in p['aliases']) or any(k in v['aliases'] and (ROOT/v['path']).is_file() and digest((ROOT/v['path']).read_bytes())==v['sha256'] for v in records.values()): continue
        old=previous.get(k,{})
        retry=args.retry_improved and (k=='M000851' or old.get('status')=='temporary_error' or ('non-Bioguide match needs' in old.get('reason','') and any(t.get('type') in OFFICES for t in p.get('terms',[]))))
        if args.expand and old.get('status') in ('review_required','temporary_error','technical_error') and not retry: continue
        eligible.append(p)
    eligible_total=len(eligible)
    eligible=eligible[:args.limit]
    # Prefetch metadata for bounded groups; checkpoint without counting unattempted IDs if the server pauses.
    for offset in range(0,len(eligible),50):
        group=eligible[offset:offset+50]
        try: BATCH.prefetch(group)
        except RatePause as ex:
            pause_until=ex.until; checkpoint(); print('Batch metadata backoff:',ex,flush=True); break
        except (Hold,Temporary) as ex:
            print('Batch metadata unavailable; using conservative individual fallback:',ex,flush=True)
        for p in group:
            k=p['id']; attempted+=1; run_ids.append(k)
            try:
                v=collect(p,records); records[v['qid']]=v
                previous[k]={'name':p['name'],'status':v['status'],'qid':v['qid'],'path':v['path']}
            except (Hold,Temporary) as ex:
                if isinstance(ex,RatePause): pause_until=ex.until
                previous[k]={'name':p['name'],'status':'temporary_error' if isinstance(ex,Temporary) else 'review_required','reason':str(ex)}
            except Exception as ex:
                previous[k]={'name':p['name'],'status':'technical_error','reason':repr(ex)}
            checkpoint()
            print(k,previous[k],flush=True)
            if pause_until is not None:
                print('Stopping batch on server-requested backoff; resume in later run',flush=True)
                break
        if pause_until is not None: break
    checkpoint()
if __name__=='__main__': main()
