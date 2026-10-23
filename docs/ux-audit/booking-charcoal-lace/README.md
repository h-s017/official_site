# 炭灰細圓框與移除重播入口｜2026-10-24

依使用者要求刪除首頁「藝術影像・ENTER」重播入口。首次session藝術開場保留；控制器移除對重播按鈕的依賴，關閉焦點回到品牌標題，同session重新載入不重播。

預約鈕保持白底正圓，手機直徑83.6px、其他91.2px，框由1px改為0.75px炭灰#444，文字同步炭灰。瀏覽器會依裝置像素比對細框取整，DPR1可能仍呈1px。蝴蝶結由30.4px放大至40px，縮短圖文間距至1px。

使用上傳原檔assets/hineni_lace_bow_transparent.png（1375×1121，1.2MB）產生assets/booking-lace-bow.webp（160px、約7KB），僅去除透明外邊與縮放／壓縮，無生成或重繪；原PNG保留。圖片空alt，連結名稱與目的地維持課程預約。

## 驗證

Playwright／Chromium154／axe4.10.3：390×844、768×1024、1440×900、320×844、1199×900及no-JS共6/6。驗證指定新圖路徑／載入／40px、炭灰文字、入口不存在、首次開場、同session重新載入、無水平溢出、文字無溢出、焦點、固定定位、頁尾及手機選單。CTA axe零違規，僅為局部檢查。未載入正式預約或付款；未重跑Lighthouse。

[原始結果](results.json)；修改前：[正圓手機](../booking-circle/after-top-390x844.png)、[桌機](../booking-circle/after-top-1440x900.png)。修改後：[手機](after-top-390x844.png)、[桌機](after-top-1440x900.png)、[320px](after-top-320x844.png)。其他截圖含捲動及頁尾。執行：python docs/ux-audit/booking-charcoal-lace/check.py。

本目錄取代先前待原圖草稿證據；舊版測試booking-circle及更早目錄為歷史快照。
