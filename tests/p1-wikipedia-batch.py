import unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from p1_wikipedia_batch import Batch,mapped_pages
class BatchTest(unittest.TestCase):
    def test_exact_redirect_and_no_guess(self):
        q={'normalized':[{'from':'John_Doe','to':'John Doe'}],'redirects':[{'from':'John Doe','to':'John Doe (politician)'}],'pages':[{'title':'John Doe (politician)','pageimage':'Portrait.jpg'}]}
        self.assertEqual(mapped_pages(q,['John_Doe','John Doe','Jane'])['John Doe']['pageimage'],'Portrait.jpg')
        self.assertNotIn('Jane',mapped_pages(q,['Jane']))
    def test_normalized_only(self):
        q={'normalized':[{'from':'Jane_Doe','to':'Jane Doe'}],'pages':[{'title':'Jane Doe','pageimage':'J.jpg'}]}
        self.assertEqual(mapped_pages(q,['Jane_Doe'])['Jane Doe']['pageimage'],'J.jpg')
    def test_batch_sizes_cache_and_disambiguation(self):
        calls=[]
        def api(host,**p):
            calls.append((host,p))
            if host=='wp':
                ts=p['titles'].split('|')
                return {'query':{'pages':[{'title':t,'pageprops':{'wikibase_item':'Q'+t[1:]},'pageimage':t+'.jpg'} for t in ts]}}
            if host=='wd': return {'entities':{q:{'id':q} for q in p['ids'].split('|')}}
            return {'query':{'pages':[{'title':t,'imageinfo':[{'url':'fixture'}]} for t in p['titles'].split('|')]}}
        b=Batch(api,'wp','wd','cm')
        people=[{'wiki':'P'+str(i)} for i in range(1,51)]
        b.prefetch(people)
        self.assertEqual(b.stats,{'wikipediaBatchCalls':1,'wikidataBatchCalls':1,'commonsBatchCalls':5})
        self.assertEqual(len(b.files),50)
        b.prefetch(people)
        self.assertEqual(len(calls),7)
    def test_backoff_propagates(self):
        def api(*a,**k): raise RuntimeError('server pause')
        with self.assertRaisesRegex(RuntimeError,'server pause'): Batch(api,'wp','wd','cm').prefetch([{'wiki':'P1'}])
if __name__=='__main__': unittest.main()
