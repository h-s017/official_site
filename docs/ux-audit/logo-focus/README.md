# 手機進站後品牌標題的焦點外框

依使用者截圖修正。基準 main `ce46af73e69ad15d205fe879621d1377a7ace682`。外框來自首次開場關閉後，JS 將焦點返回 `.site-nav .logo`；Chromium 即使使用 tap／click，仍將這個程式焦點判為 `:focus-visible`，顯示 UA `outline:auto 1px`。不是品牌設計邊框，只加 `:not(:focus-visible)` 不足以修正。

## 最小修改

`assets/optional-intro.js` 記錄 dialog 內 pointer 與鍵盤輸入。只有觸控／滑鼠關閉後返回品牌連結時，暫時加入 `data-intro-pointer-focus`，保留真正焦點位置；失焦或下一次鍵盤輸入即清除。`index.html` 局部 CSS 只抑制這個 pointer 狀態的品牌外框，鍵盤則保留清楚的 2px focus-visible。控制器 query 更新避免沿用快取。

保留中央透明 ENTER、乾淨右上角、暫停／Escape、session 及品牌 h1。沒有全站移除 outline，也沒有變更課程內容、價格、圖像、動畫或付款；不重測付款。

## 檢查

`check.py` 於390×844、768×1024、1440×900、320×844 實際使用 tap／click 重現 before `outlineStyle:auto`；after 為 `none` 且焦點仍在 logo，零 root overflow。按 Shift 及重新載入後 Tab 都能顯示鍵盤焦點；手動重播 Escape 返回重播按鈕；另驗證首次以 Enter 關閉後，品牌焦點仍可見，共五情境通過。原開場七情境回歸亦通過，保存在 `intro-regression.json`。JS 語法與 diff check 通過。

| 狀態 | 手機 | 桌機 |
|---|---|---|
| 修改前，點擊進站 | [390](before-pointer-390x844.png) | [1440](before-pointer-1440x900.png) |
| 修改後，點擊進站 | [390](after-pointer-390x844.png) | [1440](after-pointer-1440x900.png) |
| 修改後，鍵盤提示 | [390](after-keyboard-390x844.png) | [1440](after-keyboard-1440x900.png) |

原始數據 `before-results.json`／`after-results.json`。Chrome Android in-app browser 的實體裝置未連線，採 Chromium 的 mobile／touch 模擬；未重跑 Lighthouse 或宣稱全站 AA。透明 ENTER 對比限制仍沿用既有紀錄。本機：`python docs/ux-audit/logo-focus/check.py`；唯讀正式站可指定 HANA_LOGO_BASE／HANA_LOGO_OUT，另存結果。
