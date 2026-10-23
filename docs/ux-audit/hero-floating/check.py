"""Fixed booking behavior; no actual reservation application or payment is loaded."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.environ.get('HANA_HERO_OUT',str(Path(__file__).resolve().parent)));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def box(cta):return await cta.evaluate("x=>({rect:x.getBoundingClientRect().toJSON(),position:getComputedStyle(x).position,bodyDock:x.parentElement.matches('.home-booking-dock')&&x.parentElement.parentElement===document.body})")
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=os.environ.get('HANA_HERO_BASE','http://127.0.0.1:'+str(server.server_address[1]));rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844),(1199,900)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h},has_touch=w<=768,is_mobile=w<=390);page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));await page.goto(base,wait_until='networkidle');cta=page.locator('.home-booking-cta--floating');assert await page.locator('.home-booking-cta').count()==1;assert await page.locator('#intro-screen').is_visible();assert not await cta.is_visible()
   if w<=768:await page.locator('.intro-enter').tap()
   else:await page.locator('.intro-enter').click()
   await page.wait_for_timeout(1500);assert await cta.is_visible();hero=await page.locator('.hero-visual').bounding_box();assert abs(hero['x'])<1 and abs(hero['width']-w)<1 and abs(hero['height']-w*9/16)<1;assert await page.locator('[data-hana-hero-image]').get_attribute('sizes')=='100vw';first=await box(cta);assert first['bodyDock'] and first['position']=='fixed';r=first['rect'];assert r['height']>=52 and r['left']>=0 and r['right']<=w and r['bottom']<=h;assert not await page.evaluate('document.documentElement.scrollWidth>innerWidth+1');await page.screenshot(path=str(OUT/f'after-top-{w}x{h}.png'))
   await page.evaluate('scrollTo({top:1000,behavior:"instant"})');await page.wait_for_timeout(400);middle=await box(cta);assert abs(middle['rect']['y']-r['y'])<1;await page.screenshot(path=str(OUT/f'after-scroll-{w}x{h}.png'))
   await page.evaluate('scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');await page.wait_for_timeout(1300);bottom=await box(cta);assert abs(bottom['rect']['y']-r['y'])<1;footer=await page.locator('footer').bounding_box();assert footer['y']+footer['height']<=bottom['rect']['top'];await page.screenshot(path=str(OUT/f'after-footer-{w}x{h}.png'))
   await page.keyboard.press('Shift');await cta.focus();assert await cta.evaluate("x=>x.matches(':focus-visible')&&getComputedStyle(x).outlineStyle!=='none'")
   await page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js');axe=await page.evaluate("async()=>{const r=await axe.run('.home-booking-cta--floating',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete}}");assert not axe['violations'],axe
   await page.locator('.intro-open-button').click();assert not await cta.is_visible();await page.keyboard.press('Escape');await cta.wait_for(state='visible');assert await cta.is_visible();assert await page.locator('.intro-open-button').evaluate('x=>x===document.activeElement')
   await page.evaluate('scrollTo({top:0,behavior:"instant"})')
   if w<=390:
    await page.locator('.mobile-note').click();assert not await cta.is_visible();await page.keyboard.press('Escape');await cta.wait_for(state='visible');assert await cta.is_visible()
    await page.set_viewport_size({'width':w,'height':560});small=await box(cta);assert small['rect']['bottom']<=560 and small['rect']['top']>=0;await page.set_viewport_size({'width':w,'height':h})
   assert await cta.get_attribute('href')=='https://reservation.hanascent.com/';await page.route('https://reservation.hanascent.com/**',lambda route:route.fulfill(status=200,content_type='text/html',body='<!doctype html><title>Destination stub</title>'));await cta.click();await page.wait_for_url('https://reservation.hanascent.com/');assert not errors,errors
   rows.append({'viewport':[w,h],'hero':hero,'top':first,'middle':middle,'bottom':bottom,'footer':footer,'axe':axe,'menu_and_intro_hide_cta':True,'link_destination':'intercepted; actual booking app not loaded','errors':errors});(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));await ctx.close();print(str(w)+' fixed booking passed',flush=True)
  ctx=await browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False);page=await ctx.new_page();await page.goto(base,wait_until='networkidle');assert await page.locator('.home-booking-cta--floating').is_visible();rows.append({'mode':'no-js','booking_visible':True});await ctx.close();await browser.close()
 server.shutdown();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('6 floating booking cases passed; no booking/payment loaded',flush=True)
asyncio.run(main())
