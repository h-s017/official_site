# 截圖索引

所有影像由 Playwright 實際擷取，沒有生成或修補圖片。以下各主要入口至少有手機390×844、桌機1440×900；另外保存768×1024與320×844。

- `before-live-*`：正式站初始擷取。進場動畫可能尚未全觸發，不能以圖中透明區域判定內容不存在。
- `before-local-scrolled-*`：原始提交的首頁與課程頁，完整捲動觸發動畫後擷取，用於較公平對照。
- `after-local-scrolled-*`：修改版，完整捲動後擷取；未部署。
- 初次 ENTER、MENU、課程 submenu 另有同檔名前綴的 `-intro`、`-menu`、`-menu-courses` 圖。

| 頁面 | Before手機 | Before桌機 | After手機 | After桌機 |
|---|---|---|---|---|
| home | [390px](before-local-scrolled-home-390x844.png) | [1440px](before-local-scrolled-home-1440x900.png) | [390px](after-local-scrolled-home-390x844.png) | [1440px](after-local-scrolled-home-1440x900.png) |
| courses | [390px](before-local-scrolled-courses-390x844.png) | [1440px](before-local-scrolled-courses-1440x900.png) | [390px](after-local-scrolled-courses-390x844.png) | [1440px](after-local-scrolled-courses-1440x900.png) |
| overture-series | [390px](before-live-overture-series-390x844.png) | [1440px](before-live-overture-series-1440x900.png) | [390px](after-local-scrolled-overture-series-390x844.png) | [1440px](after-local-scrolled-overture-series-1440x900.png) |
| overture | [390px](before-live-overture-390x844.png) | [1440px](before-live-overture-1440x900.png) | [390px](after-local-scrolled-overture-390x844.png) | [1440px](after-local-scrolled-overture-1440x900.png) |
| kpia | [390px](before-live-kpia-390x844.png) | [1440px](before-live-kpia-1440x900.png) | [390px](after-local-scrolled-kpia-390x844.png) | [1440px](after-local-scrolled-kpia-1440x900.png) |
| helori | [390px](before-live-helori-390x844.png) | [1440px](before-live-helori-1440x900.png) | [390px](after-local-scrolled-helori-390x844.png) | [1440px](after-local-scrolled-helori-1440x900.png) |
| practice | [390px](before-live-practice-390x844.png) | [1440px](before-live-practice-1440x900.png) | [390px](after-local-scrolled-practice-390x844.png) | [1440px](after-local-scrolled-practice-1440x900.png) |
| incubation | [390px](before-live-incubation-390x844.png) | [1440px](before-live-incubation-1440x900.png) | [390px](after-local-scrolled-incubation-390x844.png) | [1440px](after-local-scrolled-incubation-1440x900.png) |
| business | [390px](before-live-business-390x844.png) | [1440px](before-live-business-1440x900.png) | [390px](after-local-scrolled-business-390x844.png) | [1440px](after-local-scrolled-business-1440x900.png) |
| product-development | [390px](before-live-product-development-390x844.png) | [1440px](before-live-product-development-1440x900.png) | [390px](after-local-scrolled-product-development-390x844.png) | [1440px](after-local-scrolled-product-development-1440x900.png) |
| journal | [390px](before-live-journal-390x844.png) | [1440px](before-live-journal-1440x900.png) | [390px](after-local-scrolled-journal-390x844.png) | [1440px](after-local-scrolled-journal-1440x900.png) |
| news | [390px](before-live-news-390x844.png) | [1440px](before-live-news-1440x900.png) | [390px](after-local-scrolled-news-390x844.png) | [1440px](after-local-scrolled-news-1440x900.png) |
| contact | [390px](before-live-contact-390x844.png) | [1440px](before-live-contact-1440x900.png) | [390px](after-local-scrolled-contact-390x844.png) | [1440px](after-local-scrolled-contact-1440x900.png) |
| booking | [390px](before-live-booking-390x844.png) | [1440px](before-live-booking-1440x900.png) | 未修改／未重拍 | 未修改／未重拍 |

其他狀態：[預約資料步驟](before-live-booking-step4-390x844.png)、[News SDK失敗提示](before-news-sdk-failure-390x844.png)。焦點行為以 results/*nav*.json 的實際 activeElement／鍵盤斷言為準，不能只靠靜態圖判斷。
