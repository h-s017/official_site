# 第二階段證據索引

- `TECHNICAL-PLAN.md`：證據、方案、實作範圍及快照更新限制。
- `results/before-matrix.json`：目前基準 5 頁×4 viewport。
- `results/release-matrix.json`：最後版本 14 頁×4 viewport，包含完整捲動與截圖；`final-matrix.json` 是本機字體及封面尺寸變體之前的 56 組。
- `screenshots/`：對應矩陣的手機、320px、平板、桌機全頁截圖；intro／menu 另存。保留 before 與最後 release 截圖；中間 after／final 矩陣 JSON 保留，但重複中間截圖不納入 Repository，以控制容量。
- `navigation-release.json`：26 個共用導覽鍵盤／resize 斷言。
- `state-checks.json`：公開資料 fixtures 的延遲刷新、更新、空集合、SDK 失敗、no-JS，以及台北時區驗證。
- `fixtures/`：測試當時的已發布公開文章／消息，無訂單／個資；不作未來 CMS 更新資料來源。
- `benchmarks-release/summary.json`：最後版本的 after；`benchmarks-final/summary.json` 保存同基準的 before 與本機字體修正前 after。同環境、gzip、冷瀏覽器 Lighthouse 比較。首頁／課程／Journal／消息 mobile 各三次前後；desktop 與其他主要頁單次。
- `benchmarks/`、`lighthouse-pilot/`、`pilot-font/`、`pilot-local-font/`：中間探索報告，**不是最終驗收**。舊 benchmark 在發現首頁晚搬移後終止並修正；font preload 試驗未保留。

Playwright viewport：390×844、768×1024、1440×900、320×844。Lighthouse 使用自己的預設 mobile 412×823 模擬節流，不與四 viewport 混稱。版本與限制見 TEST-RESULTS。測試使用環境 HTTPS proxy 與受信任 CA；沒有停用 TLS。

所有本階段腳本排除 reservation／付款；不送出任何表單、訂單或付款。使用者已告知付款測試完成。

## 最後版本截圖

| 頁面／正式路徑 | 手機 390×844 | 桌機 1440×900 |
|---|---|---|
| [home](https://hanascent.com/) | [手機](screenshots/release-home-390x844.png) | [桌機](screenshots/release-home-1440x900.png) |
| [courses](https://hanascent.com/courses/) | [手機](screenshots/release-courses-390x844.png) | [桌機](screenshots/release-courses-1440x900.png) |
| [overture-series](https://hanascent.com/overture-series/) | [手機](screenshots/release-overture-series-390x844.png) | [桌機](screenshots/release-overture-series-1440x900.png) |
| [overture](https://hanascent.com/overture/) | [手機](screenshots/release-overture-390x844.png) | [桌機](screenshots/release-overture-1440x900.png) |
| [kpia](https://hanascent.com/KPIA/) | [手機](screenshots/release-kpia-390x844.png) | [桌機](screenshots/release-kpia-1440x900.png) |
| [helori](https://hanascent.com/helori/) | [手機](screenshots/release-helori-390x844.png) | [桌機](screenshots/release-helori-1440x900.png) |
| [practice](https://hanascent.com/practice/) | [手機](screenshots/release-practice-390x844.png) | [桌機](screenshots/release-practice-1440x900.png) |
| [incubation](https://hanascent.com/incubation/) | [手機](screenshots/release-incubation-390x844.png) | [桌機](screenshots/release-incubation-1440x900.png) |
| [business](https://hanascent.com/business/) | [手機](screenshots/release-business-390x844.png) | [桌機](screenshots/release-business-1440x900.png) |
| [product-development](https://hanascent.com/product-development/) | [手機](screenshots/release-product-development-390x844.png) | [桌機](screenshots/release-product-development-1440x900.png) |
| [journal](https://hanascent.com/journal/) | [手機](screenshots/release-journal-390x844.png) | [桌機](screenshots/release-journal-1440x900.png) |
| [news](https://hanascent.com/news/) | [手機](screenshots/release-news-390x844.png) | [桌機](screenshots/release-news-1440x900.png) |
| [contact](https://hanascent.com/visit.html) | [手機](screenshots/release-contact-390x844.png) | [桌機](screenshots/release-contact-1440x900.png) |
| [journal-all](https://hanascent.com/journal/all/) | [手機](screenshots/release-journal-all-390x844.png) | [桌機](screenshots/release-journal-all-1440x900.png) |

平板與極窄手機依同名 `768x1024`、`320x844` 檔案存放；首頁 intro／手機 menu 另存。
