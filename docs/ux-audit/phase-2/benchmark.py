"""Cold-browser sequential Lighthouse samples on matched gzip-enabled fixture servers.
No reservation, form or payment route is visited.
"""
import functools,gzip,http.server,json,os,subprocess,tempfile,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/('docs/ux-audit/phase-2/'+os.environ.get('HANA_BENCHMARK_DIR','benchmarks-final'));OUT.mkdir(exist_ok=True)
PAGES={'home':'/','courses':'/courses/','journal':'/journal/','news':'/news/','journal-all':'/journal/all/','overture-series':'/overture-series/','overture':'/overture/','kpia':'/KPIA/','helori':'/helori/','practice':'/practice/','incubation':'/incubation/','business':'/business/','product-development':'/product-development/','contact':'/visit.html'}
class Static(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def send_head(self):
  path=Path(self.translate_path(self.path))
  if path.is_dir():path=path/'index.html'
  if path.is_file() and path.suffix in ['.html','.css','.js','.json','.svg'] and 'gzip' in self.headers.get('Accept-Encoding',''):
   import io
   data=gzip.compress(path.read_bytes(),mtime=0)
   self.send_response(200);self.send_header('Content-Type',self.guess_type(str(path)));self.send_header('Content-Encoding','gzip');self.send_header('Vary','Accept-Encoding');self.send_header('Content-Length',str(len(data)));self.end_headers();return io.BytesIO(data)
  return super().send_head()
servers=[]
for folder in [os.environ.get('HANA_BASELINE_DIR',str(ROOT.parent/'hana-phase2-baseline')),str(ROOT)]:
 s=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Static,directory=folder));threading.Thread(target=s.serve_forever,daemon=True).start();servers.append(s)
urls=['http://127.0.0.1:'+str(s.server_address[1]) for s in servers];rows=[]
def run(phase,name,sample,mode='mobile'):
 target=OUT/f'{phase}-{name}-{mode}-{sample}.json.gz'
 if target.exists():raise RuntimeError('Refusing to overwrite '+str(target))
 with tempfile.TemporaryDirectory(prefix='hana-lh2-') as d:
  raw=Path(d)/'report.json';url=urls[0 if phase=='before' else 1]+PAGES[name]
  cmd=['node','/tmp/hana-audit-tools/node_modules/lighthouse/cli/index.js',url,'--output=json','--output-path='+str(raw),'--only-categories=performance,accessibility','--quiet','--chrome-flags=--headless --no-sandbox --proxy-server='+os.environ['HTTPS_PROXY']+' --proxy-bypass-list=127.0.0.1;localhost','--max-wait-for-load=45000']
  if mode=='desktop':cmd+=['--preset=desktop']
  proc=subprocess.run(cmd,env=dict(os.environ,CHROME_PATH='/usr/bin/chromium'),capture_output=True,text=True,timeout=180)
  data=json.loads(raw.read_text()) if raw.exists() else {}
  with gzip.open(target,'wt') as f:json.dump(data,f)
  row={'phase':phase,'page':name,'sample':sample,'mode':mode,'code':proc.returncode,'runtimeError':data.get('runtimeError'),'version':data.get('lighthouseVersion'),'scores':{k:v.get('score') for k,v in data.get('categories',{}).items()},'metrics':{k:data.get('audits',{}).get(k,{}).get('numericValue') for k in ['largest-contentful-paint','first-contentful-paint','cumulative-layout-shift','total-blocking-time']},'warnings':data.get('runWarnings'),'artifact':target.name}
  rows.append(row);(OUT/'summary.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(phase,name,mode,sample,row['scores'],row['metrics'],flush=True)
  if proc.returncode:print(proc.stderr[-700:],flush=True)
try:
 if os.environ.get('HANA_AFTER_ONLY'):
  for sample in [1,2,3]:
   for name in ['home','courses','journal','news']:run('after',name,sample)
  for name in ['home','journal']:run('after',name,1,'desktop')
  for name in PAGES:
   if name not in ['home','courses','journal','news']:run('after',name,1)
 elif os.environ.get('HANA_PILOT'):
  for name in ['home','courses','journal','news']:run('after',name,1)
 else:
  for sample in [1,2,3]:
   for name in ['home','courses','journal','news']:
    for phase in ['before','after'] if sample%2 else ['after','before']:run(phase,name,sample)
  for name in ['home','journal']:
   for phase in ['before','after']:run(phase,name,1,'desktop')
  for name in PAGES:
   if name not in ['home','courses','journal','news']:run('after',name,1)
finally:
 for s in servers:s.shutdown()
