# 現有設計規範與建議

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
