# Journal 無障礙、效能與位移：技術方案及實作

本階段基準為 `0c47a0e3ae915b585f9f0de6fbd4634790509f90`（上一批導覽修正已發布）。Repository：`h-s017/official_site`；正式來源為 main 的 GitHub Pages。價格、服務文案、付款流程與 ENTER 入口方案不在此批修改範圍。使用者已告知付款測試完成，這次完全不重跑預約／付款。

## 先取得的證據

- Journal 在四 viewport 都有 axe `link-name`、`target-size`、`color-contrast`；文章列表另有 `link-name`、`color-contrast`。
- 控制資料延遲回傳時，舊版 Journal／消息的列表刷新 CLS 分別為 0.611／0.587，聚焦連結被重建；Journal 重複查詢 posts 兩次。
- 首屏樣式原先等 DOMContentLoaded 才注入；已繪製內容又被加上 opacity:0 的進場狀態。首頁 HTML 的消息區塊先出現，再由 JS 搬到 About 下方。
- 1920px 首頁 PNG 2,224,150 bytes；導航 35.2px logo 卻下載 742,743 bytes 原圖。Google Fonts API 的額外 blocking stylesheet 加重首次顯示時間。

## 修正與驗收方法

| 項目 | 實作位置 | 可驗證結果 |
|---|---|---|
| 文章圖片連結名稱、metadata 對比、分類觸控與焦點 | `assets/journal-posts.js`、`assets/journal-all.js`、Journal 兩份模板 | 四 viewport axe；鍵盤聚焦連結；保留原有文章／圖片／名稱 |
| 動態清單造成位移與失焦 | 同上、`assets/news-archive.js`、`assets/hana-cms.js` | 初始 HTML 包含當時已公開的 11 篇文章／9 則消息；同資料回傳不重建 DOM；更新／空／SDK 失敗／no-JS 各有測試 |
| 首屏晚套用規則及重複隱藏 | `assets/runtime-layout.css`、`site-core.js`、`site.js`、28 個共用樣式模板 | 提前載入相同 core→global 規則；保留缺少 link 的舊頁 JS fallback；`build-runtime-layout.mjs --check` 比對規則 |
| 首頁載入後區塊搬移 | `index.html` | 原始 HTML 改成既有正式站最終 Explore→About→News 順序，原 JS arranger 成為 no-op；沒有改對外呈現的資訊架構或文字 |
| 圖片與字體網路成本 | 首頁、`site-core.js`、`style.css` 及新增資產 | 同圖 WebP／尺寸變體，原圖保留；兩個品牌字體及版本不變，font-face 直接隨既有 CSS 傳送，英文／數字 WOFF2 以同版本檔案在本站 preload，其餘 CJK 子集仍來自 fonts.gstatic.com |
| CMS 自訂首頁圖片 | `assets/hana-cms.js` | 已知原始 HERO 映射為對應 WebP；自訂圖移除舊 srcset，避免選到預設照片；不寫入 CMS |

## 字體位移回歸的收斂

第一次移除 Fonts API stylesheet 後，課程頁在 Latin／數字字體交錯載入時測到 CLS 約 0.151。Trace 證實是文字換行位置變動，而非圖片未設尺寸。改將同版本 Latin 子集放在 `assets/fonts/` 並從共用頁面 preload，保留 SIL Open Font License；其餘中文子集仍用既有 CDN。這項變動必須另重測，不能用先前的結果宣稱新版本通過。

## Journal 首屏封面

目前首篇 AWAIT 的 721×1280 JPEG 為 131,902 bytes，但主版原本固定以置中 4:3 顯示。新增相同置中裁切的 480×360／720×540 WebP，分別 31,880／49,942 bytes；只替換主版圖片資源，保留原照片 URL、其他卡片及 CMS 資料。僅匹配該不可變的完整公開檔名；新封面仍沿用原 URL，不以文章名稱猜圖。

## 公開內容快照維護

快照僅包含已發布公開資料，以原有 renderer 產生，不含預約或個人資料。更新工具：

```sh
node scripts/refresh-public-snapshots.mjs published-posts.json published-announcements.json
node scripts/build-runtime-layout.mjs --check
```

輸入應重新以既有公開 CMS 的 published 篩選與原排序匯出，不能用草稿／未排序資料。`fixtures/` 是本次唯讀測試資料，不是未來發布來源。正式頁仍讀取 CMS，資料不同或成功回傳空集合都會更新；相同資料維持目前 DOM 與焦點。SDK／API 失敗與 no-JS 則保留最後一次發布的公開快照。**因此 CMS 發布／撤稿時應同步刷新快照與發布網站**，否則離線／無 JS 訪客可能看見舊公開內容。沒有變更 CMS 資料或後台發布流程。

快照中的日期在客戶端沿用原有時區格式化；JSON fingerprint 使用原始 timestamp，避免僅因時區不同重建整個列表。新增文章或內容變更仍可能造成合理的資料更新位移；本次保證的是相同資料不無故重建，不宣稱所有未來內容都零位移。

## 驗收與限制

詳細數值見 `../TEST-RESULTS.md` 最新階段、`FINAL-PERFORMANCE.md` 與 `benchmarks-release/summary.json`。基準 before 保存在 `benchmarks-final/`，最後 after 是另一輪固定版本測量。axe 零違規不等於 WCAG 全面合規；其餘頁面既有對比、首頁 ENTER 與主標語意仍待決策。Lighthouse 是實驗室資料，不能代表真實使用者 INP；沒有取得 CrUX／RUM，沒有宣稱通過 field Core Web Vitals。不同來源字體／圖片與代理延遲會使單次數值波動，保留全部原始報告。

首頁與課程內容只提供 `../HOME-COURSE-APPROVAL.md` 核定表；核定前不改名稱、費用、作品說明、合報排程或 ENTER 架構。

## 尚待後續工作

- 首頁手機 LCP／Performance 仍未達內部目標；保留為 UX-007，不以本次 Journal 達標替代。可繼續評估既有 intro 其餘圖片與載入順序；ENTER 是否必經／主標語意由品牌先核定。
- 其他頁單次測量未達門檻的結果均列入 FINAL-PERFORMANCE，不因這批通過 Journal 技術驗收就宣稱全站效能完成。
- 首頁、氣味自修室等既有對比與預約站獨立欄位問題仍列原問題清單；本批沒有修改價格、品牌文字或金流。
