# 最新消息取消摘要、圓鈕70%與導覽55%｜2026-10-24

依使用者指定，首頁最新消息不再顯示文章摘要預覽；CMS成功渲染與原HTML備援皆移除預覽段落，保留日期／分類、完整標題、原連結及更多消息。文章內頁、CMS原文及其他非精簡列表元件未修改。

預約圓鈕正常狀態opacity .6→.7；導覽白底rgba alpha .6→.55，導覽文字本身opacity仍為1。沿用既有hover／focus清晰及手機選單展開實白、高對比偏好設定。保留原PNG、44px蝴蝶結、12.5px文字、圓直徑、手機方形Hero與導覽加2pt。

## 驗證

Playwright1.62／Chromium154／axe4.10.3。四viewport（390×844、768×1024、1440×900、320×844）加長內容與上限三則、API失敗、no-JS，共7/7。檢查消息段落不存在、連結目的地、日期標題與原順序、44px點擊高、無水平溢出、精確0.7／0.55及圖文字級保留。等既有淡入動畫結束後檢查對比，避免動畫中的暫態顏色影響量測。

消息、圓鈕及導覽局部axe零違規；部分透明導覽與底下內容重疊的背景判定仍有incomplete，保留原始結果，不能視作全站WCAG認證。導覽文字#111為不透明，55%白底覆蓋純黑後最低約#8c8c8c，仍有足夠文字對比；圓鈕在測試的白底通過，不宣稱所有照片背景或真機皆完成驗證。未跑Lighthouse／RUM，未載入正式預約或付款。WebKit／iPhone限制沿用mobile-square-hero紀錄。

原始結果after-results.json；截圖after-390x844.png、after-320x844.png、after-768x1024.png、after-1440x900.png。前版摘要列表證據news-compact/，前版透明度mobile-square-hero/，均為歷史快照。

重跑：python docs/ux-audit/news-title-opacity/check.py；正式站用HANA_NEWS_BASE與HANA_NEWS_OUT覆寫。
