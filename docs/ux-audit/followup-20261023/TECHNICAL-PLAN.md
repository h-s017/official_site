# 技術方案與採用判斷

基準 main `61600e47002095c65361cbe0ff14c12098160737`，2026-10-23。沿用前次核定的首次 session 藝術開場、透明 ENTER、h1、三張影像、原動畫與字體。只有可重現且可驗證的局部修正進入發布。

| 項目 | 證據 | 方案及結果 | 最終採用 |
|---|---|---|---|
| Vol.1 封面下載 | 原 PNG 474,529 bytes；位於首屏以下，與首屏文字／字體競爭下載 | 同圖 WebP 720w / 1366w；明列尺寸、srcset、lazy、low priority；不改構圖或圖中文字 | 是 |
| 局部灰字對比 | 等 reveal 完成後，首頁 1、自修室 2、產品開發 5 個節點仍低於 4.5:1 | 只將對應小字改為 #666666；不更動全域灰色、不擴大到全部標題 | 是 |
| KPIA／HELORI 對比 | 初始 600ms 抽樣的灰色仍混合 fade；1500ms 穩定抽樣不再違規 | 更正初步判讀，不為動畫中間狀態任意覆寫頁面色彩 | 不修改 |
| 首頁首張藝術影像 | Lighthouse 的 LCP 是首張開場照片；冷下載與渲染、整頁字體依賴都影響模型 | 試過控制器／首張 AVIF 預載、原 WebP fallback；單次先改善，三次中位數卻回退（8.115 → 9.892s） | 已完整撤回 |
| 同品牌字體子集 | baseline 約 21 個字體請求、約 1.78MB；Noto 跨多個 CJK 子集 | 原家族與獨立內部 alias 兩方案；同 Noto v37、同權重、323 字，仍有多個 fallback 請求且 LCP 回退 | 已完整撤回 |
| 課程資訊 | 名稱、合報排程、作品規格及揭露方式仍待品牌確認 | 提供 COURSE-DECISIONS.md 的 C01–C06，不填入推測內容 | 僅文件 |

## 圖片產製

來源 `assets/1.png`（1366×768），原圖保留。ImageMagick `convert` 以 `-strip -quality 90` 產生 1366w WebP；另以 `-resize 720x -strip -quality 90` 產生 720w。尺寸分別 214,684 / 49,496 bytes，較原圖少 54.8% / 89.6%。新檔案在 `assets/courses/`。人工檢視封面文字、門及紙張構圖；瀏覽器驗證不同 DPR／viewport 的選圖。

Vol.1 的 LCP 元素是首屏 `.course-card p.lead` 文字，不是這張下方封面。改善不能歸因為「LCP 圖片改小」；此方案降低不必要的競爭下載。圖片保持原比例且補齊 intrinsic dimensions，不宣稱原本 CLS 超標。

## 撤回試驗的證據

`pilot/` 是早期單次 AVIF／預載；`pilot-critical/` 與 `pilot-alias/` 是字體試驗；`pilot-final-candidate/` 保存預載方案最後三次結果。這些都不是發布程式，不能取其中高分代表最終結果。`critical-glyphs.json`、`font-validation.json` 只記錄試驗字元及版本；對應字體／CSS／AVIF 沒有進入 Repository 的產品目錄。當時的五項 preload/fallback 檢查也只作試驗歷史。

首屏仍未達內部目標，下一步需要隔離字體 fallback 的實際觸發字元、以 matched runs 量測依賴鏈，再提出小範圍傳送方案；不調整動畫節奏、不延後／移除開場來取得分數。透明 ENTER 的對比仍依原核定保留，需另行設計核定，不宣稱 AA。
