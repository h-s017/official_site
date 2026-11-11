# HANA 網站預設視覺規範

確認日期：2026-11-12。使用者明確指定：往後製作的所有網站與 Web 工具，預設沿用官網的顏色與字型；除非另外明確指定，不自行另創配色或字型風格。

## 正式基準

- 官網：https://hanascent.com/
- 樣式來源：`assets/style.css`、`assets/runtime-layout.css`。
- 可重用的純字型與色票：`assets/hana-brand.css`；以 `node scripts/sync-brand-tokens.cjs` 從官網樣式重新產生。
- 背景：白色 `#ffffff`；淡灰表面 `#f7f7f7`。
- 主文字：黑 `#111111`，表單與報價深灰 `#303234`；輔助文字 `#4a4a4a`。
- 中性色階：`#1f1f1f`、`#767676`、`#d9d9d9`、`#eeeeee`；分隔線 `#dedede`。
- 字型：`"Cormorant Garamond","Noto Serif TC","Source Han Serif TC","Source Han Serif","思源宋體","Songti TC","PMingLiU",serif`。
- 不另外改用綠色、奶油色或獨立無襯線後台主題。
- 手機輸入字級至少 16px，保留清晰、可調大的字級與足夠操作區域。

## 套用範圍

官網、後台、學員工具、Sites、新增管理站、HANA OS 及各專案 Web 工具均遵循此基準。以既有正式樣式為主；若未來官網基準更新，先讀取最新版再製作。

## 開發站整合

開發管理已併入 `/admin/quotes/` 的既有案件／報價編輯流程。既有 Sites 入口不作為第二個配方主資料源；過去匯出的案件 JSON 可手動匯入工作參照，既有報價欄位不會自動被覆蓋。
