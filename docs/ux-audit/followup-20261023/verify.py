"""Final read-only viewport, intro and asset checks. No booking/payment routes."""
import argparse,functools,http.server,json,os,subprocess,threading
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--base');parser.add_argument('--label',default='after');args=parser.parse_args()
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 base=args.base or 'http://127.0.0.1:'+str(server.server_address[1])
 subprocess.run(['python',str(OUT/'capture_ui.py'),'--base',base,'--label',args.label,'--out',str(OUT),'--axe','/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js','--pages','home,practice,product-development,kpia,helori,overture'],cwd=ROOT,check=True)
 rows=json.loads((OUT/'results'/(args.label+'-matrix.json')).read_text())['rows']
 assert len(rows)==24
 for row in rows:
  assert row['capture']=='complete' and row['status']==200 and not row['layout']['overflow'] and not row['axe']['violations'] and not row['errors'],(row['page'],row['viewport'])
 print('24/24 stable captures: no axe violation, root overflow or JS pageerror',flush=True)
 env=dict(os.environ,HANA_INTRO_BASE=base,HANA_INTRO_OUT=str(OUT/(args.label+'-intro')))
 subprocess.run(['python','docs/ux-audit/restored-intro/check.py'],cwd=ROOT,env=env,check=True)
 if not args.base:subprocess.run(['python',str(OUT/'loading_checks.py')],cwd=ROOT,check=True)
finally:server.shutdown()
