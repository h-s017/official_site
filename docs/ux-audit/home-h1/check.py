"""Home brand h1: semantics, unchanged layout, no-JS; no booking/payment routes."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.environ.get('HANA_H1_OUT',str(ROOT/'docs/ux-audit/home-h1')));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=os.environ.get('HANA_H1_BASE','http://127.0.0.1:'+str(server.server_address[1]));rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h});page=await ctx.new_page();await page.goto(base,wait_until='networkidle');await page.evaluate('document.fonts.ready')
   title=page.get_by_role('heading',name='HANA SCENT ARTIST',level=1,exact=True);assert await title.count()==1;assert await page.locator('h1').count()==1;assert await page.locator('.hero > h1').inner_text()=='HANA SCENT ARTIST'
   assert not await page.locator('#intro-screen').is_visible();assert await page.locator('.entrance-editorial a').count()==4
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   # Remove only the new h1 and compare the existing layout in the same document.
   geometry="()=>Object.fromEntries(['.site-nav','.hero-visual','.hero-panel','.entrance-editorial','footer'].map(s=>{let r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))"
   before=await page.evaluate(geometry);await title.evaluate('(x)=>{window.h1Node=x;window.h1Next=x.nextSibling;window.h1Parent=x.parentNode;x.remove()}');after=await page.evaluate(geometry);assert before==after,{'before':before,'after':after};await page.evaluate('window.h1Parent.insertBefore(window.h1Node,window.h1Next)')
   await page.screenshot(path=str(OUT/f'home-{w}x{h}.png'))
   await page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js');axe=await page.evaluate("async()=>{let r=await axe.run(document,{runOnly:{type:'rule',values:['page-has-heading-one','empty-heading','heading-order']}});return {violations:r.violations,passes:r.passes.map(x=>x.id)}}");assert not axe['violations'],axe
   rows.append({'viewport':[w,h],'result':'pass','h1_accessible_name':await title.inner_text(),'h1_count':1,'layout_unchanged':True,'heading_outline':await page.locator('h1,h2,h3').evaluate_all('(els)=>els.map(x=>({level:x.tagName,text:x.textContent.trim()}))'),'axe_heading_rules':axe});await ctx.close()
  ctx=await browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=await ctx.new_page();await page.goto(base);assert await page.get_by_role('heading',name='HANA SCENT ARTIST',level=1,exact=True).count()==1;assert not await page.locator('#intro-screen').is_visible();rows.append({'mode':'no-js','result':'pass','h1_count':1});await ctx.close();await browser.close()
 server.shutdown();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('5 scenarios passed: one accessible h1, unchanged layout, heading rules clean',flush=True)
asyncio.run(main())
