"""Interaction regression for real keyboard, touch and mouse; no form submissions."""
import argparse, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--out',required=True);a=p.parse_args()
rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'},headless=True)
 for width,height in [(390,844),(320,844),(768,1024),(1440,900)]:
  c=b.new_context(viewport={'width':width,'height':height},has_touch=width<=768,is_mobile=width<=390)
  c.route('https://fonts.googleapis.com/**',lambda route:route.abort())
  page=c.new_page();page.set_default_timeout(5000);page.goto(a.base+'/courses/',wait_until='domcontentloaded');page.wait_for_timeout(600)
  row={'viewport':[width,height],'checks':{}}
  def check(key,fn):
   try: fn();row['checks'][key]='pass'
   except Exception as e: row['checks'][key]='FAIL: '+str(e)[:500]
  def assert_js(expr): assert page.evaluate(expr)
  if width<=390:
   page.keyboard.press('Tab');page.keyboard.press('Tab')
   row['closed_second_focus']=page.evaluate("()=>({text:document.activeElement.textContent,insideNav:!!document.activeElement.closest('.nav-links')})")
   check('closed_tab_reaches_menu',lambda:assert_js("()=>document.activeElement.matches('.mobile-note')"))
   page.locator('.mobile-note').focus();page.keyboard.press('Enter');page.wait_for_timeout(400)
   check('keyboard_menu_open',lambda:assert_js("()=>document.querySelector('.site-nav').classList.contains('menu-open')"))
   check('menu_open_moves_focus_to_visible_link',lambda:assert_js("()=>document.activeElement.matches('.nav-links > a')"))
   button=page.locator('.nav-drop-button');button.focus();page.keyboard.press('Enter');page.wait_for_timeout(400)
   check('course_expanded',lambda:assert_js("()=>document.querySelector('.nav-drop-button').getAttribute('aria-expanded')==='true'"))
   page.locator('.nav-dropdown-menu a').last.focus()
   check('last_course_focusable',lambda:assert_js("()=>document.activeElement.getAttribute('href')==='/KPIA/'"))
   check('last_course_within_viewport',lambda:assert_js("()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}"))
   page.keyboard.press('Escape');page.wait_for_timeout(100)
   check('escape_closes_course',lambda:assert_js("()=>document.querySelector('.nav-drop-button').getAttribute('aria-expanded')==='false' && document.activeElement.matches('.nav-drop-button')"))
   page.keyboard.press('Escape');page.wait_for_timeout(100)
   check('escape_closes_menu',lambda:assert_js("()=>!document.querySelector('.site-nav').classList.contains('menu-open') && document.activeElement.matches('.mobile-note')"))
   page.set_viewport_size({'width':1440,'height':900});page.wait_for_timeout(200)
   check('resize_restores_desktop_nav',lambda:assert_js("()=>!document.querySelector('.nav-links').inert"))
  else:
   button=page.locator('.nav-drop-button');button.focus();page.keyboard.press('Enter');page.wait_for_timeout(200)
   check('keyboard_opens_desktop_course',lambda:assert_js("()=>document.querySelector('.nav-drop-button').getAttribute('aria-expanded')==='true'"))
   page.keyboard.press('Tab')
   check('tab_enters_course',lambda:assert_js("()=>!!document.activeElement.closest('.nav-dropdown-menu')"))
   page.keyboard.press('Escape')
   check('escape_restores_course_button',lambda:assert_js("()=>document.querySelector('.nav-drop-button').getAttribute('aria-expanded')==='false' && document.activeElement.matches('.nav-drop-button')"))
   page.locator('.logo').focus();page.mouse.move(width-5,height-5);button.hover();page.wait_for_timeout(200)
   check('mouse_hover_opens_course',lambda:assert_js("()=>getComputedStyle(document.querySelector('.nav-dropdown-menu')).visibility==='visible'"))
  rows.append(row);Path(a.out).write_text(json.dumps({'base':a.base,'fonts_blocked_for_semantics_test':True,'rows':rows},ensure_ascii=False,indent=2));c.close()
 b.close()
Path(a.out).write_text(json.dumps({'base':a.base,'rows':rows},ensure_ascii=False,indent=2))
print(json.dumps(rows,ensure_ascii=False,indent=2))

raise SystemExit(1 if any(v.startswith("FAIL") for r in rows for v in r["checks"].values()) else 0)
