# 問題清單

有效問題 **10 項：P0 1（已修正）、P1 8、P2 1**。另 UX-003 撤回、不計入。正式站 56 組與最終本機 52 組跨裝置檢查已完成；未宣稱全站 WCAG 達標。除 UX-001 已修改外，其餘「修改檔案」為建議位置。

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
- 狀態：source 缺少焦點管理已確認；動態測試及首頁方案待審。

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
- 修改檔案：`index.html`、`assets/site.js`；主標內容及現有字級／位置方案先審核。
- 驗收條件：一個能表達首頁主題的主標、各節 h2/h3 合理，現有版面及品牌字體保留；視覺與輔具均人工檢查。
- 截圖：screenshots/before-local-scrolled-home-390x844.png；heading 結構見矩陣 layout.h1。
- 完成狀態：source 與執行後 DOM 均無 h1；主標文案及語意方案待審。

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
- 截圖：screenshots/before-live-home-390x844-intro.png；results/lighthouse/ 保存 lab report。未做圖片轉檔，因此沒有畫質修改對照。
- 完成狀態：已完成 Lighthouse 初始量測，首頁 mobile Performance 53、LCP 37.0s，desktop 67、LCP 5.0s；受代理、模擬節流與字體影響，非 field 數據。未做圖片／字體改版，詳見 TEST-RESULTS 與壓縮原始報告。

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
- 修改檔案：`assets/journal-posts.js`、`journal/index.html` 的卡片／metadata CSS；需逐個確認實際 renderer。
- 驗收條件：圖片連結有文章標題等名稱，目標及間距符合 2.5.8，對比符合 AA；不改文章、照片與服務名稱；四 viewport 重跑 axe 與人工鍵盤。
- 完成狀態：已動態重現，未修改。
- 截圖：screenshots/before-live-journal-390x844.png、after-local-scrolled-journal-390x844.png；具體 target 見 matrix axe.nodes。

## UX-010｜動態列表載入造成版面位移

- URL：https://hanascent.com/journal/；https://hanascent.com/news/
- 裝置／Viewport：Lighthouse mobile，模擬節流，冷瀏覽器；其他裝置需回歸。
- 問題描述：單次初始 lab CLS 分別 0.411、0.375，高於目標 0.1；與列表資料載入／動態版面有關，需再對照 trace 定位，不歸因到任何單一圖片或程式碼。
- 重現步驟：執行 lighthouse_batch.py、打開相應 .json.gz，查看 cumulative-layout-shift 與 layout-shift-elements，對照載入前後列表高度。
- 使用者影響：閱讀位置與可操作內容可能移動。
- 優先級：P1。
- 修改檔案：`journal/index.html`、`news/index.html`、`assets/journal-posts.js` 等 renderer（調整前先核對 trace）。
- 驗收條件：同條件至少三次 lab 比較，CLS≤0.1；兼顧 loading／空／錯誤狀態，保留文章與消息；field 另需 CrUX/RUM。
- 完成狀態：已量測，未修正；不是主張 field CLS 已失敗。
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
- 完成狀態：已重現；獨立 Repository 後續修正，付款端驗收未完成。
- 截圖：screenshots/before-live-booking-step4-390x844.png；results/flow-checks.json。
