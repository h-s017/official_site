"""Sequential lab measurements. Saves complete compressed Lighthouse JSON + summary."""
import argparse, gzip, json, os, subprocess, tempfile
from pathlib import Path
from datetime import datetime, timezone
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--label',required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--lighthouse',required=True);p.add_argument('--pages',default='home,courses,overture-series,overture,kpia,helori,practice,incubation,business,product-development,journal,news,contact,booking');a=p.parse_args()
pages={'home':'/','courses':'/courses/','overture-series':'/overture-series/','overture':'/overture/','kpia':'/KPIA/','helori':'/helori/','practice':'/practice/','incubation':'/incubation/','business':'/business/','product-development':'/product-development/','journal':'/journal/','news':'/news/','contact':'/visit.html','booking':'https://reservation.hanascent.com/'}
a.out.mkdir(exist_ok=True,parents=True);summary=[]
for name in a.pages.split(','):
 url=pages[name] if pages[name].startswith('https://') else a.base+pages[name]
 for mode in ['mobile','desktop'] if name=='home' else ['mobile']:
  target=a.out/f'{a.label}-{name}-{mode}.json.gz'
  if target.exists(): raise SystemExit('Refusing to overwrite '+str(target))
  with tempfile.TemporaryDirectory(prefix='hana-lh-') as d:
   raw=Path(d)/'report.json'
   cmd=['node',a.lighthouse,url,'--output=json','--output-path='+str(raw),'--only-categories=performance,accessibility','--quiet','--chrome-flags=--headless --no-sandbox --proxy-server='+os.environ['HTTPS_PROXY']+' --proxy-bypass-list=127.0.0.1;localhost','--max-wait-for-load=45000']
   if mode=='desktop':cmd+=['--preset=desktop']
   env=dict(os.environ,CHROME_PATH='/usr/bin/chromium')
   try:
    proc=subprocess.run(cmd,env=env,capture_output=True,text=True,timeout=180)
    report=json.loads(raw.read_text()) if raw.exists() else {}
    with gzip.open(target,'wt') as f:json.dump(report,f)
    summary.append({'page':name,'mode':mode,'url':url,'returncode':proc.returncode,'stderr':proc.stderr[-1000:],'version':report.get('lighthouseVersion'),'fetchTime':report.get('fetchTime'),'runtimeError':report.get('runtimeError'),'scores':{k:v.get('score') for k,v in report.get('categories',{}).items()},'metrics':{k:{'value':report.get('audits',{}).get(k,{}).get('numericValue'),'display':report.get('audits',{}).get(k,{}).get('displayValue')} for k in ['largest-contentful-paint','total-blocking-time','cumulative-layout-shift','first-contentful-paint','speed-index']},'throttling':report.get('configSettings',{}).get('throttling'),'report':target.name})
   except Exception as e:summary.append({'page':name,'mode':mode,'url':url,'error':str(e)})
  (a.out/f'{a.label}-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
  print(name,mode,summary[-1].get('scores',{}),flush=True)
