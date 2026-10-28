"""Unthrottled browser diagnostics; not field INP or a Lighthouse replacement."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(__file__).resolve().parent
OBSERVER="""(()=>{window.__hanaPerf={lcp:[],shifts:[],events:[],longTasks:[]};for(const [type,key] of [['largest-contentful-paint','lcp'],['layout-shift','shifts'],['event','events'],['longtask','longTasks']]){try{new PerformanceObserver(list=>{for(const e of list.getEntries()){const x={start:e.startTime,duration:e.duration};if(type==='largest-contentful-paint')Object.assign(x,{size:e.size,url:e.url,element:e.element?.outerHTML.slice(0,500)});if(type==='layout-shift')Object.assign(x,{value:e.value,recentInput:e.hadRecentInput,sources:e.sources?.map(s=>s.node?.outerHTML?.slice(0,250))});if(type==='event')Object.assign(x,{name:e.name,interactionId:e.interactionId});window.__hanaPerf[key].push(x);}}).observe(type==='event'?{type,buffered:true,durationThreshold:16}:{type,buffered:true});}catch(e){window.__hanaPerf[key+'Error']=e.message}}})()"""
def cls(shifts):
 peak=current=0;first=last=None
 for e in shifts:
  if e['recentInput']:continue
  if last is None or e['start']-last>1000 or e['start']-first>5000:current=e['value'];first=e['start']
  else:current+=e['value']
  last=e['start'];peak=max(peak,current)
 return peak
async def main():
 rows=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY']})
  for mode in ['first-session','seen-session-cold']:
   for w,h in [(390,844),(1440,900)]:
    ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=3 if w==390 else 1,is_mobile=w==390,has_touch=w==390);pg=await ctx.new_page();await pg.add_init_script(OBSERVER)
    if mode=='seen-session-cold':await pg.add_init_script("sessionStorage.setItem('hana-intro-restored-seen','1')")
    await pg.goto('https://hanascent.com/',wait_until='networkidle');await pg.wait_for_timeout(15000 if mode=='first-session' else 8000)
    intro=pg.locator('#intro-screen');assert await intro.is_visible()==(mode=='first-session');initial=await pg.evaluate('window.__hanaPerf');await pg.screenshot(path=str(OUT/f'{mode}-{w}x{h}.png'))
    if mode=='first-session':await pg.locator('.intro-enter').click();await pg.wait_for_timeout(300)
    if w==390:
     await pg.locator('.mobile-note').tap();await pg.locator('.nav-drop-button').tap();await pg.keyboard.press('Escape');await pg.keyboard.press('Escape')
    else:
     await pg.locator('.nav-drop-button').focus();await pg.keyboard.press('ArrowDown');await pg.keyboard.press('Escape')
    await pg.wait_for_timeout(500);final=await pg.evaluate('window.__hanaPerf');interactive=[e['duration'] for e in final['events'] if e.get('interactionId')]
    row={'mode':mode,'viewport':[w,h],'throttling':'none','browserContext':'fresh cold context; seen variant pre-seeds sessionStorage only','beforeInteraction':initial,'afterInteraction':final,'clsSessionWindow':cls(final['shifts']),'maxObservedEventDurationMs':max(interactive) if interactive else None,'eventTimingEntryCount':len(interactive),'caveat':'Observed interaction timing samples are not field INP or a percentile.'}
    rows.append(row);(OUT/'browser-observations.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(mode,w,'LCP',initial['lcp'][-1]['start'] if initial['lcp'] else None,'CLS',row['clsSessionWindow'],'max sampled event',row['maxObservedEventDurationMs'],flush=True);await ctx.close()
  await b.close()
asyncio.run(main())
