"""Shared navigation appearance and disclosure regression; no reservation is opened."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.environ.get('HANA_NAV_OUT',str(Path(__file__).resolve().parent)));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=os.environ.get('HANA_NAV_BASE','http://127.0.0.1:'+str(server.server_address[1]));rows=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'localhost,127.0.0.1'})
  for path,widths in [('/',[320,390,768,981,1199,1440]),('/courses/',[320,390,768,1440]),('/journal/',[320,390,768,1440])]:
   for w in widths:
    ctx=await b.new_context(viewport={'width':w,'height':844 if w<768 else 1024 if w==768 else 900},is_mobile=w<768,has_touch=w<=768,device_scale_factor=3 if w<768 else 1);pg=await ctx.new_page();await pg.add_init_script("sessionStorage.setItem('hana-intro-restored-seen','1')");await pg.goto(base+path,wait_until='networkidle');nav=pg.locator('.site-nav');await pg.wait_for_timeout(200)
    result=await nav.evaluate("x=>({bg:getComputedStyle(x).backgroundColor,opacity:getComputedStyle(x).opacity,font:parseFloat(getComputedStyle(x.querySelector('.nav-links')).fontSize),menuFont:parseFloat(getComputedStyle(x.querySelector('.mobile-note')).fontSize),logo:x.querySelector('.logo').getBoundingClientRect().toJSON(),menu:x.querySelector('.mobile-note').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth+1})");result.update({'path':path,'width':w});assert result['bg']=='rgba(255, 255, 255, 0.6)' and result['opacity']=='1';assert abs(result['font']-((15 if w<=760 else 13 if w<=980 else 12 if w<=1240 else 13.5)+8/3))<.02;assert not result['overflow'],result
    if w<=760:
     assert abs(result['menuFont']-((11 if w<=420 else 12)+8/3))<.02
     assert result['logo']['right']<=result['menu']['left']-2,result
     menu=pg.locator('.mobile-note');await menu.click();assert await menu.get_attribute('aria-expanded')=='true';await pg.wait_for_function("getComputedStyle(document.querySelector('.site-nav')).backgroundColor==='rgb(255, 255, 255)'")
    course=pg.locator('.nav-drop-button')
    if w<=768:await course.tap()
    else:await course.focus();await course.press('ArrowDown')
    assert await course.get_attribute('aria-expanded')=='true';panel=pg.locator('#hana-course-links');await panel.wait_for(state='visible')
    last=panel.locator('a').last;await last.focus();box=await last.bounding_box();assert box['x']>=0 and box['x']+box['width']<=w+1;assert await last.evaluate('x=>x===document.activeElement');await pg.keyboard.press('Escape');assert await course.get_attribute('aria-expanded')=='false'
    if w<=760:
     await pg.keyboard.press('Escape');assert await pg.locator('.mobile-note').get_attribute('aria-expanded')=='false'
    await pg.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js');result['axe']=await pg.evaluate("async()=>{const r=await axe.run('.site-nav',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete}}");assert not result['axe']['violations'],result['axe']
    await pg.evaluate('document.activeElement.blur()');await pg.screenshot(path=str(OUT/('nav-'+(path.strip('/') or 'home')+'-'+str(w)+'.png')));rows.append(result);await ctx.close();print(path+' '+str(w)+' nav passed',flush=True)
  await b.close()
 server.shutdown();(OUT/'nav-results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
asyncio.run(main())
