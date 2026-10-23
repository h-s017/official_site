"""Clean art opening: no upper-right controls; pause available on keyboard focus."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.environ.get('HANA_INTRO_OUT',str(ROOT/'docs/ux-audit/clean-intro')));OUT.mkdir(parents=True,exist_ok=True);KEY='hana-intro-restored-seen'
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=os.environ.get('HANA_INTRO_BASE','http://127.0.0.1:'+str(server.server_address[1]));rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h});await ctx.add_init_script("sessionStorage.setItem('hana-intro-seen','1')")
   page=await ctx.new_page();await page.goto(base,wait_until='networkidle');dialog=page.locator('#intro-screen');enter=page.locator('.intro-enter');opener=page.locator('.intro-open-button');assert await dialog.is_visible();assert await enter.evaluate('(x)=>x===document.activeElement')
   assert await page.locator('.intro-controls,.intro-close').count()==0
   pause=page.locator('.intro-pause');assert await pause.evaluate("x=>getComputedStyle(x).clipPath")=="inset(50%)"
   style=await enter.evaluate('(x)=>({background:getComputedStyle(x).backgroundColor,width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height,shadow:getComputedStyle(x).textShadow})');assert style['background']=='rgba(0, 0, 0, 0)' and style['width']>=44 and style['height']>=44
   await page.locator('a.logo').focus();assert await enter.evaluate('(x)=>x===document.activeElement');await page.wait_for_timeout(1400);await page.screenshot(path=str(OUT/f'intro-{w}x{h}.png'))
   assert await enter.evaluate('x=>getComputedStyle(x).outlineStyle')=='none'
   await page.keyboard.press('Shift');assert await enter.evaluate('x=>getComputedStyle(x).outlineStyle')=='solid'
   await page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js');axe=await page.evaluate("async()=>{let r=await axe.run('#intro-screen',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete}}")
   # Save contrast findings/incomplete rather than silently changing the approved transparent style.
   assert not [x for x in axe['violations'] if x['id']!='color-contrast'],axe
   await enter.click();assert not await dialog.is_visible();await page.wait_for_function("document.activeElement===document.querySelector('a.logo')");assert await page.locator('a.logo').evaluate('(x)=>x===document.activeElement');assert await page.evaluate(f"sessionStorage.getItem('{KEY}')")=='1';assert await page.get_by_role('heading',name='HANA SCENT ARTIST',level=1,exact=True).count()==1
   await page.reload(wait_until='networkidle');assert not await dialog.is_visible();assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await page.screenshot(path=str(OUT/f'home-{w}x{h}.png'))
   await opener.click();await page.keyboard.press('Tab');assert await pause.evaluate('x=>x===document.activeElement');assert await pause.evaluate("x=>getComputedStyle(x).clipPath")=="none";await page.keyboard.press('Space');assert await pause.get_attribute('aria-pressed')=='true';assert await page.locator('.intro-slide').first.evaluate("x=>getComputedStyle(x).animationPlayState")=="paused";await page.keyboard.press('Escape');assert not await dialog.is_visible();assert await opener.evaluate('(x)=>x===document.activeElement')
   await opener.click();await enter.click();assert not await dialog.is_visible();assert await opener.evaluate('(x)=>x===document.activeElement')
   rows.append({'viewport':[w,h],'result':'pass','first_visit_auto_open':True,'legacy_session_key_does_not_suppress_restored_intro':True,'return_visit_skips':True,'manual_replay':True,'enter_style':style,'focus_return_and_escape':True,'no_upper_right_controls':True,'pause_hidden_until_focused':True,'keyboard_pause':True,'dialog_axe':axe});await ctx.close()
  for mode in ['no-js','storage-blocked','reduced-motion']:
   ctx=await browser.new_context(viewport={'width':390,'height':844},java_script_enabled=mode!='no-js',reduced_motion='reduce' if mode=='reduced-motion' else 'no-preference');page=await ctx.new_page()
   if mode=='storage-blocked':await page.add_init_script("Object.defineProperty(window,'sessionStorage',{get(){throw Error('blocked')}})")
   await page.goto(base,wait_until='networkidle')
   if mode=='no-js':assert not await page.locator('#intro-screen').is_visible();assert await page.locator('.entrance-editorial a').count()==4
   else:
    assert await page.locator('#intro-screen').is_visible()
    if mode=='reduced-motion':assert await page.locator('.intro-slide').first.evaluate('x=>getComputedStyle(x).animationName')=='none';assert not await page.locator('.intro-pause').is_visible()
    await page.keyboard.press('Escape');assert not await page.locator('#intro-screen').is_visible()
   rows.append({'mode':mode,'result':'pass'});await ctx.close()
  await browser.close()
 server.shutdown();(OUT/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('7 scenarios passed; upper-right controls removed; transparent ENTER and keyboard pause verified',flush=True)
asyncio.run(main())
