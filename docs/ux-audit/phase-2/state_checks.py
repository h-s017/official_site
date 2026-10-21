"""Read-only CMS fixtures: delayed refresh, empty data, SDK failure and no-JS fallback.
Never visits reservation URLs or invokes payment/form endpoints.
"""
import asyncio,copy,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/ux-audit/phase-2';posts=json.loads((OUT/'fixtures/published-posts.json').read_text());news=json.loads((OUT/'fixtures/published-announcements.json').read_text());rows=[]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
async def main():
 servers=[]
 for folder in [os.environ.get('HANA_BASELINE_DIR',str(ROOT.parent/'hana-phase2-baseline')),str(ROOT)]:
  s=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=folder));threading.Thread(target=s.serve_forever,daemon=True).start();servers.append(s)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  sem=asyncio.Semaphore(3)
  async def run(label,server,path,mode,timezone='UTC'):
   async with sem:
    row={'label':label,'path':path,'mode':mode,'timezone':timezone,'viewport':[390,844]};ctx=await browser.new_context(viewport={'width':390,'height':844},java_script_enabled=mode!='no-js',timezone_id=timezone);page=await ctx.new_page();page.set_default_timeout(15000);gate=asyncio.Event();finished=asyncio.Event();hits=0
    wanted='announcements' if path=='/news/' else 'posts'
    data=copy.deepcopy(news if wanted=='announcements' else posts)
    if mode=='updated':data[0]['title']='MOCK UPDATE — '+data[0]['title']
    if mode=='empty':data=[]
    async def route(req):
     nonlocal hits
     url=req.request.url
     if req.request.method not in ['GET','HEAD','OPTIONS']:await req.abort();return
     if '/rest/v1/' in url:
      table=url.split('/rest/v1/')[1].split('?')[0]
      if table==wanted:
       hits+=1;await gate.wait();await req.fulfill(status=200,content_type='application/json',body=json.dumps(data));finished.set();return
      body={'show_blog':True,'show_announcements':True} if table=='site_settings' else news if table=='announcements' else []
      await req.fulfill(status=200,content_type='application/json',body=json.dumps(body));return
     if mode=='sdk-failure' and 'supabase-js@2' in url:await req.abort();return
     await req.continue_()
    await ctx.route('**/*',route)
    selector='.news-archive-row' if wanted=='announcements' else '.archive-item' if path=='/journal/all/' else '.journal-latest-main'
    try:
     await page.goto('http://127.0.0.1:'+str(server.server_address[1])+path,wait_until='domcontentloaded',timeout=45000)
     await page.evaluate('()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,7000))])');await page.wait_for_timeout(300)
     row['initial_cards']=await page.locator(selector).count()
     if label=='after':assert row['initial_cards']>0,'No static published fallback'
     if mode in ['matching','updated','empty']:
      await page.evaluate("()=>{window.refreshCLS=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.refreshCLS+=e.value})).observe({type:'layout-shift'});window.initialHeight=document.querySelector('main').getBoundingClientRect().height;window.initialLink=document.querySelector('main h3 a,main .news-archive-row a');window.initialLink?.focus();}")
      gate.set();await asyncio.wait_for(finished.wait(),20);await page.wait_for_timeout(900)
      row['after_cards']=await page.locator(selector).count();row['posts_or_news_requests']=hits
      row.update(await page.evaluate("()=>({refreshCLS:window.refreshCLS,heightBefore:window.initialHeight,heightAfter:document.querySelector('main').getBoundingClientRect().height,focusPreserved:window.initialLink===document.activeElement})"))
      if label=='after' and mode=='matching':assert row['refreshCLS']<=.01 and row['focusPreserved'],'Matching refresh shifted/replaced content'
      if label=='after' and mode=='updated':assert await page.get_by_text('MOCK UPDATE',exact=False).count()>0,'Fresh content did not render'
      if label=='after' and mode=='empty':assert row['after_cards']==0,'Empty response left stale published content'
     else:gate.set()
     row['result']='pass'
    except Exception as e:row['result']='FAIL';row['error']=str(e)
    finally:
     gate.set();rows.append(row);(OUT/'state-checks.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));await ctx.close();print(label,path,mode,row['result'],flush=True)
  tasks=[]
  for path in ['/journal/','/journal/all/','/news/']:
   tasks.append(run('before',servers[0],path,'matching'))
   for mode in ['matching','updated','empty','sdk-failure','no-js']:tasks.append(run('after',servers[1],path,mode))
  for path in ['/journal/','/journal/all/','/news/']:tasks.append(run('after',servers[1],path,'matching','Asia/Taipei'))
  await asyncio.gather(*tasks);await browser.close()
 for s in servers:s.shutdown()
asyncio.run(main())
raise SystemExit(1 if any(r['result']!='pass' for r in rows) else 0)
