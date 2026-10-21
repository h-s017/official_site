"""Read-only frontend regressions; public CMS responses mocked, no submissions/payment."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/ux-audit/phase-2'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base='http://127.0.0.1:'+str(server.server_address[1]);rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for value,kind in [('/assets/about-hana-900.webp','custom'),('https://hanascent.com/assets/首頁HERO.png','original-default')]:
   ctx=await browser.new_context(viewport={'width':390,'height':844});page=await ctx.new_page()
   async def route(r):
    if r.request.method not in ['GET','HEAD','OPTIONS']:await r.abort();return
    if '/rest/v1/' in r.request.url:
     body={'hero_image_url':value} if '/site_settings?' in r.request.url else []
     await r.fulfill(status=200,content_type='application/json',body=json.dumps(body));return
    await r.continue_()
   await ctx.route('**/*',route)
   await page.goto(base+'/',wait_until='networkidle',timeout=60000)
   image=page.locator('[data-hana-hero-image]');src=await image.get_attribute('src');srcset=await image.get_attribute('srcset')
   assert (src==value and not srcset) if kind=='custom' else (src.endswith('/assets/home-hero-1920.webp') and '480w' in srcset)
   rows.append({'check':'CMS hero '+kind,'result':'pass','src':src,'srcset':srcset});await ctx.close()
  for w,h in [(390,844),(320,844),(768,1024),(1440,900)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h});page=await ctx.new_page();await page.goto(base+'/journal/',wait_until='networkidle',timeout=60000)
   cover=page.locator('.journal-latest-main > a').first;assert (await cover.get_attribute('aria-label')).startswith('閱讀 ')
   await cover.focus();await page.keyboard.press('Tab')
   focus=await page.evaluate("()=>({visible:document.activeElement.getBoundingClientRect().width>0,outline:getComputedStyle(document.activeElement).outlineStyle})")
   assert focus['visible'] and focus['outline']=='solid',focus
   targets=await page.locator('.journal-meta a').evaluate_all('(els)=>els.map(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}))');assert all(t['width']>=24 and t['height']>=24 for t in targets)
   rows.append({'check':'Journal keyboard and target geometry','viewport':[w,h],'result':'pass','targets':targets,'focus':focus});await ctx.close()
  await browser.close()
 server.shutdown();(OUT/'edge-checks.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('edge checks',len(rows),'pass',flush=True)
asyncio.run(main())
