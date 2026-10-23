# 移除藝術開場右上角文字按鈕

依使用者提供的手機截圖，取消右上角「暫停播放／關閉 ×」白底按鈕。基準 main `f6a291d119751c2c1dbb9aa71cf650f704dc5993`。

畫面只保留原透明直排 ENTER；首次 session 自動開場、三張照片、動畫、同 session 跳過及重播不變。ENTER 即可進站，鍵盤 Escape 仍可關閉並返回焦點。移除重複的關閉按鈕；暫停按鈕保留在可及樹，平常視覺隱藏，Tab 聚焦時在畫面下方顯示，Space 可暫停，讓右上角保持乾淨。reduced-motion 仍直接顯示靜態影像。

產品只修改 `index.html` 的控制項／局部 CSS／控制器 cache query，及 `assets/optional-intro.js` 移除已刪按鈕的 selector。課程、價格、照片、ENTER 外觀與付款流程未變；預約／付款未重測。

## 驗證與預覽

`python docs/ux-audit/clean-intro/check.py`：390×844、768×1024、1440×900、320×844，加 no-JS／sessionStorage 受阻／reduced-motion 共七情境通過。驗證沒有右上角控制項、透明 ENTER、首次焦點、Tab 顯示暫停、Space 暫停動畫、Enter／Escape 關閉、焦點返回、同 session 跳過及重播。JS 語法與 git diff --check 通過。

- [手機修改前](before-390x844.png)／[修改後](intro-390x844.png)
- [桌機修改前](before-1440x900.png)／[修改後](intro-1440x900.png)
- 原始功能及 axe 結果：`results.json`。透明 ENTER 在影像上的已知色彩對比限制保留；未宣稱 WCAG 全通過。沒有重跑 Lighthouse 或 field 效能驗收，不沿用其他版本分數。

前批 `restored-intro/check.py` 及 followup wrapper 是當時有右上角控制項的版本紀錄；本版本開場回歸請使用本資料夾腳本。可透過 HANA_INTRO_BASE／HANA_INTRO_OUT 指定唯讀正式站與另存證據，避免覆寫本機結果。
