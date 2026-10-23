# 正圓預約按鈕｜2026-10-24

首頁預約局部規格：手機83.6px、其他91.2px正圓，白底1px黑框、50%圓角、15.2px文字、30.4px裝飾圖。 [截圖及測試](booking-circle/README.md)。

---

# 首頁漂浮預約局部樣式｜2026-10-24

白底#fff、黑字#111、1px黑框、999px圓角、16px品牌襯線字、48px高度，裝飾蝴蝶結32px。此為使用者指定的首頁局部按鈕，不覆蓋其他品牌元件。 詳細圖與證據：[booking-bow](booking-bow/README.md)。

---

# 現有設計規範與建議

> 第二階段（2026-10-21）：Journal 技術方案及修正見 [TECHNICAL-PLAN](phase-2/TECHNICAL-PLAN.md)，內容決策見 [首頁／課程資訊核定表](HOME-COURSE-APPROVAL.md)。下方原階段紀錄保留；最新結果另見本檔後續補充。付款依使用者告知已測試，本階段不重測。

狀態：已完成原始碼、四 viewport、computed 字級與 axe 對比盤點；保留品牌，未全面覆蓋 CSS。詳細實測值見 results/*matrix.json。

| 項目 | 現況依據 | 建議／驗收方向 |
|---|---|---|
| 字體 | style.css 首行 Google Fonts import：Cormorant Garamond 400–700；Noto Serif TC 400–900，display=swap。共用 serif stack 英文優先 Cormorant，中文落入 Noto Serif TC | 與指定品牌方向一致，無需更換。實際下載、CJK 字重與 fallback 位移仍待測 |
| 色彩 | --black/--ink #111；gray700 #4a4a4a；gray500 #767676；背景白；--line #dedede | 實測不同背景、照片上文字及 hover/disabled 對比；色碼存在不等於 WCAG 通過 |
| 內文 | body line-height 1.82；site-core 後加內頁 1.58、部分段落 1.62；mobile 多數段落覆寫 16px，但 News 等仍有 11.5–14px | 16–18px／1.6–1.8 為評估基準；逐元件確認，不全面覆寫 |
| 標題 | clamp、頁面 inline style 與 site-core 多層 !important；首頁原始碼沒有 h1 | 審核後補語意主標；保留既有字體與 editorial 節奏 |
| 按鈕 | .btn min-height 46px；導覽／社群圖示另有 30–34px 規則 | 主要按鈕維持至少 44px 建議。WCAG 2.2 AA 2.5.8 為 24 CSS px 或間距等例外；44px 建議不等於所有小於 44px 均違規 |
| 佈局 | wrap 1180px；首頁其他區塊有 860/980/1100px；760/980px 等 breakpoint；平板 761–980 顯示橫向導覽 | 測實際四 viewport，特別是 320px 長英文、768px 選單。僅修可重現問題 |
| 圖片 | 圖片 max-width 100%；hero contain、intro cover；多張 PNG 原檔大於 2MB | 保留攝影、構圖與明暗；以尺寸、srcset、WebP/AVIF 與寬高屬性改善，須做畫質比較 |
| 線條與陰影 | border #dedede；現有 --shadow、hero shadow、nav blur、卡片 hover shadow | 記錄與極簡方向差異；不新增裝飾、不自動刪除既有品牌呈現 |
| 動態 | 首頁 intro 15 秒輪播；消息 marquee 28/34 秒；部分 reduced-motion 規則 | 驗證鍵盤 focus 時靜止、暫停與 reduced-motion。檢查其他 transition 不可只憑已有 media query 判通過 |

後續統一元件應以現有 `.btn`、page hero、section head、卡片與 Footer 為單位，逐項處理 CSS 優先序。暫不做全站重構、服務改名、全面圖片深色化或新設計系統覆蓋。

實測補充：首頁入口數字在 #fafafa 背景使用 #767676，axe 量到 4.35:1；Journal meta 與自修室亦有對比警示。共用導覽的 inert／aria-controls／aria-expanded 為本次技術修正，沒有增加陰影、漸層、裝飾或更換字體。

## 第二階段的技術落實

保留 Cormorant Garamond v21、Noto Serif TC v37、白底黑字及原攝影。Journal metadata 使用 #565b56、日期 #596159、精選序號 #626962，改善原先不足的文字對比；分類連結高度至少 32px，主要小箭頭／列表入口至少 44px，鍵盤 focus-visible 有清楚 outline。不是把全站字號、圖片背景或裝飾統一覆蓋。

圖片的 width／height 與既有 CSS aspect-ratio 配合，保持既有裁切。共用規則由 `scripts/build-runtime-layout.mjs` 從原有 JS 靜態規則產生，順序不變；未做全站 CSS 架構重寫。未核定的首頁架構、服務名稱及課程說明見 HOME-COURSE-APPROVAL。

## 2026-10-23：局部對比修正

保留 Noto Serif TC／Cormorant Garamond、白底、原照片及透明白字 ENTER。只將首頁 `.entrance-index`、自修室 `.soft-band .kicker`、產品開發 `.pd-network .eyebrow`／`.pd-network-item span` 設為 #666666，避免 #767676 在 #fafafa／#f7f7f7 背景上低於 4.5:1。#666666 的計算對比約 5.50／5.36:1；沒有全域取代灰階。KPIA／HELORI 的穩定版面未重現低對比，故沒有任意加覆寫。透明 ENTER 的照片對比仍依核定保留為限制。

Vol.1 使用原圖的 720w／1366w WebP，保持 1366:768 比例與原有裁切。字體子集及首頁影像預載試驗未採用，不屬於目前設計規範。

## 2026-10-24：首頁主要課程預約入口

依使用者要求提高預約辨識度，首頁局部 `.home-booking-cta` 採既有 #111 黑底、白字、方角、無陰影，手機寬版約54px高、桌機導覽約45px高。主按鈕17px／導覽15px、原品牌字體；鍵盤外框清楚，hover 僅用在可 hover 裝置。原藝術影像重播保留為次要入口，未全域改寫按鈕規範。

## 2026-10-24 最新：滿寬Hero與漂浮CTA

Hero取消外側圖片框與陰影，圖滿寬、原16:9、完整品牌文字。新CTA只保留右下角一個：桌機220px寬，手機clamp(160px,50vw,220px)，最小高52px、17px原字體、方角黑白。使用safe-area，頁尾及scroll-padding預留100px＋安全區；開場／手機選單時隱藏。不套用到其他按鈕或頁面，不更換圖片。
