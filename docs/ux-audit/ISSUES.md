# 問題清單

原始碼初步問題／風險 8 項：**P0 0、P1 6、P2 2**。這不代表網站沒有 P0；動態測試被環境阻擋。以下優先級為初步處理順序；未宣稱 WCAG 自動檢測或視覺重現已完成。所有「修改檔案」均是建議修正位置，本次沒有改動。

## UX-001｜關閉的手機導覽仍包含可聚焦連結

- URL：全站，例如 https://hanascent.com/courses/
- 裝置／Viewport：390×844、320×844；平板／桌機另需回歸。
- 描述：site-core 以 max-height:0、opacity:0、pointer-events:none 隱藏 `.nav-links`，但未移除其子連結的鍵盤焦點；dropdown 也以高度／透明度收合，沒有 inert 或對應焦點控制。
- 重現步驟：390px 開課程頁，不開 MENU，Tab 逐步移動；檢查是否進入不可見導覽。開 MENU 後，收合專業調香，再 Tab／Shift+Tab；以 Escape 檢查關閉及焦點歸位。**上述瀏覽器步驟尚未執行；目前證據為 source。**
- 使用者影響：鍵盤／輔具使用者可能無法看見目前位置、誤進不可見連結。
- 優先級：P1；若動態確認阻斷主要導覽，升為 P0。
- 修改檔案：`assets/site-core.js:302`、`assets/site.js:119`（renderNavigation 替換 DOM，舊 listener 不一定仍適用）。
- 驗收條件：收合內容不進入 Tab 順序；展開後全部連結可到達；可關閉並歸還焦點；resize 無失效；aria-expanded 與實際顯示一致；不依賴 hover；四 viewport 回歸。
- 截圖：缺件，見 screenshots/README.md；需 MENU／dropdown 開關與焦點圖。
- 狀態：source 風險已確認；執行時重現、修正、複測待完成。

## UX-002｜首頁 ENTER 的焦點與動態入口

- URL：https://hanascent.com/
- 裝置／Viewport：全部四種，首次 session。
- 描述：intro 是覆蓋全畫面的 div；僅 body overflow:hidden。沒有背景 inert、首次焦點設定、關閉後焦點目標；closeIntro 刪除含目前按鈕的節點。提供 reduced-motion，但仍須測暫停及鍵盤。
- 重現步驟：新 session 首頁，以 Tab 移至 ENTER，再繼續 Tab；檢查背景是否可聚焦。Enter 關閉後記錄 activeElement、閱讀位置；另試 reduced-motion。
- 使用者影響：可能失去焦點、聚焦被覆蓋內容；所有首次訪客多一個入口步驟。
- 優先級：P1。
- 修改檔案：`index.html:266`、`index.html:390`；首頁互動方案須審核。
- 驗收條件：保留或調整 ENTER 須人工核定；若保留，初始焦點可見、背景不能聚焦、關閉後可繼續主流程，動畫可依使用者偏好停止；不用滑鼠也可完成入口。
- 截圖：缺件；需初次 ENTER／關閉後焦點。
- 狀態：source 缺少焦點管理已確認；動態測試及首頁方案待審。

## UX-003｜消息 SDK／資料錯誤缺少可見失敗狀態

- URL：https://hanascent.com/news/；https://hanascent.com/（同一 CMS）。
- 裝置／Viewport：全部四種；慢網、離線、SDK／API 失敗。
- 描述：`hana-cms.js` 在 SDK/config 不存在直接 return；init catch 只 console.error；settings 錯誤 throw、announcements 錯誤跳過 render。news HTML 初始是「最新消息載入中...」，可能一直保留。首頁有靜態 snapshot，需保留該 fallback，不能當成 API 最新內容。
- 重現步驟：阻擋外部 SDK 後重載 News；另模擬 settings／announcements 拒絕與 timeout。檢查是否一直顯示 loading、是否提供重試。公開文字擷取僅見 loading，不作為完整瀏覽器重現證據。
- 使用者影響：無法分辨仍在載入、沒有消息或服務失敗。
- 優先級：P1。
- 修改檔案：`assets/hana-cms.js:4`、`:236`；`news/index.html`。
- 驗收條件：成功／空資料／SDK 失敗／請求失敗／timeout 都有有限等待與可見結果；保留已發佈 snapshot；錯誤提示可被輔具讀取且不搶焦點。失敗文案先審核。
- 截圖：缺件；需四種狀態。
- 狀態：source 錯誤分支缺少 UI 已確認；未動態重現／未修改。

## UX-004｜課程資訊未能跨預約來源完成一致性驗證

- URL：https://hanascent.com/KPIA/；https://hanascent.com/helori/；https://reservation.hanascent.com/
- 裝置／Viewport：全部四種。
- 描述：KPIA、HELORI 主頁未明列費用與總時數；KPIA 成品件數也未明列。導覽與內容的 KPIA 名稱有差異。預約站工具不可讀，無法完成跨來源比對；這不是已確認價格衝突。
- 重現步驟：讀主頁課程資訊，比較課程總覽、導覽、預約方案、LINE 核定資料；逐欄記名稱／費用／時數／作品／報名方式。不可用推測補值。
- 使用者影響：選課前可能需額外詢問，無法直接比較投入成本。
- 優先級：P1（內容決策）。
- 修改檔案：`KPIA/index.html`、`helori/index.html`、`assets/site.js:119`；預約站需另確認部署 Repository，不在本 PR 擅改。
- 驗收條件：品牌核定各課程資料與揭露方式，主站／預約來源一致；發現衝突只列清單，不自行選價格；在受控環境完成預約。
- 截圖：缺件；需課程說明／方案確認頁對照。
- 狀態：主頁資料缺項已確認；跨來源與價格仍待驗證／人工決策。

## UX-005｜首頁缺少語意主標

- URL：https://hanascent.com/
- 裝置／Viewport：全部四種及輔具閱讀。
- 描述：首頁 source h1 數為 0；目前章節從 h2 開始，現有首頁 runtime 改寫亦未建立 h1。缺 h1 本身不能單獨判定 WCAG 失敗。
- 重現步驟：檢視 source inventory 的 h1_count，再用載入完成後 DOM 與螢幕閱讀器標題清單核對。
- 使用者影響：主題與章節層級不易透過標題導覽理解。
- 優先級：P1。
- 修改檔案：`index.html`、`assets/site.js`；主標內容及現有字級／位置方案先審核。
- 驗收條件：一個能表達首頁主題的主標、各節 h2/h3 合理，現有版面及品牌字體保留；視覺與輔具均人工檢查。
- 截圖：缺件；需主標與輔具 heading 結構。
- 狀態：source 缺 h1 已確認；語意方案待審。

## UX-006｜小字與觸控目標需逐元件確認

- URL：https://hanascent.com/；共用 Footer／導覽所在頁。
- 裝置／Viewport：390×844、320×844，另測 tablet。
- 描述：News 部分 meta／CTA 11.5px、MENU 11px、Footer 社群連結 30×30；導覽高度常為 32–34px。CSS 多層覆寫，無法僅憑宣告確認最後尺寸。44px 是本案建議，WCAG AA 的最小 target 與間距例外需另判斷。
- 重現步驟：量測 computed font-size、line-height、client rect 與相鄰目標間距；以手機觸控及 200% 縮放閱讀。
- 使用者影響：可能讀取費力或誤觸；尚未確認實際 WCAG 不符合項。
- 優先級：P1（待實測）。
- 修改檔案：`assets/site.js:24`、`assets/site-core.js:299`、`assets/hana-cms.js:63`、`index.html`。
- 驗收條件：關鍵內文符合閱讀需求，主要 CTA 建議 ≥44px；其餘符合 WCAG 2.2 AA target／間距要求；調整後無換行遮擋或橫向溢出。
- 截圖：缺件；需量測標註與窄螢幕實圖。
- 狀態：小尺寸宣告已確認；實際尺寸、影響及修正待測。

## UX-007｜大圖與缺少尺寸預留的效能風險

- URL：https://hanascent.com/；其他使用同資產的頁面。
- 裝置／Viewport：390×844、1440×900，冷快取。
- 描述：manifest 中首頁 HERO PNG 2,224,150 bytes、肖像 843,655 bytes、黑色 logo 742,743 bytes；首頁主圖未明列 width／height。尺寸大與未預留比例是風險，不等於已量到 LCP／CLS 超標。
- 重現步驟：完整下載資產，在相同節流／快取條件量測瀑布圖、LCP 元素、載入前後幾何尺寸；核對 responsive image 選擇與畫質。
- 使用者影響：可能增加行動下載量、延後主圖呈現或產生位移。
- 優先級：P2（量測後可調整）。
- 修改檔案：`index.html`、相關 `assets/` 圖片；不直接覆蓋原圖。
- 驗收條件：保存構圖與品質的前後比較；設定正確寬高／比例及需要的 srcset；同條件 Lighthouse 比較，LCP≤2.5s、CLS≤0.1 另需真實資料驗證。
- 截圖：缺件；需相同裁切前後圖、lab report。
- 狀態：資產大小與 source 屬性已確認；效能量測未完成。

## UX-008｜共用樣式及導覽被多次覆寫

- URL：全站，例如 https://hanascent.com/courses/
- 裝置／Viewport：四種，重點 768×1024 與 breakpoint 760/761、980/981。
- 描述：style.css、page inline CSS、site-core 注入 style、site.js 注入 style 共同控制相同 selector；兩支 JS 也先後替換導覽 DOM。舊節點的 handler 可能失效，不適合只修 core 而不檢查 renderNavigation。
- 重現步驟：依 script 載入順序追蹤 `.nav-links` 和 `.nav-drop-button` 建立／替換；瀏覽器 DevTools 記錄最終勝出規則，再 resize 並測 keyboard／touch。
- 使用者影響：增加跨頁不一致與回歸風險；尚未證實某 viewport 必然失效。
- 優先級：P2。
- 修改檔案：`assets/style.css`、`assets/site-core.js`、`assets/site.js`、頁面 inline style。
- 驗收條件：只對可重現問題做最小修正，四 viewport 及 breakpoint 回歸；不藉此全面重構或覆蓋品牌 CSS。
- 截圖：缺件；需相同元件跨頁比較。
- 狀態：結構與覆寫來源已確認；未重構，待動態驗證。
