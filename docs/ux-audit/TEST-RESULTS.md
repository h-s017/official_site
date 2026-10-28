# 首頁效能重測｜main1423a14

正式首頁main1423a14重測：手機首次／略過開場、桌機首次各三次Lighthouse。中位Performance為56／76／90，LCP20.94／5.92／1.83秒；CLS九輪均<0.1，桌機一輪LCP3.63秒／76分，不能宣稱穩定達標。無可用CrUX／RUM，TBT不等於INP。本批僅量測、沒有產品修改。 [完整數據、環境與限制](home-performance-retest/README.md)。

---

# 消息無摘要與透明度更新｜2026-10-24

四viewport＋長內容／三則上限、API失敗與no-JS共7/7，精確檢查70%圓鈕及55%導覽背景、無摘要、標題連結、原圖文字級與無溢出。局部axe零違規，半透明導覽有背景判定incomplete；非全站或真機驗收。未載入預約付款。 [截圖、結果與限制](news-title-opacity/README.md)。

---

# 手機Hero與半透明導覽／圓鈕｜2026-10-24

Hero／圓鈕5viewport+no-JS 6/6，另三頁導覽14/14；幾何驗證文字四角在圓內、正常與聚焦CTA axe零違規，導覽局部axe零違規。WebKit因缺依賴不可用，未做iPhone／Instagram真機；無新增Lighthouse／真實使用者效能數據，未載入預約付款。 [前後截圖、測試及限制](mobile-square-hero/README.md)。

---

# 首頁消息精簡列表｜2026-10-24

四viewport加長內容／三則上限、API失敗及no-JS共7/7；檢查順序、無溢出、焦點、連結與觸控高度，消息區axe零違規。手機第一則240.8→127px、桌機269.3→147px。無新增Lighthouse／實際使用者效能數據，未載入預約或付款。 [前後圖及證據](news-compact/README.md)。

---

# 炭灰蕾絲蝴蝶結預約與移除重播入口｜2026-10-24

指定新圖、入口移除、首次開場與同session不重播、炭灰樣式、尺寸、無溢出、焦點及浮動／頁尾等6情境通過；CTA axe零違規。未測正式預約或付款，未重跑Lighthouse。 [截圖及測試](booking-charcoal-lace/README.md)。

---

# 正圓預約按鈕｜2026-10-24

正圓尺寸83.6／91.2px、文字無溢出及原有浮動操作共6情境通過；CTA axe零違規。未測預約付款或Lighthouse。 [截圖及測試](booking-circle/README.md)。

---

# 白底蝴蝶結課程預約｜2026-10-24

五viewport及no-JS共6/6。圖片、尺寸、固定定位、鍵盤焦點、頁尾與選單／開場均通過；axe只檢查CTA。未測正式預約或付款，未重跑效能測試。 詳細圖與證據：[booking-bow](booking-bow/README.md)。

---

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

## 第四階段：首頁品牌 h1

`home-h1/check.py`：四 viewport 與 no-JS 共 5/5，唯一可及 h1 為 HANA SCENT ARTIST，三項 heading axe 規則零違規；同頁移除／還原 h1 的既有 nav／hero／服務／footer 幾何相同，零水平溢出。手機／桌機預覽及 runtime 標題大綱見 `home-h1/`。未重跑 Lighthouse，未宣稱全站 AA 或實體螢幕閱讀器驗收；付款未重測。

## 2026-10-23：恢復藝術開場及原透明 ENTER

依使用者最新指示恢復首次 session 自動藝術開場；同 session 關閉後不重複出現，首頁保留手動重播。ENTER 為原白色直排、透明背景、原文字陰影；保留 44px 觸控範圍。首次不顯示額外焦點框，鍵盤操作後顯示焦點。

四 viewport＋儲存不可用／reduced-motion／no-JS 共 7 個功能情境通過；Enter／關閉／Escape、返回焦點、暫停與品牌 h1 保留。原始 axe 結果含 `color-contrast` 違規及 incomplete：透明白字在影像上的對比未全面通過，不聲稱 AA。本次依核定樣式保留透明 ENTER。證據在 `restored-intro/`。

本次未重跑 Lighthouse；先前可選入口 Performance 99／LCP 2.179s 等是當時版本，不代表恢復自動開場後的效能。沒有 field CrUX／RUM／INP 驗收；付款未重測。

## 2026-10-23：Vol.1／局部對比追蹤

同 main 61600e4 基準、相同 gzip fixture 與 Lighthouse 12.8.2，兩頁各前後三次冷快取。完整數據、區間、撤回試驗與限制見 [本批報告](followup-20261023/README.md)。

| 頁面 | Performance 中位數前→後 | Accessibility 前→後 | LCP 秒前→後 | CLS 前→後 |
|---|---|---|---|---|
| 首頁（自動開場） | 75→73 | 93→93 | 8.115→9.162 | 0.0265→0.0265 |
| Vol.1 | 86→100 | 100→100 | 4.205→1.731 | 0.00194→0.00194 |

首頁 LCP 前範圍 7.748–14.471s、後 6.913–14.772s；本批只改入口索引小字色彩，不保留任何首頁效能試驗，不宣稱改善。Vol.1 三次均達 lab 內部目標；TBT 中位數 32→55.5ms，不代稱 INP。CLS 原本已低於 0.1，未作改善主張。

六頁×四 viewport 最終 24/24 完成、零 axe 違規（關閉開場後內容）、零 root 溢出、零 JS pageerror；首頁既有 page_contents 404 仍回退靜態內容。ENTER 七情境通過；透明影像文字仍有 axe 對比違規及 incomplete，與主頁內容分開記錄。Vol.1 選圖與解碼兩情境通過。文字／連結／圖片 alt 保存比較與靜態語法檢查通過。未宣稱全站 AA、field CWV 或 INP 達標；不重跑預約／付款。

發布後：PR #18、Pages run 39931775258 成功；正式站 14 個產品／保留檔案 SHA-256 相符、六頁四 viewport 24/24 主內容零 axe 違規及 root 溢出，ENTER 七功能情境通過。沒有重跑 Lighthouse／付款，已知透明文字對比及 CMS 404 保留。[正式證據](followup-20261023/PRODUCTION.md)。後續證據提交僅修改 docs。

## 2026-10-23：取消開場右上角字樣

`clean-intro/check.py` 七情境通過；取消右上角白底控制項，保留透明 ENTER、Escape、焦點與 session；暫停改為 Tab 聚焦才在下方顯示，Space 可暫停。四 viewport 預覽及完整 axe 在 `clean-intro/`，影像文字的已知對比限制未宣稱通過。未重跑 Lighthouse／預約／付款。舊開場測試腳本屬舊版本，本批以新腳本為準。

## 2026-10-23：觸控進站後標題外框

`logo-focus/check.py` 重現四 viewport 的 pointer 關閉後 `focus-visible:true / outline:auto`；修正後保持焦點位置，outline:none，鍵盤操作恢復 solid 2px，四組均零溢出；另首次鍵盤關閉一情境，共 5/5。既有 clean-intro 七情境 7/7。資料及前後截圖在 logo-focus/，未做實體 Android WebView、Lighthouse 或付款測試。

## 2026-10-24：醒目課程預約入口

`booking-cta-preview/check.py` 六 viewport（390、768、1440、320、1200、1199px）及手機／桌機 no-JS 共8/8，主要四尺寸進站首屏可見預約入口、按鈕高度≥44px、鍵盤可見、CTA 範圍 axe 零違規、根頁無橫向溢出。原藝術開場、重播／Escape／焦點正常。連結點擊以攔截回應驗證目標，不載入正式預約應用，不建立訂單／測付款。1199px 基準原有29px溢出已由局部面板右對齊修正（UX-012）。未重跑 Lighthouse，不宣稱整頁 AA／field CWV。

## 2026-10-24 後續：滿寬Hero與漂浮預約

實測HINENI Hero為滿寬78vh/對應clamp；HANA手機原圖內含品牌字，先採滿寬16:9保留完整文字，不聲稱相同高度。hero-floating/check.py 五viewport（390／768／1440／320／1199px）＋no-JS 共6/6，頁首／中段／頁尾按鈕座標固定、CTA高度≥52px、footer位於按鈕上方、root零溢出、CTA範圍axe零違規；開場／重播／手機選單／短螢幕正常。未測實體手機安全區／Lighthouse／field效能或付款；目的地攔截回應，不載入預約應用。資料及跨裝置截圖見hero-floating/。
