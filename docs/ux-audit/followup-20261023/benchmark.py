"""Three cold lab samples on the restored-intro baseline and final branch; no payment."""
from pathlib import Path
import os,sys
ROOT=Path(__file__).resolve().parents[3]
os.environ['HANA_BASELINE_DIR']=os.environ.get('HANA_BASELINE_DIR',str(ROOT.parent/'hana-followup-baseline'))
os.environ['HANA_BENCHMARK_DIR']='../followup-20261023/lighthouse'
p=ROOT/'docs/ux-audit/phase-2/benchmark.py';source=p.read_text();scope={'__file__':str(p)};exec(source[:source.index('try:\n if os.environ')],scope)
phase=sys.argv[1]
assert phase in ['before','after']
try:
 for sample in [1,2,3]:
  for name in ['home','overture']:scope['run'](phase,name,sample)
finally:
 for server in scope['servers']:server.shutdown()
 import shutil
 shutil.copy(scope['OUT']/'summary.json',scope['OUT']/(phase+'-summary.json'))
