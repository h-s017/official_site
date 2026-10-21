# 測試結果與驗收限制

更新：2026-10-21（Asia/Taipei）。產品基準 fd28c1bbcaf4a6236565bf4bf2539ddbe4538d6e，修改版只有 assets/site.js 的導覽行為變更。

## 環境與執行

- 完整 Git clone，Chromium 154.0.8037.57、Python Playwright 1.62.0、Node 24.19.0、axe-core 4.10.3、Lighthouse 12.8.2。
- HTTPS 使用環境代理與已知環境 CA 的 NSS 信任；**未停用 TLS 驗證**。原始 sandbox 曾阻擋 socket，後以獲准的測試權限執行；早期錯誤保留為歷史紀錄，非現在的測試結果。
- 正式站基準：https://hanascent.com/；修改版與原始提交在同一環境的 loopback HTTP server 執行，圖片完整，外部字體／CMS 使用相同外部來源。測試伺服器沒有部署對外站點。
- Playwright 每個入口／viewport 使用新 context；390/320 為 mobile＋touch，768 為 touch，1440 為 desktop。CSS 進場動畫需要捲動才呈現，最終完整截圖使用 instant 捲動觸發；未改產品 CSS 或移除動畫。
- Lighthouse 預設 mobile 412×823、DPR 1.75，simulate：RTT150ms、throughput1638.4Kbps、CPU×4；desktop 使用 preset。這與 Playwright 的四種 viewport 是兩套獨立測試。每組單次，未達三次中位數；代理延遲、快取與外部字體影響很大，不作 field 或統計顯著性主張。

## 跨裝置與互動

| 測試 | 結果 | 證據 |
|---|---|---|
| 正式站 14 入口 × 4 viewport | 56/56 擷取完成，HTTP200；0 root 水平溢出 | before-live-matrix.json |
| 修改版 13 主站入口 × 4 viewport | 52/52 擷取完成；0 root 水平溢出 | after-local-scrolled-matrix.json |
| 原始本機首頁／課程的完整捲動對照 | 8/8 完成 | before-local-scrolled-matrix.json |
| 初始導覽回歸 | 22 項中 9 項失敗（手機隱形焦點、Escape、桌機狀態） | before-nav.json |
| 最終導覽回歸 | 26/26 通過，含新增展開焦點與最後連結 viewport 檢查 | after-nav-final.json |
| 預約流程 | 真實資料讀取，可選系列／課程／日期／時段並進資料步驟；空白驗證正常 | flow-checks.json |
| 合作表單本機攔截測試 | 服務預選正確；失敗保留資料、按鈕重新啟用；成功 reset | flow-checks.json；Formspree POST 在 Playwright 內 fulfill，未寄信 |
| 最新消息 SDK 失敗 | 顯示既有可見錯誤，不永久 loading；撤回 UX-003 | flow-checks.json、before-news-sdk-failure 截圖 |
| 原始碼／語法 | 18 模板 blob 符合基準；node --check site.js 通過；稽核 Python 可編譯、git diff --check 通過 | static-inventory.json；source manifest |

預約有效「確認訂單」就會 POST /api/orders 建單，因此本次停止於 step 4 空資料驗證。沒有正式訂單、付款、信件或 Tally 送出；**未驗證付款完成及報名完成頁**。正式付款測試需要可控的測試後端與金流環境。step 4 的 axe label 問題不能以入口頁 Accessibility100 掩蓋。

## axe 結果

每組執行 WCAG 2A/AA、2.1A/AA、2.2AA tags；incomplete 也保存於 JSON。以下列出各頁跨 viewport 的 violation rule 聯集，數字不是 WCAG 整站合規分數。沒有列出某 rule 不代表人工檢查已通過。

| 頁面 | Before：正式站初始狀態 | After：本機完整捲動 |
|---|---|---|
| home | aria-required-children, color-contrast | color-contrast |
| courses | aria-required-children | 本次狀態未報 violation |
| overture-series | aria-required-children | 本次狀態未報 violation |
| overture | aria-required-children | 本次狀態未報 violation |
| kpia | aria-required-children | color-contrast |
| helori | aria-required-children | 本次狀態未報 violation |
| practice | aria-required-children, color-contrast | color-contrast |
| incubation | aria-required-children | 本次狀態未報 violation |
| business | aria-required-children | 本次狀態未報 violation |
| product-development | aria-required-children | color-contrast |
| journal | aria-required-children, color-contrast, link-name, target-size | color-contrast, link-name, target-size |
| news | aria-required-children | 本次狀態未報 violation |
| contact | aria-required-children | 本次狀態未報 violation |
| booking | 本次狀態未報 violation | 未修改；step4另報 label |

手機導覽的 aria-required-children 已消除，且用真正鍵盤測試證明隱形焦點修正。前後 screenshot 的進場動畫／CMS 資料時間點不同，新增或減少的其他對比警示不可直接歸因為程式修正。首頁、序曲系列、HELORI、自修室及 Journal 仍須依最新 nodes 審查。

## Lighthouse 初始實驗室數據

完整報告保存在 results/lighthouse/*.json.gz，可解壓 JSON；不是只有截取分數。分數與所有 metric 均為單次 lab。TBT 不是 INP。

| 入口 | 模式 | Performance | Accessibility | LCP(s) | TBT(ms) | CLS |
|---|---|---:|---:|---:|---:|---:|
| home | mobile | 53 | 91 | 37.0 | 180 | 0.000 |
| home | desktop | 67 | 95 | 5.0 | 0 | 0.000 |
| courses | mobile | 56 | 94 | 14.5 | 0 | 0.000 |
| overture-series | mobile | 56 | 94 | 16.0 | 0 | 0.000 |
| overture | mobile | 56 | 94 | 17.7 | 0 | 0.000 |
| kpia | mobile | 56 | 94 | 14.7 | 0 | 0.000 |
| helori | mobile | 56 | 94 | 14.6 | 0 | 0.000 |
| practice | mobile | 55 | 95 | 16.1 | 0 | 0.000 |
| incubation | mobile | 56 | 94 | 15.2 | 0 | 0.000 |
| business | mobile | 55 | 94 | 15.9 | 0 | 0.000 |
| product-development | mobile | 56 | 94 | 15.4 | 0 | 0.000 |
| journal | mobile | 36 | 83 | 16.1 | 128 | 0.411 |
| news | mobile | 38 | 94 | 13.6 | 0 | 0.375 |
| contact | mobile | 55 | 94 | 13.9 | 94 | 0.000 |
| booking | mobile | 56 | 100 | 10.1 | 0 | 0.000 |

## 相同本機條件抽樣比較

兩份本機服務分別從基準提交與修改版提供相同資產；每組仍只有一次，不將分數波動解讀為已證實效能改善或退化。

| 頁面／模式 | Performance before→after | Accessibility before→after | LCP before→after(s) | CLS before→after |
|---|---|---|---|---|
| home/mobile | 55→55 | 91→96 | 37.502→37.507 | 0.018→0.000 |
| home/desktop | 71→66 | 95→95 | 4.963→5.287 | 0.000→0.000 |
| courses/mobile | 56→56 | 94→100 | 14.700→14.668 | 0.000→0.000 |

導覽修正使本機課程 mobile Accessibility94→100、首頁 mobile91→96；首頁仍有其他無障礙問題，不能宣稱 AA 通過。Performance 未達90，沒有因本次導覽修正聲稱效能優化達標。首頁 desktop71→66 屬單次觀測差異，需固定環境三次中位數與 trace 才能判斷。

## 尚未完成的驗收

- LCP≤2.5s、Performance≥90：本次 lab 未達；字體／圖片／阻塞資源與 trace 需後續改善。Journal／News 初始 lab CLS0.411／0.375 亦高於0.1。
- 真實使用者 LCP／INP／CLS：沒有 CrUX 或 RUM，無法確認第75百分位及觀測期間，不宣稱任何 field 達標。INP≤200ms 未驗證。
- WCAG2.2 AA：axe 已執行且有待修違規；尚未完成 VoiceOver/NVDA、全面對比、200%縮放、iOS/Android實機與第三方全部表單狀態的人工驗收。
- 初始 viewport root 無溢出不等於所有選單、圖片裁切、sticky焦點與動畫狀態都已全面通過；本次人工圖像檢查與程式檢查只能覆蓋已保存狀態。特別是 ENTER 是否增加轉換成本、長文章閱讀與第三方表單需再做人測。
- 舊 client redirect 的完整鏈、實際 LINE/Tally 回覆、PIF表單所有狀態、正式建單／付款完成尚未驗證。

## 重跑

1. 完整 checkout，保留原圖。固定 axe-core4.10.3、Lighthouse12.8.2，Python Playwright1.62.0 與 Chromium154；安裝到獨立 /tmp audit prefix，不修改站台執行依賴。
2. `capture_matrix.py --base <origin> --label <unique-label> --out <artifact-dir> --axe <local-axe.min.js>`，執行四 viewport。標籤不可覆寫；啟動瀏覽器需要可用 socket、代理與 CA 信任。此腳本不送表單，不執行付款。
3. `nav_regression.py --base <origin> --out <json>`；會針對語意測試阻擋 Google Fonts，避免下載影響焦點斷言。正式矩陣與 Lighthouse 沒有阻擋字體。FAIL 會回傳非零。
4. `lighthouse_batch.py --base <origin> --label <unique-label> --out <reports> --lighthouse <cli/index.js>`；輸出完整 gzip JSON 與 summary。相同主機條件重複至少三次後比較中位數。
5. `flow_checks.py` 是本次讀取預約、localhost:8010合作表單攔截與SDK失敗測試；使用前改為正確本機 port，POST/PUT/PATCH/DELETE 有攔截，不用它建立正式訂單。

第一輪的 browser_audit.py / before-browser.json 為歷史診斷；最新成功證據以 capture_matrix.py 的指定 JSON 為準。未取得額外環境權限或有效CA時，請記錄限制，不關閉 TLS 驗證，不將錯誤頁截圖作成功結果。
