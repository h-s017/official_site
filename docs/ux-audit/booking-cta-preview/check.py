"""Homepage CTA preview; destination is intercepted, no booking/payment is loaded."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base='http://127.0.0.1:'+str(server.server_address[1]);rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844),(1200,900),(1199,900)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h},has_touch=w<=768,is_mobile=w<=390);page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   await page.goto(base,wait_until='networkidle');assert await page.locator('#intro-screen').is_visible();
   if w<=768:await page.locator('.intro-enter').tap()
   else:await page.locator('.intro-enter').click()
   await page.wait_for_timeout(1500)
   cta=page.locator('.home-booking-actions .home-booking-cta');nav=page.locator('.home-booking-cta--nav');assert await cta.get_attribute('href')=='https://reservation.hanascent.com/';assert (await cta.inner_text()).replace('→','').strip()=='課程預約';assert await nav.is_visible()==(w>=1200)
   rect=await cta.bounding_box();assert rect['height']>=52;assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1');assert not errors,errors
   visible=nav if w>=1200 else cta
   if w in [390,768,1440,320,1200]:assert await visible.evaluate('x=>{const r=x.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}'),(w,await visible.bounding_box())
   await page.screenshot(path=str(OUT/f'preview-{w}x{h}.png'))
   await page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js');axe=await page.evaluate("async()=>{const r=await axe.run('.home-booking-actions, .home-booking-cta--nav',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete}}");assert not axe['violations'],axe
   if w>=981:
    await page.locator('.nav-drop-button').click();menu=await page.locator('.nav-dropdown-menu').bounding_box();assert menu['x']>=0 and menu['x']+menu['width']<=w+1;assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1');await page.keyboard.press('Escape')
   await page.locator('.intro-open-button').click();assert await page.locator('#intro-screen').is_visible();await page.keyboard.press('Escape');assert await page.locator('.intro-open-button').evaluate('x=>x===document.activeElement')
   await page.keyboard.press('Shift');await cta.focus();assert await cta.evaluate("x=>x.matches(':focus-visible')&&getComputedStyle(x).outlineStyle!=='none'")
   await page.route('https://reservation.hanascent.com/**',lambda route:route.fulfill(status=200,content_type='text/html',body='<!doctype html><title>Audit destination stub</title>'))
   await cta.click();await page.wait_for_url('https://reservation.hanascent.com/');rows.append({'viewport':[w,h],'hero_cta_rect':rect,'header_cta_visible':w>=1200,'hero_href':'https://reservation.hanascent.com/','destination':'verified with intercepted response; booking not loaded','axe':axe,'overflow':False,'errors':errors});await ctx.close();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(str(w)+' preview passed',flush=True)
  for w,h in [(390,844),(1440,900)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h},java_script_enabled=False);page=await ctx.new_page();await page.goto(base,wait_until='networkidle');assert not await page.locator('#intro-screen').is_visible();assert await page.locator('.home-booking-actions .home-booking-cta').is_visible();assert await page.locator('.home-booking-actions .home-booking-cta').get_attribute('href')=='https://reservation.hanascent.com/';assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1');rows.append({'case':'no-js','viewport':[w,h],'cta_visible':True,'overflow':False});await ctx.close()
  await browser.close()
 server.shutdown();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('8 CTA preview cases passed; booking/payment not loaded',flush=True)
asyncio.run(main())
