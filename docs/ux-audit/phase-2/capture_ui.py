"""Evidence capture; no forms submitted. TLS stays enabled; uses session proxy + trusted CA."""
import argparse, asyncio, json, os
from datetime import datetime, timezone
from pathlib import Path
from playwright.async_api import async_playwright
PAGES={'home':'/','courses':'/courses/','overture-series':'/overture-series/','overture':'/overture/','kpia':'/KPIA/','helori':'/helori/','practice':'/practice/','incubation':'/incubation/','business':'/business/','product-development':'/product-development/','journal':'/journal/','news':'/news/','contact':'/visit.html','journal-all':'/journal/all/'}
VIEWPORTS=[(390,844),(768,1024),(1440,900),(320,844)]
parser=argparse.ArgumentParser(); parser.add_argument('--base',default='https://hanascent.com'); parser.add_argument('--label',required=True); parser.add_argument('--out',type=Path,required=True); parser.add_argument('--axe',type=Path,required=True); parser.add_argument('--pages',default=''); args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True); (args.out/'screenshots').mkdir(exist_ok=True); (args.out/'results').mkdir(exist_ok=True)
report=args.out/'results'/f'{args.label}-matrix.json'
if report.exists(): parser.error('Refusing to overwrite evidence')
result={'started_at':datetime.now(timezone.utc).isoformat(),'base':args.base,'label':args.label,'axe_version':'4.10.3','rows':[],'type':'lab viewport inspection; not field performance or WCAG certification'}
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  result['browser']=browser.version; sem=asyncio.Semaphore(3)
  async def run(name,path,w,h):
   async with sem:
    row={'page':name,'viewport':[w,h],'url':path if path.startswith('https://') else args.base.rstrip('/')+path,'errors':[],'failed_requests':[],'http_errors':[]}
    ctx=await browser.new_context(viewport={'width':w,'height':h},is_mobile=w<=390,has_touch=w<=768,device_scale_factor=1)
    page=await ctx.new_page(); page.set_default_timeout(8000)
    page.on('pageerror',lambda err:row['errors'].append(str(err)))
    page.on('requestfailed',lambda req:row['failed_requests'].append({'url':req.url,'error':req.failure}))
    page.on('response',lambda resp:row['http_errors'].append({'url':resp.url,'status':resp.status}) if resp.status>=400 else None)
    try:
     await page.add_init_script("window.auditCLS=0;new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.auditCLS+=e.value})).observe({type:'layout-shift',buffered:true});")
     response=await page.goto(row['url'],wait_until='load',timeout=45000)
     row['status']=response.status if response else None; row['final_url']=page.url
     await page.wait_for_timeout(2000)
     try: await page.evaluate('() => Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,5000))])')
     except Exception: pass
     if name=='home' and await page.locator('.intro-enter').is_visible():
      await page.screenshot(path=str(args.out/'screenshots'/f'{args.label}-{name}-{w}x{h}-intro.png'),full_page=True)
      await page.locator('.intro-enter').click(); await page.wait_for_timeout(800)
     # Scroll through reveal/lazy-load sections before a full-page screenshot.
     await page.evaluate('''async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=Math.max(400,innerHeight*.7)){scrollTo({top:y,behavior:"instant"});await new Promise(r=>setTimeout(r,70));}scrollTo({top:0,behavior:"instant"});}''')
     await page.wait_for_timeout(600)
     row['layout']=await page.evaluate('''() => {
      const visible=e=>{const r=e.getBoundingClientRect();for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.display==='none'||s.opacity==='0')return false}return r.width>0&&r.height>0};
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,clsObserved:window.auditCLS,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family),images:[...document.images].map(e=>({src:e.currentSrc,loaded:e.complete&&e.naturalWidth>0,width:e.width,height:e.height})),overflowElements:[...document.querySelectorAll('body *')].filter(visible).map(e=>({e,r:e.getBoundingClientRect()})).filter(x=>x.r.right>innerWidth+1||x.r.left< -1).slice(0,20).map(x=>({tag:x.e.tagName,class:x.e.className,text:x.e.textContent.slice(0,60),left:x.r.left,right:x.r.right})),smallText:[...document.querySelectorAll('p,a,small,label,button')].filter(visible).filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).slice(0,40).map(e=>({text:e.textContent.trim().slice(0,60),font:getComputedStyle(e).fontSize})),footer:!!document.querySelector('footer'),newsText:document.querySelector('.news-list')?.innerText||null};}''')
     await page.screenshot(path=str(args.out/'screenshots'/f'{args.label}-{name}-{w}x{h}.png'),full_page=True)
     await page.add_script_tag(path=str(args.axe))
     row['axe']=await page.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:r.passes.map(x=>x.id)}}")
     if name=='courses':
      await page.evaluate('()=>{document.activeElement.blur();window.scrollTo(0,0)}')
      row['tab_sequence']=[]
      for _ in range(6):
       await page.keyboard.press('Tab')
       row['tab_sequence'].append(await page.evaluate("()=>{const e=document.activeElement;return {tag:e.tagName,text:e.textContent.trim().slice(0,60),inNav:!!e.closest('.nav-links'),navOpacity:getComputedStyle(document.querySelector('.nav-links')).opacity}}"))
     if name in ['home','courses'] and w<=390:
      menu=page.locator('.mobile-note')
      if await menu.is_visible():
       await menu.click(); await page.wait_for_timeout(400)
       await page.screenshot(path=str(args.out/'screenshots'/f'{args.label}-{name}-{w}x{h}-menu.png'),full_page=True)
       button=page.locator('.nav-drop-button'); await button.click(); await page.wait_for_timeout(400)
       row['menu']=await page.evaluate("()=>({expanded:document.querySelector('.nav-drop-button').getAttribute('aria-expanded'),height:document.querySelector('.site-nav').getBoundingClientRect().height,links:[...document.querySelectorAll('.nav-dropdown-menu a')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON()}))})")
       await page.screenshot(path=str(args.out/'screenshots'/f'{args.label}-{name}-{w}x{h}-menu-courses.png'),full_page=True)
     row['capture']='complete'
    except Exception as e:
     row['capture']='failed'; row['error']=str(e)
    finally:
     result['rows'].append(row); report.write_text(json.dumps(result,ensure_ascii=False,indent=2)); await ctx.close(); print(f'{name} {w}: {row["capture"]}',flush=True)
  names=set(args.pages.split(',')) if args.pages else set(PAGES)
  await asyncio.gather(*(run(n,path,w,h) for n,path in PAGES.items() if n in names for w,h in VIEWPORTS))
  await browser.close()
asyncio.run(main())
