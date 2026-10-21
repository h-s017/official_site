"""Read-only live booking inspection + local, intercepted form status checks. No live writes."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1];result={'booking':{},'contact':{},'news_failure':{},'live_writes':0}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'})
 ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 blocked=[];mock={'form_status':500}
 def guard(route):
  req=route.request
  if req.method in ['POST','PUT','PATCH','DELETE']:
   if req.url.startswith('https://formspree.io/'):
    route.fulfill(status=mock['form_status'],content_type='application/json',body=json.dumps({'ok':mock['form_status']==200}));return
   blocked.append(req.url.split('?')[0]);route.abort();return
  route.continue_()
 ctx.route('**/*',guard);page=ctx.new_page();page.set_default_timeout(15000)
 try:
  page.goto('https://reservation.hanascent.com/',wait_until='load')
  page.wait_for_function('typeof C!=="undefined" && typeof allSlots!=="undefined" && allSlots.length>0',timeout=20000)
  result['booking']['course_config']=page.evaluate('()=>C.COURSES.map(c=>({series:c.series,course:c.course,variant:c.variant||"",price:c.price,regular:c.regular,times:c.times,requiredSlots:c.requiredSlots}))')
  result['booking']['slot_price_groups']=page.evaluate('()=>[...new Map(allSlots.map(s=>[JSON.stringify([s.course,s.variant,s.price]),{course:s.course,variant:s.variant||"",price:s.price}])).values()]')
  page.locator('#seriesMenu button').filter(has_text='氣味藝術序曲系列').click()
  page.locator('#courseMenu button').filter(has_text='Vol. 1｜一日專業調香師').first.click()
  for _ in range(8):
   if page.locator('.day.open:not([disabled])').count():break
   page.locator('#nextM').click()
  page.locator('.day.open:not([disabled])').first.click();page.locator('[data-slot]:not([disabled])').first.click();page.locator('#toStep4').click()
  result['booking']['reached_step4']=page.locator('#step4').is_visible()
  page.add_script_tag(path='/tmp/hana-audit-tools/node_modules/axe-core/axe.min.js')
  result['booking']['step4_axe']=page.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}")
  page.locator('#toStep5').click()
  result['booking']['empty_validation']=page.locator('#formMsg').inner_text()
  page.screenshot(path=str(OUT/'screenshots/before-live-booking-step4-390x844.png'),full_page=True)
  result['booking']['limit']='Stopped before valid prepareOrder: step5 confirmation already calls POST /api/orders and creates a live order. Payment and completion not exercised.'
 except Exception as e:result['booking']['error']=str(e)
 try:
  page.goto('http://127.0.0.1:8010/business/inquiry/?service=product-development',wait_until='load')
  result['contact']['prefilled_service']=page.locator('input[name="合作項目"]:checked').get_attribute('value')
  page.locator('#name').fill('UX Audit Test');page.locator('#brand').fill('UX Audit Fixture');page.locator('#email').fill('ux-audit@example.invalid');page.locator('#contact').fill('0900000000');page.locator('#stage').select_option(index=1);page.locator('#project').fill('LOCAL INTERCEPTED TEST — no live message')
  page.locator('#submitButton').click();page.wait_for_timeout(300)
  result['contact']['mock_failure']=page.locator('#formStatus').inner_text();result['contact']['failure_retains_name']=page.locator('#name').input_value()=='UX Audit Test';result['contact']['button_reenabled']=page.locator('#submitButton').is_enabled()
  mock['form_status']=200;page.locator('#submitButton').click();page.wait_for_timeout(300)
  result['contact']['mock_success']=page.locator('#formStatus').inner_text();result['contact']['success_resets_name']=page.locator('#name').input_value()==''
  result['contact']['scope']='POST fulfilled inside Playwright; no message sent to Formspree or recipient.'
 except Exception as e:result['contact']['error']=str(e)
 try:
  page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',lambda route:route.abort())
  page.goto('http://127.0.0.1:8010/news/',wait_until='load');page.wait_for_timeout(2500)
  result['news_failure']['visible_loading']=page.get_by_text('最新消息載入中...').is_visible()
  result['news_failure']['main_text']=page.locator('main').inner_text()
  page.screenshot(path=str(OUT/'screenshots/before-news-sdk-failure-390x844.png'),full_page=True)
 except Exception as e:result['news_failure']['error']=str(e)
 result['blocked_mutations']=blocked
 ctx.close();b.close()
(OUT/'results/flow-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2))
