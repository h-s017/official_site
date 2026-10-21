# 第二階段最終 Lighthouse 實驗室結果

同一環境、同 baseline `0c47a0e`、gzip loopback server、冷瀏覽器，每個主要 mobile 頁面各三次 before／after。先完成交錯配對探索，再對最後的本機字體及封面變體版本重跑 after；不是同時測量或 field A/B。外部 CMS／CJK 字體與代理仍可能波動。Chrome／Lighthouse 版本及模擬參數同 TEST-RESULTS。

## Mobile 中位數（每欄 n=3）

| 頁面 | Performance 前→後 | Accessibility 前→後 | LCP 秒 前→後 | CLS 前→後 | 最後版 LCP 三次（秒） |
|---|---|---|---|---|---|
| home | 55→69 | 96→96 | 36.912→7.881 | 0.0000→0.0000 | 7.511／7.881／7.954 |
| courses | 56→100 | 100→100 | 14.469→1.655 | 0.0000→0.0021 | 1.655／1.655／1.653 |
| journal | 55→97 | 87→100 | 16.863→2.466 | 0.0000→0.0000 | 2.108／2.466／2.565 |
| news | 55→99 | 100→100 | 15.557→2.109 | 0.0000→0.0000 | 1.804／2.109／2.251 |

Journal 的實驗室中位數達到本次內部門檻；其中一次 LCP 仍略高於 2.5 秒，不能視為所有訪客／每次載入都達標。首頁 mobile Performance／LCP 仍未達目標，沒有以其他頁高分替代。課程頁第一次提早載入規則的版本曾出現 CLS 約 0.151，已透過同版本 Latin／數字字體的本站 preload 消除，最後三次均約 0.002。

基準 Journal 整頁 CLS 三次為 0、0、約 0.925，中位數因此是 0；不能寫成其整頁中位數從 0.611 降到 0。0.611／0.587 是另以「資料延遲後回傳」控制測得的 Journal／消息刷新位移，最後版該情境均為 0，見 state-checks.json。

## 其餘最後版本測量（單次，非三次中位數）

| 頁面 | 模式 | Performance | Accessibility | LCP 秒 | CLS |
|---|---|---|---|---|---|
| home | desktop | 92 | 95 | 1.637 | 0.0000 |
| journal | desktop | 100 | 100 | 0.577 | 0.0003 |
| journal-all | mobile | 100 | 100 | 1.658 | 0.0000 |
| overture-series | mobile | 99 | 100 | 1.803 | 0.0000 |
| overture | mobile | 86 | 100 | 4.130 | 0.0019 |
| kpia | mobile | 100 | 100 | 1.654 | 0.0000 |
| helori | mobile | 99 | 100 | 1.803 | 0.0023 |
| practice | mobile | 100 | 96 | 1.655 | 0.0028 |
| incubation | mobile | 99 | 100 | 1.656 | 0.0000 |
| business | mobile | 99 | 100 | 1.653 | 0.0000 |
| product-development | mobile | 100 | 100 | 1.654 | 0.0000 |
| contact | mobile | 99 | 100 | 1.809 | 0.0000 |

## 可追溯性與限制

- 最後版本 24 份報告見 benchmarks-release/，完整 JSON 以 gzip 保存；基準 before 見 benchmarks-final/。summary.json 保存 exit code、runtimeError、版本與 runWarnings，不只選高分。
- Lighthouse mobile 預設 412×823、RTT150ms、1638.4Kbps、CPU×4；desktop preset。與 Playwright 四種 viewport 是不同測試。
- 測試 server 對 HTML／CSS／JS 使用 gzip（已確認正式 Pages 的 CSS 也使用 gzip），避免以未壓縮本機環境誤導比較；仍非正式 CDN／網路的真實使用分布。
- 沒有 CrUX／RUM，也沒有真實使用者 INP。TBT 是實驗室指標，不能代稱 INP≤200ms。沒有宣稱 field Core Web Vitals 或全站 WCAG AA 已通過。
- 本階段不執行預約／付款；使用者已告知付款測試完成。
