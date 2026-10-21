# HANA SCENT ARTIST｜UX/UI Audit V2

> 第二階段（2026-10-21）：Journal 技術方案及修正見 [TECHNICAL-PLAN](phase-2/TECHNICAL-PLAN.md)，內容決策見 [首頁／課程資訊核定表](HOME-COURSE-APPROVAL.md)。下方原階段紀錄保留；最新結果另見本檔後續補充。付款依使用者告知已測試，本階段不重測。

更新：2026-10-21（Asia/Taipei）。已完成跨裝置初始稽核及共用導覽 P0 修正；使用者已授權發布完成的導覽修正，發布範圍見 RELEASE.md。全站效能／WCAG／付款完成驗收仍未完成。

## Repository 與部署來源

- 正式站對應 [h-s017/official_site](https://github.com/h-s017/official_site)，來源 `main`，基準 `fd28c1bbcaf4a6236565bf4bf2539ddbe4538d6e`。CNAME 指向 hanascent.com、README 說明主站與預約站分工，並有 [成功 Pages run](https://github.com/h-s017/official_site/actions/runs/38419469231)。本次另成功完整 clone，沒有假設 hana-focus。
- 工作分支 `audit/ux-ui-v2`，既有 [PR #12](https://github.com/h-s017/official_site/pull/12)。產品修改僅 `assets/site.js`；其他修改為 docs/ux-audit 稽核交付。
- 預約站另查得 [h-s017/reservation](https://github.com/h-s017/reservation)，CNAME 為 reservation.hanascent.com，公開頁面設定與 source 相符。本次僅讀取，不修改其程式、付款或正式訂單。
- Repository tree 與本機搜尋未找到 AGENTS.md。純靜態 HTML、多個目錄 index.html、舊 .html 轉址；共用 style.css、site.js → site-core.js 注入樣式、導覽與 Footer。CMS/文章另由 hana-cms.js、journal-posts.js 等處理，News archive 有自己的載入與錯誤分支。
- 18 個模板的基準 blob SHA 已確認一致，清單在 results/source-manifest.json、static-inventory.json。正式站內容另有 CMS 動態資料，不能用 source SHA 代表 CMS 狀態。

## 測試範圍與證據

正式站 14 個入口 × 4 viewport，共 56 組：390×844、768×1024、1440×900、320×844，全部 HTTP 200 且完成截圖、尺寸檢查與 axe。包含 12 類指定頁面，以及序曲系列／Vol. 1 的分開入口。本機修改版涵蓋 13 個主站入口 × 4 viewport（52 組），預約站沒有修改。

共用導覽另以實際 Tab、Enter、Escape、滑鼠 hover、focus、resize 測試；初始 9 項失敗，修正後全數通過，另新增展開後焦點與最後連結可見性檢查。最終數量見 TEST-RESULTS。

Lighthouse 12.8.2 初始共 15 份（14 入口 mobile＋首頁 desktop），另保存本機基準／修改版的同條件抽樣。axe-core 4.10.3，Chromium 154；工具、限制及逐頁數值見 TEST-RESULTS。screenshots/README.md 提供截圖索引。

## 逐頁結果

以下「無溢出」限本次擷取時的 root scrollWidth，不等於所有動態狀態皆通過。閉合頁面的 axe 結果也不能代替所有選單／表單／輔具狀態的人工驗收。

| 頁面 | 實測 URL | 結果與待辦 |
|---|---|---|
| 首頁 | https://hanascent.com/ | 四 viewport HTTP 200、無 root 橫向溢出；ENTER、四服務入口、Footer 已保存。保留入口與品牌內容；缺 h1、intro 焦點、低對比數字待審。完整捲動截圖已排除進場動畫未觸發造成的假空白 |
| 課程總覽 | https://hanascent.com/courses/ | HTTP 200、四 viewport 無溢出。Vol. 0/1/2、HELORI、KPIA 連結存在；此頁重現並修正閉合選單隱形焦點 P0 |
| 氣味藝術序曲 | https://hanascent.com/overture-series/；https://hanascent.com/overture/ | 兩入口均 HTTP 200，分別為系列與 Vol. 1，四 viewport 無溢出；單堂與合報導向獨立預約首頁 |
| KPIA | https://hanascent.com/KPIA/ | HTTP 200、四 viewport 無溢出；主頁未明列價格／總時數，預約站有費用及 12×2 小時設定；是否回填主站待品牌核定 |
| HELORI | https://hanascent.com/helori/ | HTTP 200、四 viewport 無溢出；10ml、50ml、雙人入口存在。主站稱「香氣探索體驗」，預約站仍稱「香氣探索所」，列用語差異，不自行改名 |
| 氣味自修室 | https://hanascent.com/practice/ | HTTP 200、四 viewport 無溢出；四方案價格與預約設定／公開場次一致。陪同者、舊生優惠由預約頁提示私訊，主站仍連一般預約入口，須核定引導 |
| 藝術育成 | https://hanascent.com/incubation/ | HTTP 200、四 viewport 無溢出；兩路徑與 Tally CTA 可見，未向正式 Tally 收件者送出資料 |
| 品牌合作 | https://hanascent.com/business/ | HTTP 200、四 viewport 無溢出；五服務與 CTA 指向 business/inquiry。產品服務預選成功；本機攔截測試的失敗保留資料、按鈕復原與成功 reset 均正常 |
| 香氛產品開發 | https://hanascent.com/product-development/ | HTTP 200、四 viewport 無溢出；開發／PIF CTA 與六階段存在，保留服務名稱及文案，未變更結構 |
| H SCENT JOURNAL | https://hanascent.com/journal/ | HTTP 200、四 viewport 無溢出；確認可開啟，撤回先前工具不可讀的限制。axe 發現 link-name、target-size、對比問題；Lighthouse CLS 0.411，需後續改善 |
| 最新消息 | https://hanascent.com/news/ | HTTP 200、四 viewport 無溢出，正常資料可呈現。SDK 阻擋後有既有可見錯誤提示，撤回「永久載入」推論。Lighthouse CLS 0.375，載入前後高度待改善 |
| 預約及聯絡 | https://reservation.hanascent.com/；https://hanascent.com/visit.html | 兩入口 HTTP 200、四 viewport 無溢出。預約實測到資料步驟及空資料驗證；step 4 有未關聯的 label。有效「確認訂單」即會 POST 建立正式訂單，故停止於送出前；沒有付款完成驗收。聯絡 iframe 已擷取，未寄送訊息 |

沒有確認任何指定主要入口不存在。舊 `/scent-study-room/`、`overture.html` 等 source 為 client redirect；不是 HTTP 301 的證據，實際舊 URL redirect chain 尚未全部完成驗證。

## 課程資料一致性

已比對主站 source、正式預約頁 `C.COURSES` 與公開 GET /api/slots 的 course／variant／price，不含私人訂單資料。

| 課程 | 費用／時數對照 | 作品與報名 |
|---|---|---|
| Vol. 1 | 主站、預約設定與場次均 4,500；6 小時 | 個人氣味／淡香精；預約站 |
| Vol. 2 | 主站、預約設定與場次均 6,500；預約 10–16 時 | 和弦與載體應用；預約站 |
| Vol. 1＋2 | 三來源均 10,500；12 小時、2×6 小時 | 主站文字允許一次完成，預約設定要求選兩個日期，屬流程／文字差異，需核定，不自行更改 |
| Vol. 0 | Basic 800、Mini 1,150、Full 2,080、Candle 1,580 起，四基礎價格一致；3 小時 | 試樣／10ml／50ml／蠟燭；陪同 200、舊生 95 折與加購 300 在主站，預約 UI 指示部分方案私訊 |
| HELORI | 主頁未明列費用；預約 10ml 單／雙 990／1,980，50ml 單／雙 1,800／3,600，另列原價，場次同價 | 主站 10ml／50ml／雙人體驗；預約時段為 2 小時 |
| KPIA | 主頁未明列；預約一般 39,000、雙證書 44,000、無酒精課 6,500，場次同價；一般／雙證書 12×2 小時 | 證書及作品件數說明仍需品牌核定 |

**價格衝突清單：本次已比對相同 course／variant 的來源，未發現數值衝突。** 主站缺項、合報排程與名稱差異不視為價格衝突；未選定或修改任何價格，未判定付款端最終金額已驗收。詳見 results/flow-checks.json。

## 已修正與人工決策

UX-001 為 P0，修正在 assets/site.js：收合導覽及課程 panel 使用 inert；aria-expanded／aria-controls 與狀態同步；移除不符內容結構的 role=menu；支援鍵盤開關、ArrowDown、Escape、點擊外部、滑鼠與 breakpoint 切換，展開／關閉時焦點可見。保留字體、版面、服務名稱、連結、內容與付款流程。

目前有效問題 **P0 1（已修正）、P1 8、P2 1**，合計 10；另 UX-003 已撤回，不計入。ISSUES 保留證據及狀態，沒有將待審事項標為已完成。

待人工決策：ENTER 是否保留為必要入口、首頁主標文案、課程資訊揭露與名稱、合報排程文字、舊生／陪同者報名引導、品牌合作回覆說明。技術後續：字體／圖片效能、CMS 版面位移、Journal 可及性及獨立預約站表單標籤。無 CrUX/RUM，不宣稱真實 LCP／INP／CLS 達標；合併與部署狀態以 RELEASE.md 所連結的 PR／Actions 記錄為準。

## 第二階段補充

在已發布導覽修正的 `0c47a0e` 上，完成 Journal／archive 的連結名稱、對比、觸控及資料刷新穩定性，並優化 News 的清單載入及共用圖片／字體／首屏樣式傳送。14 個主站內容入口×四 viewport 完成，沒有訪問預約站。完整技術方案與維護限制見 phase-2/TECHNICAL-PLAN.md。

逐頁原始結果及截圖見 phase-2/results/release-matrix.json。Journal、archive 與消息四 viewport 的 axe 均為零；全站仍有已知其他頁對比問題，沒有宣稱全面 AA。首頁 ENTER／h1、課程排程／名稱／作品與費用揭露只列核定表，不代替品牌決策。

付款測試依使用者告知已完成，本批不重跑、不建單、不改金流；早期報告中的「未完成付款」僅指當時稽核範圍。
