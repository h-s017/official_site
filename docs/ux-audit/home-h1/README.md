# 首頁品牌 h1：核定、預覽及驗證

使用者核定沿用既有「HANA SCENT ARTIST」作語意主標，不新增行銷文案，先提供位置／呈現預覽。基準 main：`b813f410e4cd04466cf1178054ae0e8b0d3a97c1`。

## 呈現

h1 放在 `header.hero` 開頭、主視覺之前，使用標準 visually-hidden CSS 保留在輔具閱讀及標題導覽中。畫面沿用既有品牌圖；沒有新增另一行可見品牌標題，也沒有改動品牌照片、字體、服務順序、課程資訊或付款。

```html
<header class="hero">
  <h1 class="home-semantic-title">HANA SCENT ARTIST</h1>
  <div class="hero-shell">…既有主視覺…</div>
</header>
```

沒有使用 display:none、visibility:hidden 或 aria-hidden 隱藏語意。圖片原 alt 保留，h1 文字僅為品牌名稱，沒有額外 SEO／行銷內容。原生 HTML 提供 h1，無 JavaScript 也成立。

| 預覽 | 手機 | 桌機 |
|---|---|---|
| 首頁畫面 | [390×844](home-390x844.png) | [1440×900](home-1440x900.png) |

另外保存 768×1024 與 320×844；語意大綱見 results.json。載入後層級為 H1「HANA SCENT ARTIST」→既有各 H2 區塊→服務 H3。

## 驗證

- 四 viewport＋no-JS 共 5/5 情境通過。
- 原始 HTML 與 runtime DOM 都只有一個 h1；Playwright 以 heading role、level=1、精確可及名稱找到主標。
- Axe `page-has-heading-one`、`empty-heading`、`heading-order` 四 viewport 均零違規。
- 在同一頁移除／還原 h1 比對 nav、主視覺、hero-panel、服務及 footer 的位置／寬高，完全相同；零 root 水平溢出。
- 既有可選藝術入口維持關閉；四服務入口均存在。
- 檢查範圍為瀏覽器語意及視覺，沒有實體 NVDA／VoiceOver 測試，不宣稱全首頁或全站 WCAG AA。
- 本批沒有新增網路資產或改動效能邏輯，未重跑 Lighthouse；既有 Lighthouse 數值仍是前批結果，沒有冒稱這批重新量測。
- 未執行預約／付款。

產品差異只有 index.html 的 h1 與其局部 CSS。已先提供預覽，再依使用者既有「完成後直接提交、合併部署」授權發布；實際狀態以本批 PR／Pages Actions 為準。其他未核定的首頁／課程項目保持原狀。
