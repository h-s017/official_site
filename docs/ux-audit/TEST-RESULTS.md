# 測試環境、結果與限制

日期：2026-10-21（Asia/Taipei）。基準 `fd28c1bbcaf4a6236565bf4bf2539ddbe4538d6e`。

## 已執行

| 項目 | 結果 | 證據 |
|---|---|---|
| Repository／CNAME／Pages 紀錄 | 確認 official_site/main；已有成功 Pages run | AUDIT-REPORT、results/source-manifest.json |
| 原始碼盤點 | 18 個主要及補充模板；blob SHA 18/18 符合 | results/static-inventory.json |
| JS 語法檢查 | `node --check`：site.js、site-core.js、hana-cms.js 成功 | 只代表可解析，非功能測試 |
| 公開 URL 文字讀取 | 10 個主要頁面文字可讀；系列入口另由 source 確認；Journal、聯絡、預約及舊自修入口工具不可讀 | AUDIT-REPORT 逐頁表。工具可能使用快取，無法證明即時 HTTP status |
| Playwright 啟動 | 阻擋，Chromium 在 navigation 前退出，socket Operation not permitted | results/before-browser.json、browser-attempt.txt |
| 網路與本機 server | clone/curl 無法連代理；本機 socket 被 sandbox 阻擋；額外權限請求取消 | results/environment.txt |

## 四 Viewport 驗收矩陣

| 檢查 | 390×844 | 768×1024 | 1440×900 | 320×844 |
|---|---|---|---|---|
| 橫向溢出／文字截斷／圖片裁切／留白 | 未執行 | 未執行 | 未執行 | 未執行 |
| 導覽操作／觸控區域／Footer／sticky 遮擋 | 未執行 | 未執行 | 未執行 | 未執行 |
| 鍵盤／焦點／表單／對比／layout shift | 未執行 | 未執行 | 未執行 | 未執行 |
| 截圖 | 缺件 | 缺件 | 缺件 | 缺件 |

沒有任何已通過的跨裝置結果。Browser runner 的 blocked 結果中 pages 為空，不能視為 0 個缺陷。即使後續 capture 成功仍須人工審查，腳本不會判定 WCAG 通過。

## 效能與無障礙

Lighthouse、axe-core 尚未執行；目前 Node module resolution 未找到這兩個套件，外部依賴下載也受代理故障影響。Python Playwright 可匯入、Chromium 存在，但無法啟動。沒有 Performance 或 Accessibility 分數，沒有 LCP、INP 或 CLS 數值。

| 目標 | 修改前 | 修改後 |
|---|---|---|
| Lighthouse Performance ≥90 | 未測 | 無產品修改，未測 |
| Lighthouse Accessibility ≥90 | 未測 | 無產品修改，未測 |
| LCP ≤2.5s／CLS ≤0.1 | 未測 | 未測 |
| 真實使用者 INP ≤200ms | 無 CrUX／RUM | 無 CrUX／RUM |
| WCAG 2.2 AA | 未驗收 | 未驗收 |

Lighthouse 是實驗室資料；TBT 不能當作真實 INP。Core Web Vitals 真實使用者驗收須另取得 CrUX／RUM，分裝置以適當觀測期間及第 75 百分位評估。axe 未報錯也不能代替鍵盤、螢幕閱讀器及人工 WCAG 評估。

## 可重跑方法（需要可用測試環境）

1. 完整 checkout 本 PR，安裝 Python Playwright 與可啟動的 Chromium；使用完整圖片與字體、SDK，不能以本次部分 source 副本作視覺效能基準。
2. `python docs/ux-audit/scripts/static_audit.py` 更新 source inventory。基準 manifest 固定在原始提交；若產品修改，SHA 不符是預期差異，必須審查。
3. `python docs/ux-audit/scripts/browser_audit.py --output /tmp/hana-before --axe-script /absolute/path/axe.min.js`。取得本地 axe-core 固定版本，記錄實際版本與雜湊。先測正式基準，再以 `--base-url` 指向完整本機／預覽站、`--phase after`、另一 output 目錄重跑。腳本拒絕覆寫既有結果。
4. 有 Lighthouse 時，逐主要頁面冷快取 mobile／desktop 各至少三次，保存 JSON/HTML、版本、throttling、cache、錯誤與中位數。只比較相同條件，不以此宣稱 field INP 達標。
5. 人工檢查：首次 ENTER 與已進入、Tab/Shift+Tab、Enter/Space/Escape、focus 可見及不被 sticky 遮蔽、手機 MENU 與最後一個課程連結、320px 長英文、Footer、200% 縮放、reduced-motion、SDK／CMS／字體／圖片失敗與慢網。
6. 測試環境預約：課程與方案 → 日期／名額 → 聯絡資料與錯誤提示 → 確認價格與作品 → 測試完成頁。確認不建立正式訂單，不修改付款流程。聯絡表單也須驗證失敗保留資料與成功訊息，不用正式收件人做測試寄送。

`browser_audit.py` 只做讀取、基本尺寸檢查及截圖，**不完成預約**，不代替上述人工步驟，不測真實使用者效能。第三方內容與 CMS 的可用性、正確價格仍須人工或受控測試環境確認。
