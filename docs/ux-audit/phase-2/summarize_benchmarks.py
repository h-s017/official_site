"""Generate final lab summary without replacing historical measurements."""
import json,statistics
from pathlib import Path
OUT=Path(__file__).resolve().parent
before=json.loads((OUT/'benchmarks-final/summary.json').read_text());after=json.loads((OUT/'benchmarks-release/summary.json').read_text())
assert len(after)==24 and all(x['code']==0 and not x['runtimeError'] for x in after),'Incomplete final measurement batch'
def med(rows,key,kind='metrics'):return statistics.median(x[kind][key] for x in rows)
text='''# 第二階段最終 Lighthouse 實驗室結果

同一環境、同 baseline `0c47a0e`、gzip loopback server、冷瀏覽器，每個主要 mobile 頁面各三次 before／after。先完成交錯配對探索，再對最後的本機字體及封面變體版本重跑 after；不是同時測量或 field A/B。外部 CMS／CJK 字體與代理仍可能波動。Chrome／Lighthouse 版本及模擬參數同 TEST-RESULTS。

## Mobile 中位數（每欄 n=3）

| 頁面 | Performance 前→後 | Accessibility 前→後 | LCP 秒 前→後 | CLS 前→後 | 最後版 LCP 三次（秒） |
|---|---|---|---|---|---|
'''
for name in ['home','courses','journal','news']:
 b=[x for x in before if x['phase']=='before' and x['page']==name and x['mode']=='mobile'];a=[x for x in after if x['page']==name and x['mode']=='mobile'];assert len(a)==len(b)==3
 text+=f"| {name} | {med(b,'performance','scores')*100:.0f}→{med(a,'performance','scores')*100:.0f} | {med(b,'accessibility','scores')*100:.0f}→{med(a,'accessibility','scores')*100:.0f} | {med(b,'largest-contentful-paint')/1000:.3f}→{med(a,'largest-contentful-paint')/1000:.3f} | {med(b,'cumulative-layout-shift'):.4f}→{med(a,'cumulative-layout-shift'):.4f} | "+'／'.join(f"{x['metrics']['largest-contentful-paint']/1000:.3f}" for x in a)+' |\n'
text+='''
Journal 的實驗室中位數達到本次內部門檻；其中一次 LCP 仍略高於 2.5 秒，不能視為所有訪客／每次載入都達標。首頁 mobile Performance／LCP 仍未達目標，沒有以其他頁高分替代。課程頁第一次提早載入規則的版本曾出現 CLS 約 0.151，已透過同版本 Latin／數字字體的本站 preload 消除，最後三次均約 0.002。

基準 Journal 整頁 CLS 三次為 0、0、約 0.925，中位數因此是 0；不能寫成其整頁中位數從 0.611 降到 0。0.611／0.587 是另以「資料延遲後回傳」控制測得的 Journal／消息刷新位移，最後版該情境均為 0，見 state-checks.json。

## 其餘最後版本測量（單次，非三次中位數）

| 頁面 | 模式 | Performance | Accessibility | LCP 秒 | CLS |
|---|---|---|---|---|---|
'''
for x in after:
 if x['mode']=='mobile' and x['page'] in ['home','courses','journal','news']:continue
 text+=f"| {x['page']} | {x['mode']} | {x['scores']['performance']*100:.0f} | {x['scores']['accessibility']*100:.0f} | {x['metrics']['largest-contentful-paint']/1000:.3f} | {x['metrics']['cumulative-layout-shift']:.4f} |\n"
text+='''
## 可追溯性與限制

- 最後版本 24 份報告見 benchmarks-release/，完整 JSON 以 gzip 保存；基準 before 見 benchmarks-final/。summary.json 保存 exit code、runtimeError、版本與 runWarnings，不只選高分。
- Lighthouse mobile 預設 412×823、RTT150ms、1638.4Kbps、CPU×4；desktop preset。與 Playwright 四種 viewport 是不同測試。
- 測試 server 對 HTML／CSS／JS 使用 gzip（已確認正式 Pages 的 CSS 也使用 gzip），避免以未壓縮本機環境誤導比較；仍非正式 CDN／網路的真實使用分布。
- 沒有 CrUX／RUM，也沒有真實使用者 INP。TBT 是實驗室指標，不能代稱 INP≤200ms。沒有宣稱 field Core Web Vitals 或全站 WCAG AA 已通過。
- 本階段不執行預約／付款；使用者已告知付款測試完成。
'''
(OUT/'FINAL-PERFORMANCE.md').write_text(text)
p=OUT.parent/'TEST-RESULTS.md';s=p.read_text();marker='\n<!-- PHASE2_PERFORMANCE -->\n';s=s.split(marker)[0]+marker+text.replace('# 第二階段最終 Lighthouse 實驗室結果','## 第二階段最終 Lighthouse 實驗室結果',1).replace('## Mobile','### Mobile').replace('## 其餘','### 其餘').replace('## 可追溯性','### 可追溯性');p.write_text(s)
print('Final lab summary generated')
