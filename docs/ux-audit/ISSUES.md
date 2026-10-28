# 問題清單

有效問題 **13 項：P0 1（已修正）、P1 10、P2 2**。新增UX-014並修正；2026-10-24新增UX-013並完成；2026-10-24 補測新增 UX-012，已修正；下方舊階段 10 項為歷史快照。另 UX-003 撤回、不計入。正式站 56 組與最終本機 52 組跨裝置檢查已完成；未宣稱全站 WCAG 達標。第二階段另修正 UX-009、UX-010；其餘未完成項目的「修改檔案」仍為建議位置。

## UX-001｜P0：手機閉合導覽可進入隱形焦點（已修正）

- URL：https://hanascent.com/courses/；其他共用導覽頁。
- 裝置／Viewport：390×844、320×844 重現；768×1024、1440×900 回歸。
- 問題描述：MENU 關閉後，第 2 次 Tab 進入 opacity:0 的此域連結，後續也能聚焦不可見課程；桌機按鈕開關狀態與 aria-expanded 不一致，Escape 不歸還焦點。role=menu 的一般連結結構另被 axe 標為 aria-required-children。
- 重現步驟：載入課程頁，不開 MENU，連按 Tab；展開課程，聚焦最後連結，再按 Escape；桌機以 Enter 開關課程。基準 source 與正式站皆已測。
- 使用者影響：鍵盤使用者看不到位置，主要課程導覽難以操作。
- 優先級：P0。
- 修改檔案：`assets/site.js` 的全域 disclosure CSS 與 renderNavigation；不改價格、名稱、URL 或付款。
- 驗收條件：閉合內容不進入焦點／輔具樹，展開後可達所有課程且最後連結在 viewport 內；Escape 回觸發按鈕；滑鼠、鍵盤、resize 正常；aria-expanded 真實同步。
- 完成狀態：已修正並通過 26/26 最終互動檢查；主站 52 組最終矩陣未再報 aria-required-children。保留 inert 與原生 disclosure，未全面重寫共用元件。
- 截圖：`screenshots/before-live-courses-390x844-menu-courses.png`、`screenshots/after-local-scrolled-courses-390x844-menu-courses.png`。不可見焦點的決定性證據是 `results/before-nav.json` 的 activeElement，靜態圖無法單獨證明；結果見 after-nav-final.json。

## UX-002｜首頁 ENTER 的焦點與動態入口

- URL：https://hanascent.com/
- 裝置／Viewport：全部四種，首次 session。
- 描述：intro 是覆蓋全畫面的 div；僅 body overflow:hidden。沒有背景 inert、首次焦點設定、關閉後焦點目標；closeIntro 刪除含目前按鈕的節點。提供 reduced-motion，但仍須測暫停及鍵盤。
- 重現步驟：新 session 首頁，以 Tab 移至 ENTER，再繼續 Tab；檢查背景是否可聚焦。Enter 關閉後記錄 activeElement、閱讀位置；另試 reduced-motion。
- 使用者影響：可能失去焦點、聚焦被覆蓋內容；所有首次訪客多一個入口步驟。
- 優先級：P1。
- 修改檔案：`index.html:266`、`index.html:390`；首頁互動方案須審核。
- 驗收條件：保留或調整 ENTER 須人工核定；若保留，初始焦點可見、背景不能聚焦、關閉後可繼續主流程，動畫可依使用者偏好停止；不用滑鼠也可完成入口。
- 截圖：screenshots/before-live-home-390x844-intro.png、before-local-scrolled-home-390x844.png；intro 的完整輔具行為仍待人工測試。
- 狀態：第三階段方案已由使用者核定，改為可選藝術影像 dialog，首頁直接可用；原生 modal 隔離背景焦點，Escape／關閉／ENTER 返回觸發按鈕，提供暫停及 reduced-motion。7 情境通過、四 viewport dialog axe 零違規。證據：`optional-enter/results.json`、`optional-enter/README.md`。

## UX-003｜消息永久載入推論（撤回，不計入有效問題數）

- URL：https://hanascent.com/news/
- 裝置／Viewport：390×844；SDK 失敗情境。
- 問題描述：初步只讀 hana-cms.js 推測 News 卡住，忽略 news/index.html 自己的 fallback；完整瀏覽器已證明 SDK 阻擋後顯示「目前無法載入最新消息。」。
- 重現步驟：Playwright 攔截 SDK 並重載 News，等待 2.5 秒；結果沒有持續顯示 loading。
- 使用者影響：本次未重現先前推論的永久 loading。
- 優先級：撤回，非 P0/P1/P2 有效項。
- 修改檔案：無產品修改；更正本報告。
- 驗收條件：正常、失敗與空資料應分開辨識。這次驗證了 SDK 失敗提示；長時間 pending 的 timeout 仍可另評估，不以此虛報缺陷。
- 完成狀態：撤回；證據 results/flow-checks.json。
- 截圖：screenshots/before-news-sdk-failure-390x844.png。

## UX-004｜課程資訊未能跨預約來源完成一致性驗證

- URL：https://hanascent.com/KPIA/；https://hanascent.com/helori/；https://reservation.hanascent.com/
- 裝置／Viewport：全部四種。
- 描述：KPIA、HELORI 主頁未明列費用與總時數；KPIA 成品件數也未明列。導覽與內容的 KPIA 名稱有差異。已完成主站、預約設定與公開場次比對，未發現數值價格衝突；主頁缺項仍需核定。合報主站描述可一次完成，但預約要求兩個日期；陪同／舊生方案在預約 UI 提示私訊，均列流程差異。
- 重現步驟：讀主頁課程資訊，比較課程總覽、導覽、預約方案、LINE 核定資料；逐欄記名稱／費用／時數／作品／報名方式。不可用推測補值。
- 使用者影響：選課前可能需額外詢問，無法直接比較投入成本。
- 優先級：P1（內容決策）。
- 修改檔案：`KPIA/index.html`、`helori/index.html`、`assets/site.js:119`；預約站需另確認部署 Repository，不在本 PR 擅改。
- 驗收條件：品牌核定各課程資料與揭露方式，主站／預約來源一致；發現衝突只列清單，不自行選價格；在受控環境完成預約。
- 截圖：screenshots/before-live-kpia-390x844.png、before-live-helori-390x844.png、before-live-booking-step4-390x844.png。
- 完成狀態：跨來源已比對，無已知價格衝突；名稱、合報排程、資訊揭露與方案引導待人工決策。預約完成尚未驗證。

## UX-005｜首頁缺少語意主標

- URL：https://hanascent.com/
- 裝置／Viewport：全部四種及輔具閱讀。
- 描述：首頁 source h1 數為 0；目前章節從 h2 開始，現有首頁 runtime 改寫亦未建立 h1。缺 h1 本身不能單獨判定 WCAG 失敗。
- 重現步驟：檢視 source inventory 的 h1_count，再用載入完成後 DOM 與螢幕閱讀器標題清單核對。
- 使用者影響：主題與章節層級不易透過標題導覽理解。
- 優先級：P1。
- 修改檔案：`index.html`；主視覺開頭加入品牌 h1 及局部 visually-hidden CSS，未修改共用 JS。
- 驗收條件：一個能表達首頁主題的主標、各節 h2/h3 合理，現有版面及品牌字體保留；視覺與輔具均人工檢查。
- 截圖：screenshots/before-local-scrolled-home-390x844.png；heading 結構見矩陣 layout.h1。
- 完成狀態：使用者已核定品牌 h1，先提供預覽後依既有授權發布。四 viewport 與 no-JS 共 5/5，唯一 h1 的可及名稱為 HANA SCENT ARTIST；heading 三項 axe 規則零違規，原版面幾何相同。證據：`home-h1/results.json` 與預覽。未做實體螢幕閱讀器測試，完整人工輔具驗收仍有此限制。

## UX-006｜小字與觸控目標需逐元件確認

- URL：https://hanascent.com/；共用 Footer／導覽所在頁。
- 裝置／Viewport：390×844、320×844，另測 tablet。
- 描述：News 部分 meta／CTA 11.5px、MENU 11px、Footer 社群連結 30×30；導覽高度常為 32–34px。CSS 多層覆寫，無法僅憑宣告確認最後尺寸。44px 是本案建議，WCAG AA 的最小 target 與間距例外需另判斷。
- 重現步驟：量測 computed font-size、line-height、client rect 與相鄰目標間距；以手機觸控及 200% 縮放閱讀。
- 使用者影響：可能讀取費力或誤觸；尚未確認實際 WCAG 不符合項。
- 優先級：P1（待實測）。
- 修改檔案：`assets/site.js:24`、`assets/site-core.js:299`、`assets/hana-cms.js:63`、`index.html`。
- 驗收條件：關鍵內文符合閱讀需求，主要 CTA 建議 ≥44px；其餘符合 WCAG 2.2 AA target／間距要求；調整後無換行遮擋或橫向溢出。
- 截圖：screenshots/before-local-scrolled-home-390x844.png；具體 nodes 見 axe JSON。
- 完成狀態：已量測；首頁實現想像入口的小字在 #fafafa 上 #767676 對比 4.35:1，axe 報 color-contrast，自修室亦有對比警示。未調整品牌色；其餘字級／目標需按實際 axe nodes 與間距例外判讀。

## UX-007｜大圖與缺少尺寸預留的效能風險

- URL：https://hanascent.com/；其他使用同資產的頁面。
- 裝置／Viewport：390×844、1440×900，冷快取。
- 描述：manifest 中首頁 HERO PNG 2,224,150 bytes、肖像 843,655 bytes、黑色 logo 742,743 bytes；首頁主圖未明列 width／height。尺寸大與未預留比例是風險，不等於已量到 LCP／CLS 超標。
- 重現步驟：完整下載資產，在相同節流／快取條件量測瀑布圖、LCP 元素、載入前後幾何尺寸；核對 responsive image 選擇與畫質。
- 使用者影響：可能增加行動下載量、延後主圖呈現或產生位移。
- 優先級：P1（已量到 lab 未達內部目標）。
- 修改檔案：`index.html`、相關 `assets/` 圖片；不直接覆蓋原圖。
- 驗收條件：保存構圖與品質的前後比較；設定正確寬高／比例及需要的 srcset；同條件 Lighthouse 比較，LCP≤2.5s、CLS≤0.1 另需真實資料驗證。
- 截圖：第一階段 `screenshots/before-live-home-390x844-intro.png`；第二階段 `phase-2/screenshots/release-home-390x844.png` 及桌機對照。原始圖片保留，新增同圖尺寸／格式變體。
- 完成狀態：第二階段已完成同圖 WebP／尺寸變體、品牌字體的傳送最佳化、首屏相同規則提前載入。Journal／消息及課程明顯改善；首頁 mobile 仍未達 Performance≥90／LCP≤2.5s，保留為持續改善事項。三次中位數見 TEST-RESULTS；未更換品牌字體、未宣稱 field 通過。

## UX-008｜共用樣式及導覽被多次覆寫

- URL：全站，例如 https://hanascent.com/courses/
- 裝置／Viewport：四種，重點 768×1024 與 breakpoint 760/761、980/981。
- 描述：style.css、page inline CSS、site-core 注入 style、site.js 注入 style 共同控制相同 selector；兩支 JS 也先後替換導覽 DOM。舊節點的 handler 可能失效，不適合只修 core 而不檢查 renderNavigation。
- 重現步驟：依 script 載入順序追蹤 `.nav-links` 和 `.nav-drop-button` 建立／替換；瀏覽器 DevTools 記錄最終勝出規則，再 resize 並測 keyboard／touch。
- 使用者影響：增加跨頁不一致與回歸風險；尚未證實某 viewport 必然失效。
- 優先級：P2。
- 修改檔案：`assets/style.css`、`assets/site-core.js`、`assets/site.js`、頁面 inline style。
- 驗收條件：只對可重現問題做最小修正，四 viewport 及 breakpoint 回歸；不藉此全面重構或覆蓋品牌 CSS。
- 截圖：screenshots/README.md 逐頁索引。
- 完成狀態：覆寫來源與執行順序已確認，四 viewport 已測；這次集中修 renderNavigation，全面重構保留為 P2。

## UX-009｜Journal 圖片連結無名稱及分類目標尺寸不足

- URL：https://hanascent.com/journal/
- 裝置／Viewport：四 viewport 均由 axe 報 link-name、target-size、color-contrast。
- 問題描述：文章封面連結（如 blog.html?slug=await）沒有可及名稱；journal-meta 分類連結的目標尺寸／間距不足，meta 另有低對比。
- 重現步驟：載入 Journal、等待文章完成，執行 axe 4.10.3 的 WCAG 2.x A/AA tags；檢查 journal-latest-main／side 圖片 anchor 與 journal-meta。不能只在空資料 loading 時跑。
- 使用者影響：螢幕閱讀器不知道連結目的，手機分類連結較難選取。
- 優先級：P1。
- 修改檔案：`assets/journal-posts.js`、`assets/journal-all.js`、`journal/index.html`、`journal/all/index.html` 的卡片／metadata CSS。
- 驗收條件：圖片連結有文章標題等名稱，目標及間距符合 2.5.8，對比符合 AA；不改文章、照片與服務名稱；四 viewport 重跑 axe 與人工鍵盤。
- 完成狀態：第二階段已修正，含 `/journal/all/` 圖片連結名稱與 metadata 對比；Journal／archive 四 viewport 的 axe 均為零違規。證據：`phase-2/results/release-matrix.json`；截圖：`phase-2/screenshots/release-journal-390x844.png` 與桌機對照。
- 截圖：screenshots/before-live-journal-390x844.png、after-local-scrolled-journal-390x844.png；具體 target 見 matrix axe.nodes。

## UX-010｜動態列表載入造成版面位移

- URL：https://hanascent.com/journal/；https://hanascent.com/news/
- 裝置／Viewport：Lighthouse mobile，模擬節流，冷瀏覽器；其他裝置需回歸。
- 問題描述：單次初始 lab CLS 分別 0.411、0.375，高於目標 0.1；與列表資料載入／動態版面有關，需再對照 trace 定位，不歸因到任何單一圖片或程式碼。
- 重現步驟：執行 lighthouse_batch.py、打開相應 .json.gz，查看 cumulative-layout-shift 與 layout-shift-elements，對照載入前後列表高度。
- 使用者影響：閱讀位置與可操作內容可能移動。
- 優先級：P1。
- 修改檔案：`journal/index.html`、`journal/all/index.html`、`news/index.html`、`assets/journal-posts.js`、`assets/journal-all.js`、`assets/news-archive.js`、`assets/hana-cms.js`；相關首屏規則在 `assets/runtime-layout.css`。
- 驗收條件：同條件至少三次 lab 比較，CLS≤0.1；兼顧 loading／空／錯誤狀態，保留文章與消息；field 另需 CrUX/RUM。
- 完成狀態：第二階段已修正相同資料刷新造成的重建；18 個延遲／更新／空／失敗／no-JS 情境通過，Journal／archive／消息的相同資料刷新 CLS=0 且保留焦點。三次整頁 lab 結果見 TEST-RESULTS 最新補充，與 field 分開。修改包括公開快照、單一 Journal posts promise、提前載入相同規則；維護限制見 `phase-2/TECHNICAL-PLAN.md`。
- 截圖：screenshots/before-live-journal-390x844.png、before-live-news-390x844.png；逐次位移證據以 Lighthouse 原始報告為準。

## UX-011｜獨立預約站資料步驟的表單標籤未關聯

- URL：https://reservation.hanascent.com/（step 4）
- 裝置／Viewport：390×844；其餘裝置初始步驟已檢查，但 step 4 需擴充回歸。
- 問題描述：fName、fPhone、fEmail、fLine 的視覺 label 沒有 for／包裹關聯；axe 在 step 4 報 label，並包含 offscreen honeypot fWebsite。首頁 axe 100 分不代表後續步驟也通過。
- 重現步驟：序曲系列 → Vol. 1 → 可預約日期／時段 → 填寫資料，執行 axe。未填資料按確認訂單會出現既有驗證提示；不送出有效訂單。
- 使用者影響：輔具難以辨識欄位名稱；honeypot 不應誤導正常使用者。
- 優先級：P1。
- 修改檔案：**其他 Repository** `h-s017/reservation/index.html`，本 PR 未修改；不得藉此改付款流程。
- 驗收條件：正常欄位具可及名稱、適當 autocomplete，honeypot 從正常鍵盤／輔具流程排除，逐步表單 axe／人工閱讀檢查；在可控測試環境完成建單至完成頁。
- 完成狀態：既有欄位問題仍屬獨立 Repository 後續事項。付款測試依使用者最新告知已執行，不再重跑；此前稽核未建立正式訂單的紀錄只描述當時測試範圍，不代表使用者未完成付款驗證。
- 截圖：screenshots/before-live-booking-step4-390x844.png；results/flow-checks.json。

## 第二階段狀態補充

有效問題維持 10 項（P0 1、P1 8、P2 1），未以同一原因拆成多筆增加數量。UX-001 前批已發布；本批完成 UX-009 與 UX-010 的技術修正。UX-007 效能已有改善，但全頁目標仍需逐頁追蹤；首頁 ENTER／h1、課程資訊與其他品牌內容依核定表等待人工決策。UX-008 只提前輸出既有規則，未全面重構。

第三階段：使用者核定 ENTER 可選方案，完成 UX-002；首頁 mobile lab 三次中位數 Performance 99、LCP 2.179s、CLS 0.0265。UX-007 仍保留其他頁效能後續，其他首頁／課程文字決策未一併核定。

第四階段：首頁品牌 h1（UX-005）已依核定實作並通過瀏覽器語意／版面驗證；其他課程及首頁文字項目未一併核定。

## 2026-10-23：UX-002 最新補充

使用者要求恢復原藝術開場與透明 ENTER，已恢復首次 session 自動 modal，保留背景焦點隔離、鍵盤、暫停、關閉及返回焦點。7 個功能情境通過。品牌 h1 保留；首頁可選入口仍作手動重播。

### UX-002-C｜透明 ENTER 在動態影像上的文字對比

- URL：https://hanascent.com/
- 裝置／Viewport：390×844、768×1024、1440×900、320×844，藝術開場顯示時。
- 描述／影響：原透明白字在部分照片區域對比偏低；axe 報 color-contrast，另有需人工判讀的 incomplete，可能影響低視力使用者辨識。
- 重現：新 session 打開首頁，執行 dialog 的 axe，並人工查看三張影像各階段。
- 優先級：P1，作 UX-002 的設計／對比補充；原問題總數不另重複加算。
- 修改檔案：`index.html` 的 `.intro-enter`；本次依使用者指示保留原透明樣式。
- 驗收條件：維持透明背景前提下，若後續核定細描邊／陰影方案，需逐影像階段驗證文字對比與視覺預覽；不得擅自恢復色塊。
- 完成狀態：功能修正完成；文字對比待後續設計核定，未宣稱 AA。
- 證據：`restored-intro/results.json`、`restored-intro/intro-390x844.png` 及桌機圖。

UX-007 的先前可選入口 lab 數據屬歷史，不能用來替恢復自動開場版本宣稱效能已通過。

## 2026-10-23：UX-006 本批局部對比完成

- Issue ID：UX-006（既有問題切片，不另增加問題數）。
- URL：https://hanascent.com/、https://hanascent.com/practice/、https://hanascent.com/product-development/。
- 裝置／Viewport：390×844、768×1024、1440×900、320×844。
- 問題描述／使用者影響：淡灰底上原 #767676 小字為 4.35:1／4.23:1，低視力使用者較難閱讀。每裝置首頁 1、自修室 2、產品開發 5 個節點。
- 重現：新 session 首頁先關閉藝術開場；捲動至服務索引、自修室 Schedule／Alumni Companion、產品開發 network；等 reveal 完成後執行 axe color-contrast。不能把 fade 中間色誤判為最終色。
- 優先級：P1。
- 修改檔案：`index.html` 的 `.entrance-index`、`practice/index.html` 的 `.soft-band .kicker`、`product-development/index.html` 的 `.pd-network .eyebrow,.pd-network-item span`。
- 驗收條件：穩定版面對比 ≥4.5:1、四 viewport 零本項 axe 違規、無 root 溢出，原版面／名稱／品牌字體保留。
- 完成狀態：本切片完成，六頁×四 viewport 最終 24/24，主內容零 axe 違規及溢出。UX-006 的其他小字／目標尺寸仍待逐元件確認，不整筆結案；UX-002-C 透明 ENTER 不包含在此對比完成範圍。
- 證據／截圖：`followup-20261023/results/before-stable-matrix.json`／`after-matrix.json`；`followup-20261023/screenshots/README.md`。

## 2026-10-23：UX-007 Vol.1 完成，首頁持續追蹤

- Issue ID：UX-007（效能子項）。
- URL：https://hanascent.com/overture/；https://hanascent.com/。
- 裝置：Lighthouse mobile 412×823 另配四 UI viewport，冷快取。
- 問題／影響：Vol.1 下方封面 PNG 474KB 與首屏文字／字體競爭下載，lab LCP 約 4.205s；不是把封面誤判成 LCP 元素。首頁自動藝術開場的 lab LCP 仍偏慢。
- 重現：相同工具、gzip server、冷瀏覽器各三次 Lighthouse；記錄 LCP 元素及依賴、所有樣本而非單取高分。
- 優先級：P1。
- 修改檔案：`overture/index.html`、`assets/courses/overture-cover-{720,1366}.webp`；首頁效能試驗全撤回，無相關發布修改。
- 驗收條件：Vol.1 保留原構圖與文字，選圖符合裝置、尺寸預留，三次 lab Performance≥90／LCP≤2.5s／CLS≤0.1；field 另需真實使用者資料。
- 完成狀態：Vol.1 三次 Performance 99–100、LCP 1.727–1.804s，CLS 0.00194；此 lab 子項完成。首頁最終 Performance 中位數 73／LCP 9.162s，仍未達標；原開場／透明 ENTER 保留，不聲稱首頁效能改善，也未聲稱 field 通過。
- 證據／截圖：`followup-20261023/lighthouse/`、`loading-checks.json`、`screenshots/README.md`。撤回方案及後續技術方向見 TECHNICAL-PLAN.md。

問題數仍為 P0 1（已修正）、P1 8、P2 1；UX-003 撤回。課程資訊 UX-004 待 C01–C06 核定；UX-011 屬獨立預約 Repository，付款依使用者告知完成，不重測或改動。

## UX-002 最新呈現：移除右上角控制項

依使用者截圖核定，移除上方「暫停播放／關閉 ×」；ENTER 與 Escape 仍關閉 modal 並歸還焦點。暫停以可及的 focus-reveal 按鈕在下方提供，維持原動畫與 reduced-motion。四 viewport＋三情境 7/7，證據 `clean-intro/`。UX-002-C 的透明 ENTER 對比限制仍在；不新增問題數、不變更價格或付款。

UX-002 最新焦點呈現補充：觸控／滑鼠點 ENTER 後返回品牌連結，原瀏覽器 focus-visible 外框會殘留。首頁局部 CSS＋輸入方式標記已修正，仍歸還焦點且鍵盤提示保留。四 viewport 及首次鍵盤關閉 5/5，既有開場 7/7；證據 logo-focus/。屬既有焦點行為調整，不增加稽核問題數。

## UX-012｜1199px 桌機導覽面板造成水平溢出（已修正）

- URL：https://hanascent.com/。
- 裝置／Viewport：1199×900 desktop 重現，另回歸 1200×900、1440×900、390×844、768×1024、320×844。
- 問題描述：課程下拉面板左對齊並延伸到 viewport 外，隱藏時仍可能撐大 document 寬度；root scrollWidth 1228px >1199px。基準與首版 CTA 預覽皆相同，並非新按鈕引入。
- 重現方式：1199px 進站、關閉藝術開場，量測 document.documentElement.scrollWidth；開啟課程清單檢查右邊界。
- 使用者影響：中型桌機非預期左右捲動、部分面板可能越出畫面。
- 優先級：P1。
- 修改檔案：`index.html`，≥981px `.site-nav .nav-dropdown-menu` 改為觸發按鈕右對齊。
- 驗收條件：1199／1200／1440px 開啟及關閉面板無 root overflow，面板完整位於 viewport；手機沿用原樣。
- 完成狀態：已修正並通過本批八情境，合併發布沿用既有授權。證據：`booking-cta-preview/boundary-investigation.json`（修正前），最終 `results.json`、`check.py` 及跨裝置截圖。

10/24 本批新增使用者要求的醒目課程預約 CTA：手機主視覺下方寬版按鈕、桌機 ≥1200px 導覽直接入口；不改課程價格、文案或付款。已提供預覽並完成測試，沿用完成後直接合併部署授權。課程 C01–C06 仍待品牌資料核定。

## UX-013｜P2：首頁消息卡片留白過多、位置過晚（已修正）

- Issue ID：UX-013。
- URL：https://hanascent.com/。
- 裝置／Viewport：390×844、768×1024、1440×900、320×844。
- 問題描述：消息在完整品牌介紹後；原橫向卡片有200／220px最小高度，內容短仍占大幅留白，手機第二則需橫滑才能閱讀。
- 重現步驟：進首頁，關閉首次開場，滑過四大服務與品牌介紹至最新消息；觀察第一則高度、第二則可見程度與空白。前圖news-compact/before-390x844.png、before-1440x900.png。
- 使用者影響：近期資訊較難找到，手機瀏覽與比較消息多一次左右滑動。
- 優先級：P2（首頁資訊層級與版型；經使用者核定）。
- 修改檔案：index.html、assets/hana-cms.css、assets/hana-cms.js、assets/site.js。
- 驗收條件：順序為服務／消息／品牌介紹，首頁至多三則、直向閱讀、不橫向溢出；摘要至多兩行且完整內容可開啟；標題連結及更多消息至少44px高、有可見焦點；CMS與失敗／no-JS相同版型。
- 完成狀態：已完成，四viewport及三種資料／備援共7/7，局部axe零違規，未宣稱全站WCAG／效能通過。原始結果news-compact/after-results.json及前後圖見news-compact/README.md。實際合併部署依本批PR／Pages記錄。

## UX-014｜P1：手機預約文字越過圓形邊界（已修正）

- Issue ID：UX-014。
- URL：https://hanascent.com/。
- 裝置／Viewport：使用者iPhone Instagram截圖；本機320×844、390×844重現構圖檢查，768×1024、1199×900、1440×900回歸。
- 問題描述：文字靠近圓形下緣，矩形scrollWidth檢查即使通過，字的角仍可能越出圓弧；缺少針對圓邊界的驗收。
- 重現步驟：iPhone Instagram內開啟首頁並關閉開場，觀察右下預約文字下緣；使用者截圖mobile-square-hero/reported-ios-text-outside.jpg。
- 使用者影響：標籤碰框或溢出，縮小圓形後更難辨識。
- 優先級：P1。
- 修改檔案：index.html的.home-booking-cta、.home-booking-label與圖文DOM。
- 驗收條件：最新79.42px手機圓內標籤完整顯示、四角到圓心距離≤半徑-1px，無裁字；字體／圖示依最新核定12.5／44px，保持可見焦點與44px以上點擊區。
- 完成狀態：Chromium五viewport及no-JS 6/6，手機標籤角距35.37px、半徑39.70px，餘量4.33px。20個整合情境通過；WebKit缺依賴、iPhone／Instagram真機尚未驗證，不把模擬結果當真機完成。其他證據mobile-square-hero/results.json與README.md。

## UX-007／UX-008：正式首頁效能重測證據更新

本批未新增Issue ID或改產品。對main1423a14的九輪Lighthouse顯示手機LCP／Performance仍未達標；字體約1.78MB、蝴蝶結原PNG約1.18MB與首屏載入鏈需後續修正。CLS實驗室九輪低於0.1，不能延伸為其他頁面、Safari或RUM通過。重現流程、範圍、全部結果與下一步見home-performance-retest/README.md；相關待改善項目仍未宣稱完成。
