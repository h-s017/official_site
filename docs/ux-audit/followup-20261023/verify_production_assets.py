"""Read-only hash verification of released and deliberately unchanged files."""
import datetime,gzip,hashlib,json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/ux-audit/followup-20261023'
files=json.loads((OUT/'product-manifest.json').read_text())
for row in json.loads((OUT/'scope-preservation.json').read_text()):files[row['file']]={'sha256':row['sha256']}
rows=[]
for name,expected in files.items():
 url='https://hanascent.com/'+name+'?audit=83e7498'
 if name=='index.html':url='https://hanascent.com/?audit=83e7498'
 request=urllib.request.Request(url,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'})
 with urllib.request.urlopen(request,timeout=40) as r:
  data=r.read()
  if r.headers.get('Content-Encoding')=='gzip':data=gzip.decompress(data)
  actual=hashlib.sha256(data).hexdigest();row={'file':name,'url':url,'status':r.status,'sha256':actual,'expected':expected['sha256'],'match':actual==expected['sha256']};rows.append(row);print(name,'MATCH' if row['match'] else 'MISMATCH',flush=True)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'product_commit':'83e7498f8df3cf63055bcb8cf706718a21d09766','rows':rows}
(OUT/'production-assets.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));assert len(rows)==14 and all(r['match'] for r in rows)
