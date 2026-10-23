# 手機Hero放大、預約圓鈕及導覽列｜2026-10-24

本批納入使用者連續指示：手機Hero太小、預約圓再縮5%且60%不透明、手機文字跑出圓框、導覽白底60%與右側文字加2pt、蝴蝶結放大而文字縮小。

## 最終規格

- 手機≤760px主視覺改1:1中央裁切，390px高由219.375→390px，320px由180→320px。保留同一照片及所有品牌文字，圖片內裝飾線兩端會裁切；人工檢查320／390截圖。平板768及桌機維持原16:9。以sizes=(max-width:760px) 178vw, 100vw選擇足夠來源解析度，避免中央裁切放大後模糊；沒有改圖檔或照片。
- 預約圓手機83.6→79.42px，其他91.2→86.64px，整顆opacity .6；hover／focus-visible恢復1，高對比／減少透明度／forced-colors偏好亦用1。原PNG保留，最後依使用者新指示蝴蝶結44px、文字12.5px。框0.7125px炭灰；文字來源#111使白底下60%混色仍足夠清楚。
- 手機文字出框修正：文字改為明確span，統一line-height1.2與字距.02em，圓內整組圖文向上收；局部text-size-adjust:100%避免自動文字增幅。不用overflow:hidden掩蓋文字。
- 新增幾何驗收：文字矩形四角至圓心距離需小於半徑至少1px；最終手機最大35.37px、小於半徑39.70px（餘約4.33px）。以使用者iPhone截圖reported-ios-text-outside.jpg作問題證據。
- 共用導覽白底rgba(255,255,255,.6)，文字／品牌本身opacity維持1；手機展開選單白底1。右側字加2pt=2.6667 CSS px，沿用各斷點原基準：桌機13.5→16.1667、窄桌機12→14.6667、平板13→15.6667、手機展開15→17.6667；MENU原11／12→13.6667／14.6667。只改右側，不調品牌標題字級。高對比／減少透明度偏好用實白底。
- 導覽樣式由共用site.js單獨安裝，涵蓋使用runtime-layout.css及JS fallback的頁面；既有generated CSS保持一致。無JS時保留原導航靜態樣式，本批字級與半透明導覽需JS。

## 驗證

Playwright1.62、Chromium154、axe4.10.3。check.py五viewport（390×844、768×1024、1440×900、320×844、1199×900）及no-JS，共6/6；含Hero比例、原PNG來源、44px圖示、60%狀態、等寬高圓形、文字四角、焦點恢復清晰、選單／開場、固定定位、短螢幕與頁尾。正常／鍵盤聚焦CTA axe各零違規及零incomplete（僅此元件）。預約連結用攔截頁，正式應用／付款未載入。

nav-check.py首頁六寬度（含981px及1199px）、課程／Journal各四寬度，共14/14。手機DPR3觸控模擬；檢查精確字級、60%背景、logo／MENU不重疊、無水平溢出、展開選單實白、課程最後連結可達、ArrowDown／Escape、焦點與局部axe零違規。合計20情境。程式語法與build-runtime-layout.mjs --check通過。

WebKit已嘗試安裝但缺GTK4等系統依賴，無法啟動；詳webkit-environment.json。DPR3是Chromium模擬，不是iPhone／Safari／Instagram真機驗收，不能聲稱該環境已通過。未重跑Lighthouse、CrUX或RUM；Hero較高時可能選擇較大的既有圖源，無效能通過宣稱。

## 證據

原始資料results.json／nav-results.json。手機：[修改前](before-390x844.png)／[最終](after-top-390x844.png)；窄手機：[前](before-320x844.png)／[後](after-top-320x844.png)；桌機：[前](before-1440x900.png)／[後](after-top-1440x900.png)。其他截圖含捲動、頁尾及三種頁面導覽。

重跑：python docs/ux-audit/mobile-square-hero/check.py；python docs/ux-audit/mobile-square-hero/nav-check.py。正式站以HANA_HERO_BASE／HANA_HERO_OUT及HANA_NAV_BASE／HANA_NAV_OUT覆寫，避免覆蓋本機證據。舊hero-floating、booking-original-png等測試／結果為歷史版型，不適用本批新尺寸。
