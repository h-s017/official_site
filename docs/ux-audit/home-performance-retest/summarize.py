"""Rebuild median/range summaries from the saved Lighthouse reports."""
import gzip,json,statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parent
GROUPS={'first-session-mobile':'current-*-home-mobile.json.gz','first-session-desktop':'current-*-home-desktop.json.gz','seen-session-cold-mobile':'returning-*-home-mobile.json.gz'}
metrics=['largest-contentful-paint','total-blocking-time','cumulative-layout-shift','first-contentful-paint','speed-index']
def stats(xs):return {'median':statistics.median(xs),'min':min(xs),'max':max(xs),'runs':xs}
result={}
for group,pattern in GROUPS.items():
 rows=[]
 for file in sorted(ROOT.glob(pattern)):
  r=json.loads(gzip.open(file,'rt').read());assert not r.get('runtimeError'),r.get('runtimeError')
  req=r['audits']['network-requests']['details']['items'];lcp=r['audits']['largest-contentful-paint-element'].get('details',{}).get('items',[])
  node=lcp[0].get('items',[{}])[0].get('node',{}) if lcp else {}
  rows.append({'report':file.name,'fetchTime':r['fetchTime'],'scores':{k:round(v['score']*100) for k,v in r['categories'].items()},'metrics':{k:r['audits'][k]['numericValue'] for k in metrics},'lcpElement':node.get('selector'),'lcpSnippet':node.get('snippet'),'lcpPhases':lcp[1].get('items',[]) if len(lcp)>1 else [],'warnings':r.get('runWarnings'),'screenEmulation':r['configSettings']['screenEmulation'],'throttling':r['configSettings']['throttling'],'requests':len(req),'transferredBytes':sum(x.get('transferSize',0) for x in req),'fontCount':sum(x.get('resourceType')=='Font' for x in req),'fontBytes':sum(x.get('transferSize',0) for x in req if x.get('resourceType')=='Font'),'topResources':sorted([{'url':x.get('url'),'bytes':x.get('transferSize',0),'type':x.get('resourceType')} for x in req],key=lambda x:x['bytes'],reverse=True)[:12]})
 assert len(rows)==3,(group,len(rows))
 result[group]={'samples':3,'scores':{k:stats([x['scores'][k] for x in rows]) for k in ['performance','accessibility']},'metrics':{k:stats([x['metrics'][k] for x in rows]) for k in metrics},'resources':{k:stats([x[k] for x in rows]) for k in ['requests','transferredBytes','fontCount','fontBytes']},'runs':rows}
(ROOT/'summary.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({k:{'performance':v['scores']['performance'],'LCP_ms':v['metrics']['largest-contentful-paint'],'resources':v['resources']} for k,v in result.items()},ensure_ascii=False,indent=2))
