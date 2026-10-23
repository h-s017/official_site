"""Read-only news layout evidence; reservation and payment are never opened."""
import asyncio, functools, http.server, json, os, threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(os.environ.get('HANA_NEWS_OUT',str(Path(__file__).resolve().parent)))
PHASE=os.environ.get('HANA_NEWS_PHASE','after')
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
async def measure(page):
 return await page.locator('.home-news').evaluate('''x=>({section:x.getBoundingClientRect().toJSON(),order:[...document.querySelectorAll('main>section')].map(s=>s.className.split(' ')[0]),cards:[...x.querySelectorAll('article')].filter(a=>a.offsetWidth).map(a=>({rect:a.getBoundingClientRect().toJSON(),title:a.querySelector('h3')?.textContent,summary:a.querySelector('p')?.textContent})),overflow:document.documentElement.scrollWidth>innerWidth+1})''')
async def main():
 OUT.mkdir(parents=True,exist_ok=True)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 base=os.environ.get('HANA_NEWS_BASE','http://127.0.0.1:'+str(server.server_address[1]))
 rows=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
  for w,h in [(390,844),(768,1024),(1440,900),(320,844)]:
   ctx=await browser.new_context(viewport={'width':w,'height':h});page=await ctx.new_page()
   await page.add_init_script("sessionStorage.setItem('hana-intro-restored-seen','1')")
   await page.goto(base,wait_until='networkidle');news=page.locator('.home-news');await news.scroll_into_view_if_needed();await page.wait_for_timeout(700)
   result=await measure(page);result['viewport']=[w,h];assert not result['overflow']
   if PHASE=='after':
    assert result['order']==['entrance-editorial','home-news','home-about'],result
    assert 0<len(result['cards'])<=3
    assert await news.locator('.news-marquee,.news-track,.news-set').count()==0
    assert await news.locator('.news-list').evaluate('x=>x.scrollWidth<=x.clientWidth')
    rects=[r['rect'] for r in result['cards']]
    assert all(b['top']>=a['bottom']-1 for a,b in zip(rects,rects[1:]))
    assert all(a['height']<220 for a in rects),rects
    for link in await news.locator('a').all():
     box=await link.bounding_box();assert box['height']>=44;await page.keyboard.press('Tab');await link.focus();assert await link.evaluate("x=>x===document.activeElement&&getComputedStyle(x).outlineStyle!=='none'")
    for excerpt in await news.locator('.news-row p').all():
     assert await excerpt.evaluate("x=>x.offsetHeight<=parseFloat(getComputedStyle(x).lineHeight)*2+1")
    await page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js')
    result['axe']=await page.evaluate("async()=>{const r=await axe.run('.home-news',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete}}")
    assert not result['axe']['violations'],result['axe']
   await news.locator('h2').click();await news.scroll_into_view_if_needed();await page.wait_for_timeout(500);await page.screenshot(path=str(OUT/f'{PHASE}-{w}x{h}.png'))
   if PHASE=='after':
    first=news.locator('.news-title-link').first;destination=await first.get_attribute('href')
    await page.route('**/blog.html?slug=*',lambda route:route.fulfill(status=200,content_type='text/html',body='<title>News destination stub</title>'))
    await first.click();await page.wait_for_url(destination);result['title_link_destination']=destination
   rows.append(result);await ctx.close();print(f'{PHASE} {w} passed',flush=True)
  if PHASE=='after':
   for mode in ['fixture','network-error','no-js']:
    ctx=await browser.new_context(viewport={'width':390,'height':844},java_script_enabled=mode!='no-js');page=await ctx.new_page();await page.add_init_script("sessionStorage.setItem('hana-intro-restored-seen','1')")
    if mode=='network-error':await page.route('**/rest/v1/**',lambda route:route.abort())
    if mode=='fixture':
     async def fixture(route):
      table=route.request.url.split('/rest/v1/')[1].split('?')[0]
      items=[{'title':'測試用長標題：'+('氣味藝術與課程消息'*4),'content':'測試摘要。'*40,'news_date':'2026-10-23T00:00:00Z','category':'course','link_url':'/courses/','status':'published'} for _ in range(5)]
      data={'show_announcements':True} if table=='site_settings' else items if table=='announcements' else []
      await route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
     await page.route('**/rest/v1/**',fixture)
    await page.goto(base,wait_until='networkidle');news=page.locator('.home-news');assert await news.locator('article').count()==3
    assert await news.locator('.news-marquee').count()==0
    for excerpt in await news.locator('.news-row p').all():assert await excerpt.evaluate("x=>x.offsetHeight<=parseFloat(getComputedStyle(x).lineHeight)*2+1")
    if mode=='fixture':assert '測試用長標題' in await news.inner_text()
    else:assert '18 : 21' in await news.inner_text()
    rows.append({'mode':mode,'count':await news.locator('article').count(),'fallback_visible':mode!='fixture'});await ctx.close();print(mode+' passed',flush=True)
  await browser.close()
 server.shutdown();(OUT/(PHASE+'-results.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2))
asyncio.run(main())
