"""Offline inventory; results are source evidence, never browser/a11y certification."""
import hashlib, json, re
from html.parser import HTMLParser
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/ux-audit/results'
PAGES = ['index.html','courses/index.html','overture-series/index.html','overture/index.html','accord-etude/index.html','KPIA/index.html','helori/index.html','practice/index.html','incubation/index.html','business/index.html','product-development/index.html','journal/index.html','news/index.html','visit.html','business/inquiry/index.html','pif/inquiry/index.html','scent-study-room/index.html','course-info/index.html']
class Inventory(HTMLParser):
 def __init__(self):
  super().__init__(); self.h1=0; self.links=[]; self.images=[]; self.redirects=[]
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if tag=='h1': self.h1+=1
  if tag=='a' and a.get('href'): self.links.append(a['href'])
  if tag=='img': self.images.append(a)
  if tag=='meta' and a.get('http-equiv','').lower()=='refresh': self.redirects.append(a.get('content'))
manifest=json.loads((OUT/'source-manifest.json').read_text())
files={x['path']:x for x in manifest['files']}
rows=[]
for name in PAGES:
 raw=(ROOT/name).read_bytes(); text=raw.decode(); parser=Inventory(); parser.feed(text)
 # apply_patch's transport may add a final newline; report this, never silently claim byte identity.
 sha=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
 rows.append({'file':name,'git_blob_sha':sha,'matches_remote_blob':sha==files[name]['sha'],'h1_count':parser.h1,'links':parser.links,'images':parser.images,'meta_refresh':parser.redirects,'literal_prices':re.findall(r'NT\$[\d,]+',text),'duration_mentions':re.findall(r'.{0,18}\d+\s*小時.{0,18}',text)})
OUT.mkdir(exist_ok=True)
(OUT/'static-inventory.json').write_text(json.dumps({'kind':'source-only','pages':rows},ensure_ascii=False,indent=2))
print(f'Inventoried {len(rows)} source pages. Browser checks: NOT RUN.')
