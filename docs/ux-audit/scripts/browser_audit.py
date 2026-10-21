"""Read-only viewport evidence. Requires Playwright and a permitted Chromium runtime.
Never submits booking/contact forms. Use --axe-script /absolute/path/axe.min.js for axe.
"""
import argparse, json, sys
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser()
p.add_argument('--base-url', default='https://hanascent.com')
p.add_argument('--phase', choices=['before','after'], default='before')
p.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1])
p.add_argument('--axe-script', type=Path)
p.add_argument('--chromium', default='/usr/bin/chromium')
a=p.parse_args()
if a.axe_script and not a.axe_script.is_file(): p.error('axe-script does not exist')
pages={'home':'/','courses':'/courses/','overture-series':'/overture-series/','overture':'/overture/','kpia':'/KPIA/','helori':'/helori/','practice':'/practice/','incubation':'/incubation/','business':'/business/','product-development':'/product-development/','journal':'/journal/','news':'/news/','contact':'/visit.html','booking':'https://reservation.hanascent.com/'}
viewports=[(390,844),(768,1024),(1440,900),(320,844)]
a.output.mkdir(parents=True,exist_ok=True)
(a.output/'screenshots').mkdir(exist_ok=True)
(a.output/'results').mkdir(exist_ok=True)
target=a.output/'results'/f'{a.phase}-browser.json'
if target.exists(): p.error(f'{target} already exists; choose a different --output to preserve evidence')
result={'started_at':datetime.now(timezone.utc).isoformat(),'base_url':a.base_url,'phase':a.phase,'axe_requested':bool(a.axe_script),'status':'not_started','pages':[],'limits':['Lab navigation only; no field INP or Core Web Vitals acceptance','No booking/contact submission or payment','Lighthouse and manual review are separate']}
failed=False
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=a.chromium,headless=True,args=['--no-sandbox'])
  result['browser_version']=browser.version
  for name,path in pages.items():
   for w,h in viewports:
    row={'page':name,'viewport':{'width':w,'height':h},'requested_url':path if path.startswith('https://') else a.base_url.rstrip('/')+path,'status':'not_started'}
    ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=w<=390,has_touch=w<=768)
    page=ctx.new_page(); row['console_errors']=[]; row['failed_requests']=[]
    page.on('pageerror',lambda err: row['console_errors'].append(str(err)))
    page.on('requestfailed',lambda req: row['failed_requests'].append({'url':req.url,'error':req.failure}))
    try:
     response=page.goto(row['requested_url'],wait_until='load',timeout=30000)
     page.wait_for_timeout(2000)
     row['http_status']=response.status if response else None
     row['final_url']=page.url
     shot=f'{a.phase}-{name}-{w}x{h}.png'
     page.screenshot(path=str(a.output/'screenshots'/shot),full_page=True)
     row['screenshot']='screenshots/'+shot
     if name=='home' and page.locator('.intro-enter').is_visible():
      row['intro_present']=True
      page.locator('.intro-enter').click(); page.wait_for_timeout(800)
      page.screenshot(path=str(a.output/'screenshots'/f'{a.phase}-{name}-{w}x{h}-entered.png'),full_page=True)
     row['layout']=page.evaluate('''() => ({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,h1Count:document.querySelectorAll('h1').length,images:[...document.images].map(e=>({src:e.currentSrc,loaded:e.complete&&e.naturalWidth>0,width:e.width,height:e.height})),smallTargets:[...document.querySelectorAll('a,button,input,select')].map(e=>({text:e.textContent.trim().slice(0,60),rect:e.getBoundingClientRect()})).filter(x=>x.rect.width>0&&x.rect.height>0&&(x.rect.width<24||x.rect.height<24)).map(x=>({text:x.text,width:x.rect.width,height:x.rect.height}))})''')
     if a.axe_script:
      page.add_script_tag(path=str(a.axe_script))
      row['axe']=page.evaluate("async () => await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})")
     else: row['axe']={'status':'not_run','reason':'No local axe-core bundle supplied'}
     if w<=390 and page.locator('.mobile-note').is_visible():
      page.locator('.mobile-note').click(); page.wait_for_timeout(500)
      page.screenshot(path=str(a.output/'screenshots'/f'{a.phase}-{name}-{w}x{h}-menu.png'),full_page=True)
      button=page.locator('.nav-drop-button')
      if button.count():
       button.click(); page.wait_for_timeout(400)
       row['menu_expanded']=button.get_attribute('aria-expanded')
       page.screenshot(path=str(a.output/'screenshots'/f'{a.phase}-{name}-{w}x{h}-courses.png'),full_page=True)
     row['status']='captured_requires_review'
    except Exception as e:
     row['status']='error'; row['error']=str(e); failed=True
    finally:
     result['pages'].append(row); ctx.close()
  browser.close(); result['status']='partial' if failed else 'captured_requires_review'
except Exception as e:
 result['status']='blocked'; result['error']=str(e); failed=True
finally:
 target.write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print(f"{result['status']}: {target}")
sys.exit(1 if failed else 0)
