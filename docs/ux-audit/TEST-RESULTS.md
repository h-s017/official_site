# 測試結果與驗收限制

> 第二階段（2026-10-21）：Journal 技術方案及修正見 [TECHNICAL-PLAN](phase-2/TECHNICAL-PLAN.md)，內容決策見 [首頁／課程資訊核定表](HOME-COURSE-APPROVAL.md)。下方原階段紀錄保留；最新結果另見本檔後續補充。付款依使用者告知已測試，本階段不重測。

更新：2026-10-21（Asia/Taipei）。產品基準 fd28c1bbcaf4a6236565bf4bf2539ddbe4538d6e，修改版只有 assets/site.js 的導覽行為變更。

## 環境與執行

- 完整 Git clone，Chromium 154.0.8037.57、Python Playwright 1.62.0、Node 24.19.0、axe-core 4.10.3、Lighthouse 12.8.2。
- HTTPS 使用環境代理與已知環境 CA 的 NSS 信任；**未停用 TLS 驗證**。原始 sandbox 曾阻擋 socket，後以獲准的測試權限執行；早期錯誤保留為歷史紀錄，非現在的測試結果。
- 正式站基準：https://hanascent.com/；修改版與原始提交在同一環境的 loopback HTTP server 執行，圖片完整，外部字體／CMS 使用相同外部來源。測試伺服器沒有部署對外站點。
- Playwright 每個入口／viewport 使用新 context；390/320 為 mobile＋touch，768 為 touch，1440 為 desktop。CSS 進場動畫需要捲動才呈現，最終完整截圖使用 instant 捲動觸發；未改產品 CSS 或移除動畫。
- Lighthouse 預設 mobile 412×823、DPR 1.75，simulate：RTT150ms、throughput1638.4Kbps、CPU×4；desktop 使用 preset。這與 Playwright 的四種 viewport 是兩套獨立測試。每組單次，未達三次中位數；代理延遲、快取與外部字體影響很大，不作 field 或統計顯著性主張。

## 跨裝置與互動

| 測試 | 結果 | 證據 |
|---|---|---|
| 正式站 14 入口 × 4 viewport | 56/56 擷取完成，HTTP200；0 root 水平溢出 | before-live-matrix.json |
| 修改版 13 主站入口 × 4 viewport | 52/52 擷取完成；0 root 水平溢出 | after-local-scrolled-matrix.json |
| 原始本機首頁／課程的完整捲動對照 | 8/8 完成 | before-local-scrolled-matrix.json |
| 初始導覽回歸 | 22 項中 9 項失敗（手機隱形焦點、Escape、桌機狀態） | before-nav.json |
| 最終導覽回歸 | 26/26 通過，含新增展開焦點與最後連結 viewport 檢查 | after-nav-final.json |
| 預約流程 | 真實資料讀取，可選系列／課程／日期／時段並進資料步驟；空白驗證正常 | flow-checks.json |
| 合作表單本機攔截測試 | 服務預選正確；失敗保留資料、按鈕重新啟用；成功 reset | flow-checks.json；Formspree POST 在 Playwright 內 fulfill，未寄信 |
| 最新消息 SDK 失敗 | 顯示既有可見錯誤，不永久 loading；撤回 UX-003 | flow-checks.json、before-news-sdk-failure 截圖 |
| 原始碼／語法 | 18 模板 blob 符合基準；node --check site.js 通過；稽核 Python 可編譯、git diff --check 通過 | static-inventory.json；source manifest |

預約有效「確認訂單」就會 POST /api/orders 建單，因此本次停止於 step 4 空資料驗證。沒有正式訂單、付款、信件或 Tally 送出；**未驗證付款完成及報名完成頁**。正式付款測試需要可控的測試後端與金流環境。step 4 的 axe label 問題不能以入口頁 Accessibility100 掩蓋。

## axe 結果

每組執行 WCAG 2A/AA、2.1A/AA、2.2AA tags；incomplete 也保存於 JSON。以下列出各頁跨 viewport 的 violation rule 聯集，數字不是 WCAG 整站合規分數。沒有列出某 rule 不代表人工檢查已通過。

| 頁面 | Before：正式站初始狀態 | After：本機完整捲動 |
|---|---|---|
| home | aria-required-children, color-contrast | color-contrast |
| courses | aria-required-children | 本次狀態未報 violation |
| overture-series | aria-required-children | 本次狀態未報 violation |
| overture | aria-required-children | 本次狀態未報 violation |
| kpia | aria-required-children | color-contrast |
| helori | aria-required-children | 本次狀態未報 violation |
| practice | aria-required-children, color-contrast | color-contrast |
| incubation | aria-required-children | 本次狀態未報 violation |
| business | aria-required-children | 本次狀態未報 violation |
| product-development | aria-required-children | color-contrast |
| journal | aria-required-children, color-contrast, link-name, target-size | color-contrast, link-name, target-size |
| news | aria-required-children | 本次狀態未報 violation |
| contact | aria-required-children | 本次狀態未報 violation |
| booking | 本次狀態未報 violation | 未修改；step4另報 label |

手機導覽的 aria-required-children 已消除，且用真正鍵盤測試證明隱形焦點修正。前後 screenshot 的進場動畫／CMS 資料時間點不同，新增或減少的其他對比警示不可直接歸因為程式修正。首頁、序曲系列、HELORI、自修室及 Journal 仍須依最新 nodes 審查。

## Lighthouse 初始實驗室數據

完整報告保存在 results/lighthouse/*.json.gz，可解壓 JSON；不是只有截取分數。分數與所有 metric 均為單次 lab。TBT 不是 INP。

| 入口 | 模式 | Performance | Accessibility | LCP(s) | TBT(ms) | CLS |
|---|---|---:|---:|---:|---:|---:|
| home | mobile | 53 | 91 | 37.0 | 180 | 0.000 |
| home | desktop | 67 | 95 | 5.0 | 0 | 0.000 |
| courses | mobile | 56 | 94 | 14.5 | 0 | 0.000 |
| overture-series | mobile | 56 | 94 | 16.0 | 0 | 0.000 |
| overture | mobile | 56 | 94 | 17.7 | 0 | 0.000 |
| kpia | mobile | 56 | 94 | 14.7 | 0 | 0.000 |
| helori | mobile | 56 | 94 | 14.6 | 0 | 0.000 |
| practice | mobile | 55 | 95 | 16.1 | 0 | 0.000 |
| incubation | mobile | 56 | 94 | 15.2 | 0 | 0.000 |
| business | mobile | 55 | 94 | 15.9 | 0 | 0.000 |
| product-development | mobile | 56 | 94 | 15.4 | 0 | 0.000 |
| journal | mobile | 36 | 83 | 16.1 | 128 | 0.411 |
| news | mobile | 38 | 94 | 13.6 | 0 | 0.375 |
| contact | mobile | 55 | 94 | 13.9 | 94 | 0.000 |
| booking | mobile | 56 | 100 | 10.1 | 0 | 0.000 |

## 相同本機條件抽樣比較

兩份本機服務分別從基準提交與修改版提供相同資產；每組仍只有一次，不將分數波動解讀為已證實效能改善或退化。

| 頁面／模式 | Performance before→after | Accessibility before→after | LCP before→after(s) | CLS before→after |
|---|---|---|---|---|
| home/mobile | 55→55 | 91→96 | 37.502→37.507 | 0.018→0.000 |
| home/desktop | 71→66 | 95→95 | 4.963→5.287 | 0.000→0.000 |
| courses/mobile | 56→56 | 94→100 | 14.700→14.668 | 0.000→0.000 |

導覽修正使本機課程 mobile Accessibility94→100、首頁 mobile91→96；首頁仍有其他無障礙問題，不能宣稱 AA 通過。Performance 未達90，沒有因本次導覽修正聲稱效能優化達標。首頁 desktop71→66 屬單次觀測差異，需固定環境三次中位數與 trace 才能判斷。

## 尚未完成的驗收

- LCP≤2.5s、Performance≥90：本次 lab 未達；字體／圖片／阻塞資源與 trace 需後續改善。Journal／News 初始 lab CLS0.411／0.375 亦高於0.1。
- 真實使用者 LCP／INP／CLS：沒有 CrUX 或 RUM，無法確認第75百分位及觀測期間，不宣稱任何 field 達標。INP≤200ms 未驗證。
- WCAG2.2 AA：axe 已執行且有待修違規；尚未完成 VoiceOver/NVDA、全面對比、200%縮放、iOS/Android實機與第三方全部表單狀態的人工驗收。
- 初始 viewport root 無溢出不等於所有選單、圖片裁切、sticky焦點與動畫狀態都已全面通過；本次人工圖像檢查與程式檢查只能覆蓋已保存狀態。特別是 ENTER 是否增加轉換成本、長文章閱讀與第三方表單需再做人測。
- 舊 client redirect 的完整鏈、實際 LINE/Tally 回覆、PIF表單所有狀態、正式建單／付款完成尚未驗證。

## 重跑

1. 完整 checkout，保留原圖。固定 axe-core4.10.3、Lighthouse12.8.2，Python Playwright1.62.0 與 Chromium154；安裝到獨立 /tmp audit prefix，不修改站台執行依賴。
2. `capture_matrix.py --base <origin> --label <unique-label> --out <artifact-dir> --axe <local-axe.min.js>`，執行四 viewport。標籤不可覆寫；啟動瀏覽器需要可用 socket、代理與 CA 信任。此腳本不送表單，不執行付款。
3. `nav_regression.py --base <origin> --out <json>`；會針對語意測試阻擋 Google Fonts，避免下載影響焦點斷言。正式矩陣與 Lighthouse 沒有阻擋字體。FAIL 會回傳非零。
4. `lighthouse_batch.py --base <origin> --label <unique-label> --out <reports> --lighthouse <cli/index.js>`；輸出完整 gzip JSON 與 summary。相同主機條件重複至少三次後比較中位數。
5. `flow_checks.py` 是本次讀取預約、localhost:8010合作表單攔截與SDK失敗測試；使用前改為正確本機 port，POST/PUT/PATCH/DELETE 有攔截，不用它建立正式訂單。

第一輪的 browser_audit.py / before-browser.json 為歷史診斷；最新成功證據以 capture_matrix.py 的指定 JSON 為準。未取得額外環境權限或有效CA時，請記錄限制，不關閉 TLS 驗證，不將錯誤頁截圖作成功結果。

## 第二階段：最後固定版本的回歸

基準：`0c47a0e3ae915b585f9f0de6fbd4634790509f90`，已含上一批已發布導覽修正。測試版本的逐檔 SHA-256 見 `phase-2/source-manifest.json`。沿用同一 Chromium／Playwright／axe／Lighthouse 版本與可信 CA；沒有停用 TLS。

| 測試 | 最後結果 | 證據 |
|---|---|---|
| 14 主站內容頁×4 viewport | 56/56，HTTP 200；0 root 水平溢出、0 JS error、0 破圖 | `phase-2/results/release-matrix.json` |
| Journal／archive／消息 axe | 三頁×四 viewport 全為零 violation；原本 Journal 三類、archive 兩類違規已消除 | 同上；`phase-2/results/before-matrix.json` |
| 共用導覽互動 | 26/26 通過 | `phase-2/navigation-release.json` |
| 資料延遲／更新／空／SDK 失敗／no-JS | 18/18；另三頁 Asia/Taipei 相同資料刷新 3/3 通過 | `phase-2/state-checks.json` |
| 自訂／原始 CMS HERO、Journal 鍵盤焦點及目標尺寸 | 6/6 通過 | `phase-2/edge-checks.json` |
| 同資料刷新位移 | Journal 舊版 0.611、News 舊版 0.587 → Journal／archive／News 均 0，且保留聚焦節點；Journal posts GET 2→1 | `phase-2/state-checks.json`，不是整頁 CLS |
| 內容保留 | 28 份模板除三個公開內容快照外，body 文字節點 multiset 相同；首頁只對齊既有最終順序 | `phase-2/content-preservation.json` |
| 付款／預約 | 依使用者指示不重測，不訪問預約流程、不建單 | 所有本階段腳本的 PAGES／route 範圍 |

56 組包含首頁、課程總覽、序曲系列／Vol.1、KPIA、HELORI、氣味自修室、藝術育成、品牌合作、產品開發、Journal、消息、聯絡及 Journal 全文列表。Viewport 為 390×844、768×1024、1440×900、320×844；完整截圖索引見 phase-2/README.md。這是瀏覽器模擬，沒有實體手機／完整螢幕閱讀器認證。axe 的 incomplete 已保留；其他頁面仍有對比違規，不宣稱全站 WCAG AA。

既有 `page_contents` 公開請求在首頁／聯絡共八組回傳 404，頁面沿用原有靜態內容；其他頁面沒有因此新增錯誤。本批沒有建立／改動 CMS 表格。SDK 故障／no-JS 的公開內容 fallback 通過，但離線快照可能落後 CMS，發布／撤稿維護方式見 TECHNICAL-PLAN。

<!-- PHASE2_PERFORMANCE -->
## 第二階段最終 Lighthouse 實驗室結果

同一環境、同 baseline `0c47a0e`、gzip loopback server、冷瀏覽器，每個主要 mobile 頁面各三次 before／after。先完成交錯配對探索，再對最後的本機字體及封面變體版本重跑 after；不是同時測量或 field A/B。外部 CMS／CJK 字體與代理仍可能波動。Chrome／Lighthouse 版本及模擬參數同 TEST-RESULTS。

### Mobile 中位數（每欄 n=3）

| 頁面 | Performance 前→後 | Accessibility 前→後 | LCP 秒 前→後 | CLS 前→後 | 最後版 LCP 三次（秒） |
|---|---|---|---|---|---|
| home | 55→69 | 96→96 | 36.912→7.881 | 0.0000→0.0000 | 7.511／7.881／7.954 |
| courses | 56→100 | 100→100 | 14.469→1.655 | 0.0000→0.0021 | 1.655／1.655／1.653 |
| journal | 55→97 | 87→100 | 16.863→2.466 | 0.0000→0.0000 | 2.108／2.466／2.565 |
| news | 55→99 | 100→100 | 15.557→2.109 | 0.0000→0.0000 | 1.804／2.109／2.251 |

Journal 的實驗室中位數達到本次內部門檻；其中一次 LCP 仍略高於 2.5 秒，不能視為所有訪客／每次載入都達標。首頁 mobile Performance／LCP 仍未達目標，沒有以其他頁高分替代。課程頁第一次提早載入規則的版本曾出現 CLS 約 0.151，已透過同版本 Latin／數字字體的本站 preload 消除，最後三次均約 0.002。

基準 Journal 整頁 CLS 三次為 0、0、約 0.925，中位數因此是 0；不能寫成其整頁中位數從 0.611 降到 0。0.611／0.587 是另以「資料延遲後回傳」控制測得的 Journal／消息刷新位移，最後版該情境均為 0，見 state-checks.json。

### 其餘最後版本測量（單次，非三次中位數）

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

### 可追溯性與限制

- 最後版本 24 份報告見 benchmarks-release/，完整 JSON 以 gzip 保存；基準 before 見 benchmarks-final/。summary.json 保存 exit code、runtimeError、版本與 runWarnings，不只選高分。
- Lighthouse mobile 預設 412×823、RTT150ms、1638.4Kbps、CPU×4；desktop preset。與 Playwright 四種 viewport 是不同測試。
- 測試 server 對 HTML／CSS／JS 使用 gzip（已確認正式 Pages 的 CSS 也使用 gzip），避免以未壓縮本機環境誤導比較；仍非正式 CDN／網路的真實使用分布。
- 沒有 CrUX／RUM，也沒有真實使用者 INP。TBT 是實驗室指標，不能代稱 INP≤200ms。沒有宣稱 field Core Web Vitals 或全站 WCAG AA 已通過。
- 本階段不執行預約／付款；使用者已告知付款測試完成。

## 發布後正式站確認

PR #13 已合併，Pages run 39550567267 成功。`phase-2/production/` 保存 15/15 程式資產 SHA-256 比對、Journal／archive／News 12/12 四 viewport（axe 零違規、零 root 溢出）、正式導航 26/26；另附正式 Journal 手機／桌機截圖。這些是唯讀發布後 smoke tests，不是另一輪 Lighthouse 或 field 驗收；付款未重測。後續提交僅保存證據，不修改產品程式。

## 第三階段：ENTER 可選入口

使用者核定可選入口並先提供預覽。`optional-enter/check.py` 的 7 情境全部通過，四 viewport 初訪未開啟藝術影像、無 intro 圖片請求、零 root 溢出；modal 背景不能聚焦，Escape／兩個關閉控制返回焦點，暫停、no-JS、儲存不可用與 reduced-motion 正常。四份 modal axe 零違規。預覽與原始結果在 `optional-enter/`。

首頁 mobile 最後三次 lab 中位數：Performance 69→99、Accessibility 96→96、LCP 7.881→2.179s、CLS 0→0.0265。既有首頁對比與 h1 決策尚未完成；沒有 CrUX／RUM／INP 驗收。本階段沒有進行預約或付款。
