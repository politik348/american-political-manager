import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from p1_wikipedia_batch import Batch,mapped_pages
class BatchTest(unittest.TestCase):
    def test_redirect(self):
        q={'normalized':[{'from':'Jane_Doe','to':'Jane Doe'}],'redirects':[{'from':'Jane Doe','to':'Jane Doe (politician)'}],'pages':[{'title':'Jane Doe (politician)','pageimage':'J.jpg'}]}
        self.assertEqual(mapped_pages(q,['Jane_Doe'])['Jane Doe']['pageimage'],'J.jpg')
        self.assertNotIn('Other',mapped_pages(q,['Other']))
    def test_wikipedia_only_shared_files(self):
        calls=[]
        def api(host,**p):
            self.assertEqual(host,'wp')
            calls.append(p)
            ts=p['titles'].split('|')
            if p['prop']=='pageprops|pageimages':
                return {'query':{'pages':[{'title':t,'pageprops':{'wikibase_item':'Q'+t[1:]},'pageimage':t+'.jpg'} for t in ts]}}
            return {'query':{'pages':[{'title':t,'missing':True,'imagerepository':'shared','imageinfo':[{'url':'fixture'}]} for t in ts]}}
        b=Batch(api,'wp')
        people=[{'wiki':'P'+str(i)} for i in range(1,51)]
        b.prefetch(people)
        self.assertEqual(b.stats,{'wikipediaPageCalls':1,'wikipediaFileCalls':5,'wikidataCalls':0,'commonsApiCalls':0})
        self.assertEqual(len(b.files),50)
        b.prefetch(people)
        self.assertEqual(len(calls),6)
    def test_backoff(self):
        def api(*a,**k): raise RuntimeError('server pause')
        with self.assertRaisesRegex(RuntimeError,'server pause'): Batch(api,'wp').prefetch([{'wiki':'P1'}])
if __name__=='__main__': unittest.main()
