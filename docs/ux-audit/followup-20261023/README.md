# 手機體驗技術追蹤｜2026-10-23

[PR #18](https://github.com/h-s017/official_site/pull/18) 已合併並完成 Pages 部署；正式站 14/14 檔案比對、24/24 跨裝置及七個 ENTER 情境通過。[上線證據與限制](PRODUCTION.md)。

本批只發布 Vol.1 封面傳送及局部小字對比修正。首次 session 藝術開場、透明 ENTER、原動畫、品牌 h1、字體及課程內容全部保留；預約／付款未重測。基準為 `h-s017/official_site` main `61600e47002095c65361cbe0ff14c12098160737`，GitHub Pages 從 main 根目錄發布。

## 最終採用與待辦

- Vol.1 同圖 WebP、responsive srcset、明列寬高及延遲載入，原 PNG 保留。首屏以下的封面不搶首屏文字下載，圖片本身不是 LCP 元素。
- 首頁服務入口索引、自修室淡灰底 kicker、產品開發網絡的小字改 #666666。未改全域灰色、服務名稱、價格、正文或圖片構圖。
- 首頁預載／AVIF 與同版本字體子集都未穩定改善 LCP，已完全撤回。詳見 [方案及採用判斷](TECHNICAL-PLAN.md)，不選探索高分作發布結果。
- 課程決策整理為 [C01–C06](COURSE-DECISIONS.md)，未核定項目維持現況。

## Lighthouse：相同環境三次冷快取

| 頁面 | Performance 中位數（範圍）前 → 後 | Accessibility 前 → 後 | LCP 秒中位數（範圍）前 → 後 | CLS 前 → 後 |
|---|---|---|---|---|
| 首頁（自動藝術開場） | 75（73–75）→73（73–76） | 93→93 | 8.115（7.748–14.471）→9.162（6.913–14.772） | 0.0265→0.0265 |
| Vol.1 | 86（86–86）→100（99–100） | 100→100 | 4.205（4.202–4.205）→1.731（1.727–1.804） | 0.00194→0.00194 |

首頁未達 Performance≥90／LCP≤2.5 秒。本批首頁僅改索引小字色彩，沒有保留效能候選修改；前後數字仍有明顯波動與重疊，不能宣稱首頁效能改善。Vol.1 三份最終報告均達上述 lab 內部目標。沒有把原本就很低的 CLS 說成本批修好的缺陷。

原始 12 份發布對照報告及三次 summary 在 `lighthouse/`；`comparison.json` 包含中位數、範圍及 TBT。`before-summary.json` 和 `after-summary.json` 分開保存，`summary.json` 是最後階段的 runner 輸出。

## 跨裝置與功能

實際 URL：首頁 `/`、Vol.1 `/overture/`、KPIA `/KPIA/`、HELORI `/helori/`、氣味自修室 `/practice/`、香氛產品開發 `/product-development/`。四種 viewport：390×844、768×1024、1440×900、320×844。這是本批六頁回歸，前批全站 14 頁的覆蓋保留在 `../phase-2/`，沒有冒稱本次又重跑全站。

初次 600ms 擷取仍在 reveal fade 中，KPIA／HELORI 的對比誤報不作產品缺陷。改為捲動後等待 1500ms（超過既有最長 reveal），再作對比稽核；未停用或修改產品動畫。最終依據是 `results/before-stable-matrix.json` 與 `results/after-matrix.json`：前者 12/24 組有對比違規（每裝置共 8 個節點），後者 24/24 擷取完成、零 axe 違規、零 root 溢出、零 JS pageerror。首頁四組仍記錄既有 `page_contents` 公開請求 404，與基準相同且沿用靜態內容；並非全請求零錯誤，本批未改 CMS。首次初步矩陣保留，但其重複截圖已移除，使用穩定擷取作前後對照。

`after-intro/results.json` 另測四 viewport＋no-JS／儲存受阻／reduced-motion 共七情境，保留 dialog 的完整 axe 原始結果。透明 ENTER 在照片上的對比仍是 UX-002-C 已知限制，不能拿關閉 dialog 後的主頁零違規當作開場也通過 AA。

`loading-checks.json` 是最終 Vol.1 兩種 DPR／裝置的選圖與解碼檢查；`content-preservation.json` 確認四份 HTML 的可見文字、href、aria-label 與圖片 alt 均未變。`product-manifest.json` 保存六個產品檔案 SHA-256。JS 語法及 `build-runtime-layout.mjs --check` 通過，共用 runtime CSS／控制器未修改。

## 環境與限制

Python Playwright 1.62.0、Chromium 154.0.8037.57、axe-core 4.10.3、Lighthouse 12.8.2、Node 24.19.0，TLS 正常驗證；本機 server 對 HTML／CSS／JS／JSON／SVG 啟用 gzip。Lighthouse 使用預設 mobile 412×823、模擬 RTT150ms／1638.4Kbps／CPU×4，與上述四種 UI viewport 分開。冷瀏覽器逐次執行，測量期間不並行其他瀏覽器測試；外部 CMS／字體 CDN 仍有時間差，因此不能等同真實網路分布。

這些是 lab 數據，不是 CrUX／RUM；沒有真實使用者 INP，TBT 不代稱 INP。沒有實體手機、NVDA／VoiceOver 或完整人工色彩／視覺障礙驗收，不宣稱全站 WCAG 2.2 AA 或 field Core Web Vitals 通過。付款依使用者告知已測試，不再執行，不作本批發布門檻。

## 重跑方式

安裝相同工具後，將基準 checkout 放在 Repository 同層 `hana-followup-baseline`。`python docs/ux-audit/followup-20261023/benchmark.py before|after`；原始報告拒絕覆寫。`python docs/ux-audit/followup-20261023/verify.py` 執行本機 UI／開場／選圖；`--base https://hanascent.com --label production` 只執行正式站唯讀 UI／開場，不進入預約流程。若要重跑，使用新的標籤或另存目錄，不能覆寫既有證據。
