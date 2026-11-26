"""Wikipedia-first batch helpers. Exact title mapping, including API redirects."""
import re

def key(s):
    return str(s or '').replace('_',' ').strip()

def mapped_pages(query,titles):
    redirects={key(x['from']):key(x['to']) for field in ('normalized','redirects') for x in query.get(field,[]) if key(x['from'])!=key(x['to'])}
    pages={key(p['title']):p for p in query.get('pages',[]) if p.get('title')}
    out={}
    for t in titles:
        k=key(t); seen=set()
        while k in redirects and k not in seen:
            seen.add(k); k=redirects[k]
        if k in pages and k not in redirects: out[key(t)]=pages[k]
    return out

def groups(seq,size):
    seq=list(dict.fromkeys(seq))
    for i in range(0,len(seq),size): yield seq[i:i+size]

def filekey(s):
    s=key(s)
    return s if s.startswith('File:') else 'File:'+s

class Batch:
    def __init__(self,api,wp):
        self.api=api; self.wp=wp
        self.pages={}; self.files={}
        self.stats={'wikipediaPageCalls':0,'wikipediaFileCalls':0,'wikidataCalls':0,'commonsApiCalls':0}
    def prefetch(self,people):
        titles=[key(p.get('wiki') or p.get('name')) for p in people if (p.get('wiki') or p.get('name')) and '|' not in (p.get('wiki') or p.get('name'))]
        for ts in groups([t for t in titles if t not in self.pages],50):
            result=self.api(self.wp,action='query',titles='|'.join(ts),redirects=1,prop='pageprops|pageimages',piprop='name',pilicense='free',pilimit=50)
            self.stats['wikipediaPageCalls']+=1
            self.pages.update(mapped_pages(result.get('query',{}),ts))
        files=[]
        for p in people:
            page=self.pages.get(key(p.get('wiki') or p.get('name')),{})
            if 'missing' not in page and 'disambiguation' not in page.get('pageprops',{}) and page.get('pageimage'):
                files.append(filekey(page['pageimage']))
        for fs in groups([f for f in files if f not in self.files],10):
            params=dict(action='query',titles='|'.join(fs),redirects=1,prop='imageinfo',iiprop='url|mime|size|extmetadata|sha1',iiurlwidth=800,iilimit=1)
            cont={}; combined={}
            for _ in range(10):
                result=self.api(self.wp,**params,**cont)
                self.stats['wikipediaFileCalls']+=1
                for k,p in mapped_pages(result.get('query',{}),fs).items():
                    # Shared repository files can be marked missing on enwiki while imageinfo is present.
                    if p.get('imageinfo'): combined[k]=p
                cont=result.get('continue',{})
                if not cont: break
            self.files.update(combined)
