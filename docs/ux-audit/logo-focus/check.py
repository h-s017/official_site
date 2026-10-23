"""Reproduce and verify pointer-return focus versus keyboard focus; no forms visited."""
import asyncio,functools,http.server,json,os,threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3];OUT=Path(os.environ.get('HANA_LOGO_OUT',str(Path(__file__).resolve().parent)));OUT.mkdir(parents=True,exist_ok=True);PHASE=os.environ.get('HANA_LOGO_PHASE','after')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def inspect(page):
 return await page.locator('.site-nav .logo').evaluate("x=>({focused:x===document.activeElement,focusVisible:x.matches(':focus-visible'),outlineStyle:getComputedStyle(x).outlineStyle,outlineWidth:getComputedStyle(x).outlineWidth,overflow:document.documentElement.scrollWidth>innerWidth+1})")
async def main():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start();base=os.environ.get('HANA_LOGO_BASE','http://127.0.0.1:'+str(server.server_address[1]));rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h},has_touch=w<=768,is_mobile=w<=390);page=await ctx.new_page();await page.goto(base,wait_until='networkidle');enter=page.locator('.intro-enter');assert await enter.is_visible()
   if w<=768:await enter.tap()
   else:await enter.click()
   await page.wait_for_function("!document.querySelector('#intro-screen').open");await page.wait_for_timeout(150);pointer=await inspect(page);assert pointer['focused'] and not pointer['overflow']
   await page.screenshot(path=str(OUT/f'{PHASE}-pointer-{w}x{h}.png'))
   await page.keyboard.press('Shift');keyboard=await inspect(page);assert keyboard['focused'];await page.screenshot(path=str(OUT/f'{PHASE}-keyboard-{w}x{h}.png'))
   if PHASE!='before':assert pointer['outlineStyle']=='none' and keyboard['outlineStyle']!='none' and keyboard['focusVisible'],(pointer,keyboard)
   await page.reload(wait_until='networkidle');assert not await page.locator('#intro-screen').is_visible();await page.keyboard.press('Tab');tab=await inspect(page);assert tab['focused'] and tab['outlineStyle']!='none'
   await page.get_by_role('button',name='藝術影像 · ENTER').click();await page.keyboard.press('Escape');assert await page.locator('.intro-open-button').evaluate('x=>x===document.activeElement')
   rows.append({'viewport':[w,h],'pointer':pointer,'keyboard_same_focus':keyboard,'tab':tab,'manual_replay_escape_returns_focus':True});await ctx.close()
  # A first-session keyboard dismissal must show a visible return-focus indicator.
  ctx=await browser.new_context(viewport={'width':390,'height':844});page=await ctx.new_page();await page.goto(base,wait_until='networkidle');await page.keyboard.press('Enter');await page.wait_for_function("document.activeElement===document.querySelector('.site-nav .logo')");keyboard_close=await inspect(page);assert keyboard_close['outlineStyle']!='none';rows.append({'case':'keyboard dismissal','logo':keyboard_close});await ctx.close();await browser.close()
 server.shutdown();(OUT/(PHASE+'-results.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False),flush=True)
asyncio.run(main())
