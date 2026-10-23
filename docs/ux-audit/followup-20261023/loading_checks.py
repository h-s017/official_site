"""Read-only responsive Vol.1 image checks; no booking/payment."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/ux-audit/followup-20261023'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base='http://127.0.0.1:'+str(server.server_address[1]);rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(1440,900)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1.75 if w==390 else 1);page=await ctx.new_page();await page.goto(base+'/overture/',wait_until='networkidle');image=page.locator('.course-slide img');await image.scroll_into_view_if_needed();await image.evaluate('(x)=>x.decode()');src=await image.evaluate('x=>x.currentSrc');assert src.endswith('overture-cover-720.webp' if w==390 else 'overture-cover-1366.webp'),src;assert await image.get_attribute('loading')=='lazy';assert await image.get_attribute('fetchpriority')=='low';rows.append({'check':'course image candidate and loading','viewport':[w,h],'result':'pass','current_src':src});await ctx.close()
  await browser.close()
 server.shutdown();(OUT/'loading-checks.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('2 course image loading checks passed',flush=True)
asyncio.run(main())
