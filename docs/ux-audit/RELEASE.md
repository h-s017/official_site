# 炭灰蕾絲蝴蝶結預約與移除重播入口｜2026-10-24

移除首頁藝術影像重播入口，首次session開場保留。指定黑白蝴蝶結替換、放大至40px，預約圓框改0.75px炭灰。依既有授權合併部署，實際狀態以PR與Pages記錄為準。 [截圖及測試](booking-charcoal-lace/README.md)。

---

# 正圓預約按鈕｜2026-10-24

使用者核定正圓並再縮小5%；白底細框、粉色蝴蝶結及課程預約文字保留。 [截圖及測試](booking-circle/README.md)。

---

# 白底蝴蝶結課程預約｜2026-10-24

依使用者最新兩張蝴蝶結參考，採淡粉花卉版本，白底細黑圓角框，寬高約縮小10%。6/6瀏覽器情境通過，CTA axe零違規。依既有授權提交／合併／部署，實際發布狀態依PR及Pages紀錄。 詳細圖與證據：[booking-bow](booking-bow/README.md)。

---

# 滿寬Hero與漂浮課程預約｜2026-10-24

依使用者後續要求，Hero改為左右滿版、保留原圖比例與文字；課程預約改為右下角漂浮按鈕，隨捲動保持位置。此域HINENI的滿寬78vh已實際量測；HANA為保留橫圖內文字，未硬裁成同高度，手機高直幅照片選擇仍可另行確認。先採保留原圖的安全方案。

五viewport＋no-JS共6/6，固定位置、頁尾、CTA鍵盤／對比／目標、開場與手機選單／短螢幕均有檢查。圖與文字完整保留，沒有新增JS、照片或字體；未載入預約應用或付款測試，也未重跑Lighthouse。最新結果與前後圖見 [hero-floating](hero-floating/README.md)。沿用既有完成後直接合併部署授權，實際狀態依本批PR／Pages記錄；下方歷史版本保留。

---

# 首頁課程預約入口｜2026-10-24

依使用者新需求提高課程預約辨識度：手機主視覺下方新增寬版黑底白字「課程預約 →」，桌機導覽 ≥1200px 另設直接入口，沿用正式預約網址。保留原藝術開場、ENTER、h1、品牌敘述及其他服務入口。先保存手機／桌機預覽，依先前完成後直接合併部署授權發布。

六 viewport＋兩個 no-JS 共8/8，CTA 的大小／對比／鍵盤／連結與開場重播通過。附帶修正1199px既有導覽面板溢出 UX-012，累計問題11項（P0 1、P1 9、P2 1）。沒有載入預約應用、建單或付款測試，未重跑 Lighthouse。原始資料、現行及預覽圖在 [booking-cta-preview](booking-cta-preview/README.md)，實際合併部署依本批 PR／Pages 記錄。課程 C01–C06 仍待人工資料核定。下方保留歷史。

---

# 品牌標題：移除觸控進站後的外框｜2026-10-23

依使用者截圖，修正 ENTER 關閉後程序焦點造成的品牌標題框。觸控／滑鼠進站後不畫框，鍵盤操作時仍保留明確焦點提示；不全站移除 outline。四 viewport＋首次鍵盤關閉共五情境，以及既有藝術開場七情境通過，手機／桌機前後圖見 [logo-focus](logo-focus/README.md)。

只修改首頁局部 focus CSS、控制器輸入狀態與 cache query；標題文字、ENTER、照片、動畫、課程及付款不變。依既有授權提交、合併部署，實際狀態以本批 PR／Pages 記錄為準。下方保留歷史。

---

# 藝術開場：取消右上角字樣｜2026-10-23

依使用者提供截圖，移除右上角「暫停播放／關閉 ×」。畫面保留原透明 ENTER；ENTER／Escape 關閉、首次 session 自動開場及重播正常。暫停保留為鍵盤聚焦時才在下方顯示的控制項。四 viewport＋三種備援／偏好共七情境通過，預覽及原始結果見 [clean-intro](clean-intro/README.md)。

本批只改首頁控制項與其控制器 selector／cache query；課程價格、品牌正文、照片、動畫與付款未改。未重測付款或 Lighthouse，透明 ENTER 的已知對比限制保留。依既有授權提交、合併及部署，實際狀態以本批 PR／Pages 記錄為準。下方保留歷史。

---

# Vol.1 載入與局部文字對比｜2026-10-23

本批發布範圍：Vol.1 同圖 WebP／responsive image／尺寸／lazy、首頁服務索引／氣味自修室／香氛產品開發的局部小字對比。Repository `h-s017/official_site`，Pages main 根目錄，https://hanascent.com/。基準 main `61600e4`；本批產品檔案與 SHA-256 見 `followup-20261023/product-manifest.json`。

六頁四 viewport 24/24、主內容零 axe 違規及 root 溢出；ENTER 功能七情境、Vol.1 選圖兩情境通過。Vol.1 三次 lab 中位數 Performance 86→100、LCP 4.205→1.731s、CLS 維持 0.00194。首頁 lab 中位數仍為 Performance 73／LCP 9.162s，不宣稱改善。已知 CMS optional page_contents 404 與透明 ENTER 對比限制保留並記錄，非全站 AA 或 field 驗收。

首頁效能試驗全數撤回，控制器、開場動畫、ENTER 透明樣式及字體均與基準相同。課程資訊只整理 C01–C06 待核定欄，價格／名稱／正文／付款未變，不重跑預約或付款。完整方案、原始測試、未達標項目與截圖見 [本批報告](followup-20261023/README.md)。

依使用者既有授權，[PR #18](https://github.com/h-s017/official_site/pull/18) 已合併，main `5a3f0d8`、[Pages run 39931775258](https://github.com/h-s017/official_site/actions/runs/39931775258) 成功。正式站 14/14 檔案雜湊相符、六頁四裝置 24/24 與 ENTER 七情境通過；本次後續提交只保存 docs 證據，不改產品檔案。詳見 [正式驗證](followup-20261023/PRODUCTION.md)。下方保留歷史版本。

---

# 恢復原藝術開場與透明 ENTER｜2026-10-23

依使用者最新核定恢復首次 session 自動藝術開場，ENTER 恢復透明底、白色直排及原文字陰影。保留關閉／暫停、Escape、焦點管理與 reduced-motion；品牌 h1、課程資料及付款不變。預覽及測試見 `restored-intro/README.md`。

7 個功能情境通過；透明文字對比仍有 axe 違規及 incomplete，未宣稱 AA。未重測 Lighthouse，不沿用可選入口版本數值代表本版本效能。未重測預約／付款。實際合併及部署狀態以本批 PR／Actions 為準。

下方保留先前版本紀錄，與本次最新指示有差異時，以本段為準。

---

# 首頁品牌 h1：第四階段

使用者核定以既有 HANA SCENT ARTIST 作語意主標，並先提供手機／桌機預覽。h1 位於主視覺區開頭，使用輔具可讀的 visually-hidden 文字；畫面保留既有圖片品牌字。只修改 index.html 的 h1 及局部 CSS。

四 viewport＋no-JS 共 5/5、三項 heading axe 規則零違規、既有版面幾何相同，證據見 `home-h1/`；沒有實體螢幕閱讀器驗收，沒有重跑 Lighthouse／預約／付款。其他首頁及課程文字未一併核定。

先提供預覽，再依既有完成後提交、合併部署授權發布；實際狀態以本批 PR／Pages Actions 為準。下方保留前批紀錄。

---

# ENTER 可選入口：第三階段

2026-10-21，使用者核定 ENTER 可選方案。本階段先提供手機／桌機預覽，再依既有完成後提交、合併部署授權發布；價格、付款與課程核定項目不變。

產品僅修改首頁、optional-intro.js 及 core 的 optional 標記守衛。四 viewport 初訪直接看到首頁、主動開啟才下載三張既有藝術照片；原生 modal、暫停、關閉與焦點返回通過 7 情境及四份 dialog axe。首頁三次 lab 中位數 Performance 99、Accessibility 96、LCP 2.179s、CLS 0.0265；非 field 驗收。證據與預覽見 `optional-enter/README.md`。

合併及實際發布結果以本批 PR／Pages Actions 為準；下方保留前次已發布版本的證據。

---

# UX/UI V2 第二階段：正式發布及驗證

2026-10-21。Repository：`h-s017/official_site`，GitHub Pages 由 `main` 根目錄發布至 https://hanascent.com/。

- 技術修正：[PR #13](https://github.com/h-s017/official_site/pull/13)，已合併。
- 程式提交：`6c7b91aeb546ecb9f496f1728eb4b52bcbdd5eba`；main 合併提交：`7a733de619964d312fead1ca530685ce68b33c27`。
- [正式發布工作](https://github.com/h-s017/official_site/actions/runs/39550567267)：成功。
- 發布後 15 個關鍵 HTML／CSS／JS／字體／封面檔案與提交 SHA-256 完全相符。
- 正式 Journal／archive／News 四 viewport 共 12/12，零 axe 違規、零 root 溢出；共用導覽 26/26。證據見 `phase-2/production/`，另存正式 Journal 手機／桌機截圖。

本次完成 Journal 連結名稱、對比、觸控與焦點、公開資料載入及位移修正、同品牌字體與圖片傳送最佳化；本機 14 頁×四 viewport 56/56，21 個資料情境與 6 個邊界檢查通過。Lighthouse mobile 三次中位數：Journal Performance 97、Accessibility 100、LCP 2.466s、CLS 0。這是 lab，不是 CrUX／RUM／INP 驗收；其中一次 Journal LCP 2.565s，沒有聲稱每次都達標。

首頁 mobile Performance 69／LCP 7.881s、Vol.1 單次 Performance 86／LCP 4.130s 及其他頁既有對比仍待後續。首頁／課程內容只提供 HOME-COURSE-APPROVAL.md，尚未核定；價格、品牌文字與付款流程未修改。使用者已告知付款測試完成，本批未重跑預約／付款、未建單。

本發布驗證紀錄的後續提交只增加 docs 證據；沒有再修改產品檔案。其他文件中的早期測試／未部署描述是歷史快照，以本紀錄及 PR／Actions 真實狀態為準。

---

## 第一階段發布紀錄（歷史）


2026-10-21（Asia/Taipei），使用者授權已完成項目直接提交、合併並部署。

本次可發布的產品變更為 `assets/site.js`：修正手機 MENU 收合後仍可進入隱形焦點，並同步課程 disclosure、鍵盤開關、Escape 與焦點歸位、滑鼠和 breakpoint 行為。產品修正提交為 c1d2ca7；其後提交只新增發布紀錄及重跑證據。

合併前再次執行 `nav_regression.py`，26/26 通過，結果在 `results/release-nav.json`。原有主站52組跨裝置、正式站56組與Lighthouse等證據保留；沒有把待辦列為已完成。遠端PR沒有配置CI check runs或commit statuses，並非CI已通過的主張；發布依據為已保存的實際測試。

價格、正式內容、品牌視覺與付款流程沒有修改。Journal無障礙、效能／CLS、首頁與課程資訊決策、預約付款端到端驗收仍是後續事項。完整UX/UI V2與WCAG2.2 AA尚未全數驗收，沒有CrUX/RUM。

發布 PR：[h-s017/official_site#12](https://github.com/h-s017/official_site/pull/12)。正式部署沿用 `main` 的 [GitHub Pages workflow](https://github.com/h-s017/official_site/actions/workflows/pages/pages-build-deployment)。實際合併提交、時間及部署成功狀態，以 PR 與 [Actions runs](https://github.com/h-s017/official_site/actions) 的記錄為準；本文件不預先宣稱已上線。

其他稽核文件中的「未部署」「Draft」「deployed:false」是稽核完成時的快照，不代表之後的線上狀態。正式站發布後仍需重跑導覽 smoke test，確認實際供應的site.js與發布版本一致。
