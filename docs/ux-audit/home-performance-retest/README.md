# 首頁效能重測｜正式站 main 1423a14

結論：**手機尚未達標；桌機中位數達標但有波動；本次實驗室CLS均低於0.1。** 本批只測試與保存證據，沒有修改產品程式、圖片、字體、藝術開場、課程或付款。

量測時間為2026-10-28 UTC，精確fetchTime見各原始報告。正式首頁HTTP200、HTML SHA-256與main 1423a14一致，詳production-source.json。CMS及字體CDN為當時實際回應，非凍結fixture。

## Lighthouse結果

每組三次冷瀏覽器，以下為中位數（括號內範圍）。

| 情境 | Performance | LCP | CLS | TBT | Accessibility |
|---|---:|---:|---:|---:|---:|
| 首次手機，自動藝術開場 | 56（45–57） | 20.94秒（19.32–22.46） | 0（0–0.00004） | 437ms（53–557） | 100 |
| 手機已看過開場，冷快取 | 76（75–92） | 5.92秒（2.94–6.01） | 0 | 67ms（63.5–185.1） | 100 |
| 首次桌機，自動藝術開場 | 90（76–93） | 1.83秒（1.50–3.63） | 0.00127 | 2ms（0–4.5） | 100 |

- LCP≤2.5秒、Performance≥90：兩組手機未達標；桌機只在中位數符合，一輪LCP3.63秒／76分，因此不能宣稱穩定通過。
- CLS≤0.1：九次實驗室結果符合。本輪載入／觀察時段外仍可能有其他位移，不能據此驗收所有流程。
- Accessibility100是Lighthouse自動檢查分數；首次開場隔離背景，不能代表全站或完整WCAG2.2AA通過。
- **TBT不是INP。** INP≤200ms無法驗收：公開PageSpeed API回傳429，未取得可用CrUX或RUM。錯誤證據field-data-unavailable.json。

已看過開場情境：Puppeteer在每次新文件預設sessionStorage的既有hana-intro-restored-seen=1，然後以同版Lighthouse執行；每次新瀏覽器、正常重設儲存／快取，檢查dialog.open=false。這是「相同冷快取、只略過開場」診斷，不等同真實暖快取回訪者。實作與旗標驗證見returning-lighthouse.mjs、returning-summary.json。

首次組LCP候選包含開場照片及Hero，依載入與動畫時序而異；不能把所有LCP時間都解讀為同一張圖的下載時間。第三次手機final-screenshot仍可確認藝術開場出現。詳summary.json中的lcpElement／lcpPhases及各Lighthouse報告。

## 主要證據與下一步

### 1. 非主要內容的大圖占用初始傳輸

蝴蝶結顯示44px，但目前直接載入使用者指定PNG，原檔1,179,302 bytes，單次網路傳輸約1.18MB。這是當初明確保留原圖的版本，本次沒有自行改成其他圖案或格式。

建議後續評估：保留原PNG與外觀，先測原圖載入優先序／時機；若仍不足，再提出同圖小尺寸無損展示版本，核對外觀後採用。不能在尚未做受控前後測前保證改善幅度。

### 2. 字體傳輸比Hero更值得先處理

首次手機傳輸中位約4.03MB；已看過開場手機約3.31MB。兩者皆有21筆字體請求、約1.78MB，保留Noto Serif TC與Cormorant Garamond。已看過開場情境中，字體與原蝴蝶結合計約89.6%傳輸；Hero1920 WebP約104KB傳輸，並非最大的單一資源。

建議檢查重複字體來源、首屏實際字集及載入鏈，保持品牌字體、不直接全面換字。歷史曾有字體子集／preload試驗反而退步，因此新方案必須有獨立分支及同條件前後測。

### 3. 藝術開場與首屏圖的發現／優先序

三張開場圖合計約0.72MB傳輸，略過開場不載入這三張；首次手機分數明顯較低。首輪Lighthouse模擬LCP20.94秒，其中該次Load Delay約14.81秒；這是模擬分解，不能與未節流真實網路時間混為一談。

建議只對首次session首張圖提早發現與適當優先序，後續圖延後，保留原開場、ENTER、照片及動畫。主頁Hero仍需在略過開場情境獨立驗收，因為略過開場後LCP中位仍5.92秒。

### 4. 樣式與初始化成本

略過開場手機首輪main-thread約3秒，其中Style & Layout約1.52秒，JS evaluation約264ms；不能把全部成本歸因JavaScript下載。CSS／共用導覽重複注入及字體到位後的布局值得分析，避免直接全面重寫。原始bootup-time、mainthread-work-breakdown及network-requests在Lighthouse報告中。

## 瀏覽器診斷（與Lighthouse分開）

observe.py以未節流Chromium，在390×844／DPR3與1440×900測首次、略過開場各一次，觀察15秒／8秒後操作ENTER及導覽；未開啟預約或付款。四情境：

| 情境 | 未節流觀察LCP | CLS session window | 最大Event Timing樣本 |
|---|---:|---:|---:|
| 首次手機 | 1000ms | 0 | 48ms |
| 首次桌機 | 952ms | 0.000788 | 56ms |
| 略過開場手機 | 740ms | 0 | 56ms |
| 略過開場桌機 | 640ms | 0.000788 | 16ms |

這些是單次雲端瀏覽器診斷，沒有慢網路／CPU模擬；不能拿來取代Lighthouse手機慢速情境，也不是INP或真實使用者p75。Event Timing僅收集≥16ms事件、樣本數有限，沒有樣本不代表0ms。原始事件、LCP候選與位移來源見browser-observations.json。沒有Safari／iPhone／Instagram真機驗證。

## 工具與重現

Lighthouse12.8.2、Chromium154.0.8037.57、Node24.19.0；Python Playwright1.62。確切版本environment.json。TLS正常驗證，HTTPS透過雲端proxy；測量期間沒有並行其他瀏覽器工作。

- Mobile：412×823、DPR1.75；模擬RTT150ms、1638.4Kbps、CPU×4。
- Desktop：1350×940、DPR1；桌機preset、RTT40ms、10240Kbps、CPU×1。
- 執行順序：mobile1／desktop1／mobile2／desktop2／mobile3／desktop3，再略過開場手機三次，最後未節流診斷。
- 原始Lighthouse完整JSON以.gz保存，共九份，非只存分數；summary.json可用summarize.py由原報告重建。
- 復現首次組：使用../scripts/lighthouse_batch.py，--pages home，--label指定新名稱，--base https://hanascent.com，--lighthouse指向Lighthouse CLI；環境CHROME_PATH=/usr/bin/chromium。既有名稱不覆蓋。
- 略過開場：安裝lighthouse@12.8.2於/tmp/hana-audit-tools後node returning-lighthouse.mjs（固定三次，拒絕覆蓋既有原始結果）。observe.py另行執行，不與Lighthouse並行。

舊紀錄手機73分／LCP9.162秒與本次56／20.94秒並非同日受控A/B：產品版本、網路、CDN與測試主機狀態皆可能不同。可確認本次未達標，但不能直接把分數變化歸因某一次視覺調整，或把手機Hero縮小當作已證明的解法。

截圖：first-session-390x844.png、first-session-1440x900.png、seen-session-cold-390x844.png、seen-session-cold-1440x900.png；另附四張Lighthouse final-screenshot抽出圖。
