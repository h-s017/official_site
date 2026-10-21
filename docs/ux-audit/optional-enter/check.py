"""Optional art entry preview; read-only, no booking/payment navigation."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/ux-audit/optional-enter';rows=[]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 s=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=s.serve_forever,daemon=True).start();base='http://127.0.0.1:'+str(s.server_address[1])
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h});page=await ctx.new_page();requests=[];page.on('request',lambda r:requests.append(r.url));await page.goto(base,wait_until='networkidle');dialog=page.locator('#intro-screen');opener=page.locator('.intro-open-button')
   print('initial',w,await dialog.is_visible(),await page.locator('.entrance-editorial a').count(),[u for u in requests if '/assets/intro/' in u],await page.evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})'),flush=True)
   assert not await dialog.is_visible()
   assert await page.locator('.entrance-editorial a').count()==4
   assert not any('/assets/intro/' in u for u in requests)
   if await page.evaluate('document.documentElement.scrollWidth>innerWidth+1'):
    print('overflow nodes',await page.evaluate("[...document.querySelectorAll('body *')].map(x=>({tag:x.tagName,cls:x.className,r:x.getBoundingClientRect().toJSON(),opacity:getComputedStyle(x).opacity})).filter(x=>x.r.right>innerWidth+1||x.r.left< -1).slice(0,20)"),flush=True)
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   await page.screenshot(path=str(OUT/f'home-{w}x{h}.png'),full_page=False)
   await opener.click();assert await dialog.is_visible();assert await page.locator('.intro-close').evaluate('(x)=>x===document.activeElement')
   await page.locator('a.logo').focus();assert await page.locator('.intro-close').evaluate('(x)=>x===document.activeElement')
   for _ in range(5):
    await page.keyboard.press('Tab');assert await page.evaluate("document.activeElement===document.body||document.activeElement.closest('dialog')!==null")
   await page.wait_for_timeout(1400)
   await page.locator('.intro-pause').click();assert await page.locator('.intro-pause').get_attribute('aria-pressed')=='true'
   await page.wait_for_timeout(1400);await page.screenshot(path=str(OUT/f'art-{w}x{h}.png'))
   await page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js');axe=await page.evaluate("async()=>{let r=await axe.run('#intro-screen',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete}}")
   assert not axe['violations'],axe['violations']
   await page.keyboard.press('Escape');assert not await dialog.is_visible();assert await opener.evaluate('(x)=>x===document.activeElement');assert await page.evaluate("!document.body.classList.contains('intro-open')")
   for control in ['.intro-enter','.intro-close']:
    await opener.click();await page.locator(control).click();assert not await dialog.is_visible();assert await opener.evaluate('(x)=>x===document.activeElement')
   await page.reload(wait_until='networkidle');assert not await dialog.is_visible()
   rows.append({'viewport':[w,h],'result':'pass','default_closed':True,'four_services':True,'no_intro_download_before_opt_in':True,'native_modal_background_focus_isolation':True,'escape_and_buttons_restore_focus':True,'pause':True,'dialog_axe':axe});await ctx.close()
  for mode in ['no-js','storage-blocked','reduced-motion']:
   ctx=await browser.new_context(viewport={'width':390,'height':844},java_script_enabled=mode!='no-js',reduced_motion='reduce' if mode=='reduced-motion' else 'no-preference');page=await ctx.new_page()
   if mode=='storage-blocked':await page.add_init_script("Object.defineProperty(window,'sessionStorage',{get(){throw new Error('blocked')}})")
   await page.goto(base,wait_until='networkidle');assert not await page.locator('#intro-screen').is_visible();assert await page.locator('.entrance-editorial a').count()==4
   if mode=='reduced-motion':
    await page.locator('.intro-open-button').click();assert await page.locator('.intro-slide').first.evaluate("x=>getComputedStyle(x).animationName")=='none';assert not await page.locator('.intro-pause').is_visible()
   rows.append({'mode':mode,'result':'pass'});await ctx.close()
  await browser.close()
 s.shutdown();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('7 scenarios passed; 4 dialog axe scans clean',flush=True)
asyncio.run(main())
