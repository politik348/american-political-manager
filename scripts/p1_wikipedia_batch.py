"""Wikipedia-first batch helpers. Exact title mapping, including API redirects."""
import re

def key(s):
    return str(s or '').replace('_',' ').strip()

def mapped_pages(query,titles):
    redirects={key(x['from']):key(x['to']) for field in ('normalized','redirects') for x in query.get(field,[])}
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
    def __init__(self,api,wp,wd,cm):
        self.api=api; self.wp=wp; self.wd=wd; self.cm=cm
        self.pages={}; self.entities={}; self.files={}
        self.stats={'wikipediaBatchCalls':0,'wikidataBatchCalls':0,'commonsBatchCalls':0}
    def prefetch(self,people):
        titles=[key(p['wiki']) for p in people if p.get('wiki') and '|' not in p['wiki']]
        for ts in groups([t for t in titles if t not in self.pages],50):
            result=self.api(self.wp,action='query',titles='|'.join(ts),redirects=1,prop='pageprops|pageimages',piprop='name',pilicense='free',pilimit=50)
            self.stats['wikipediaBatchCalls']+=1
            self.pages.update(mapped_pages(result.get('query',{}),ts))
        qs=[]
        for p in people:
            page=self.pages.get(key(p.get('wiki')),{})
            q=page.get('pageprops',{}).get('wikibase_item') or p.get('qid')
            if re.fullmatch(r'Q\d+',str(q or '')): qs.append(q)
        for ids in groups([q for q in qs if q not in self.entities],50):
            result=self.api(self.wd,action='wbgetentities',ids='|'.join(ids),props='labels|aliases|claims|sitelinks',languages='en',sitefilter='enwiki')
            self.stats['wikidataBatchCalls']+=1
            self.entities.update({q:e for q,e in result.get('entities',{}).items() if 'missing' not in e})
        files=[]
        for p in people:
            page=self.pages.get(key(p.get('wiki')),{})
            if 'missing' not in page and 'disambiguation' not in page.get('pageprops',{}) and page.get('pageimage'):
                files.append(filekey(page['pageimage']))
        # extmetadata and thumbnail transformations are relatively expensive; use at most 10 files.
        for fs in groups([f for f in files if f not in self.files],10):
            params=dict(action='query',titles='|'.join(fs),redirects=1,prop='imageinfo',iiprop='url|mime|size|extmetadata|sha1',iiurlwidth=768,iilimit=1)
            cont={}; combined={}
            for _ in range(10):
                result=self.api(self.cm,**params,**cont)
                self.stats['commonsBatchCalls']+=1
                for k,p in mapped_pages(result.get('query',{}),fs).items():
                    if p.get('imageinfo') or 'missing' in p: combined[k]=p
                cont=result.get('continue',{})
                if not cont: break
            self.files.update(combined)
