# HANA SCENT ARTIST｜UX/UI Audit V2

稽核日期：2026-10-21（Asia/Taipei）。狀態：**原始碼初步稽核；動態驗收未完成**。本次不部署、不修改正式內容、價格或付款流程。

## 來源與證據

- 已確認 Repository：[h-s017/official_site](https://github.com/h-s017/official_site)。不是依名稱推測 hana-focus。
- 基準提交：`fd28c1bbcaf4a6236565bf4bf2539ddbe4538d6e`，分支 `main`。
- [CNAME](https://github.com/h-s017/official_site/blob/fd28c1bbcaf4a6236565bf4bf2539ddbe4538d6e/CNAME) 指向 `hanascent.com`；README 說明正式站與獨立預約站分工。
- [GitHub Pages 成功部署](https://github.com/h-s017/official_site/actions/runs/38419469231)：來源 main、上述提交，2026-10-13 15:09:20 UTC 完成。此為既有部署紀錄，本次未觸發部署。首頁公開文字擷取與該版本的入口、課程連結及介紹相符；未取得正式站 HTTP 位元組做完整雜湊比對。
- 遠端工作分支：`audit/ux-ui-v2`。Git clone 因代理連線失敗，改由 GitHub 連接器取得固定提交的 77 個文字檔；不是完整 clone，未下載二進位圖片。Repository tree 未找到 AGENTS.md。
- `results/source-manifest.json` 保存檔名、大小、blob SHA；`results/static-inventory.json` 保存 18 個相關模板的連結、h1、圖片屬性、價格及 redirect。18 個檢查模板皆已比對原始 blob SHA。

## 架構

純靜態 HTML、多個目錄 index.html 與舊 .html 轉址頁；沒有在本次範圍中找到 package.json 或現有自動化測試設定。`assets/style.css` 為共用 CSS，頁面另有 inline style；`assets/site.js` 載入 `site-core.js`，兩者再注入 CSS、替換導覽及 Footer，首頁文字與區塊順序也在執行時改寫。因此只讀 HTML 無法代表完整畫面。

`hana-cms.js` 管理消息與文章，依賴外部 SDK；`hana-blog.js`、`journal-posts.js`、`journal-all.js` 另處理文章。部署採 GitHub Pages；現有 migrate-overture workflow 為教材搬移用途，不是本次執行項目。

## 逐頁 URL 與結果

「公開擷取成功」僅代表網頁讀取工具取得文字，可能使用快取（查得日期從當日至三週前），**不等於直接 HTTP 狀態或瀏覽器操作成功**。「工具無法存取」不能判為 404 或網站停機。以下所有頁面的四種 viewport、圖片裁切、溢出、sticky 遮擋、Footer、CLS、觸控操作及截圖均未完成。

| 頁面 | 實際 URL | 可用性證據／轉址 | 初步 UX 結果 |
|---|---|---|---|
| 首頁 | https://hanascent.com/ | 公開擷取成功 | ENTER 多一個操作步驟；首次焦點未管理，沒有 h1。四入口具中文、英文、序號；第 3 項英文較長，320px 待測。UX-002/005/006 |
| 課程總覽 | https://hanascent.com/courses/ | 公開擷取成功 | Vol. 0/1/2、HELORI、KPIA 路徑可由 source 確認；合報資訊存在。共用選單 UX-001 |
| 氣味藝術序曲 | https://hanascent.com/overture-series/；https://hanascent.com/overture/ | 系列頁依 canonical/選單確認，尚未公開擷取；Vol. 1 公開擷取成功。`overture.html` 為舊入口 | 系列頁與 Vol. 1 是不同層級，不能視為同一頁；單堂、合報均連到預約站首頁，未帶課程參數 |
| KPIA 證書課程 | https://hanascent.com/KPIA/ | 公開擷取成功；保留大小寫 | 課程架構與 LINE 諮詢存在；未明列費用、總時數、件數，需人工確認資訊揭露方式。UX-004 |
| HELORI | https://hanascent.com/helori/ | 公開擷取成功 | 10ml、雙人、50ml 入口存在；未明列費用、時數；部分諮詢與 Footer 使用不同 LINE 短網址，目的地待驗證。UX-004 |
| 氣味自修室 | https://hanascent.com/practice/ | 公開擷取成功；`/scent-study-room/` source 以 meta refresh + JS 導向 `/practice/`，舊 URL 公開擷取失敗 | 費用、3 小時、作品容量、舊生優惠存在；同一預約首頁承接多方案，選擇是否保留待測 |
| 藝術育成 | https://hanascent.com/incubation/ | 公開擷取成功 | 兩種創作路徑、四步驟及 Tally CTA 存在；Tally 載入、錯誤、送出未驗證 |
| 品牌合作 | https://hanascent.com/business/ | 公開擷取成功 | 五服務與合作流程存在，CTA 指向 `/business/inquiry/`；表單有 label、required 及送出中／失敗處理，未實際送出 |
| 香氛產品開發 | https://hanascent.com/product-development/ | 公開擷取成功 | 開發洽詢與 PIF 入口有區分，六階段可辨識；詢問頁及服務預選未動態驗證 |
| H SCENT JOURNAL | https://hanascent.com/journal/ | source canonical 確認；公開工具無法存取 | 依賴動態文章載入，不能據此判定不存在。文章、封面、分頁、失敗狀態待測 |
| 最新消息 | https://hanascent.com/news/ | 公開擷取成功但只有「載入中」 | 此為文字擷取，不證明正常瀏覽器也卡住；source 已確認 SDK 缺少直接 return、錯誤僅 console，沒有全面錯誤 UI。UX-003 |
| 預約與聯絡 | https://reservation.hanascent.com/；https://hanascent.com/visit.html | 公開工具皆無法存取；visit 原始碼存在 | 預約站為獨立站，僅確認多頁 CTA 指向它；聯絡頁有具 title 的 Tally iframe 及預約入口。未驗證課程、時段、資料確認與完成頁 |

未確認任何頁面確實不存在。上述不可存取項目是測試工具限制；舊入口為 source 宣告的 client redirect，未驗證正式站 redirect chain、狀態碼或最終 URL。

## 課程一致性與價格

| 課程 | 原始碼中的費用／時數 | 作品／報名 |
|---|---|---|
| Vol. 1 | NT$4,500／6 小時 | 個人氣味及淡香精；預約站 |
| Vol. 2（補充檢查） | NT$6,500 | 和弦結構與不同載體應用；預約站 |
| Vol. 1＋2 | NT$10,500／12 小時 | courses、overture-series、overture、accord-etude 所見費用一致 |
| 氣味自修室 | 3 小時；800／1,150／2,080／1,580 起／陪同 200；10ml 加購 300；舊生 95 折 | Basic 試樣、10ml、50ml、蠟燭；預約站 |
| HELORI | 主頁未明列費用與時數 | 10ml、50ml、雙人；預約站或 LINE |
| KPIA | 主頁未明列費用與總時數 | 課程架構、證書路線；LINE |

**已比對範圍內的價格衝突清單：未發現；跨預約站、CMS、LINE 的比對尚未完成，不能宣稱價格全面一致。** 合報優惠與單堂相加不同本身不構成衝突。未修改任何價格，也不推算缺失價格。課名同時存在「KPIA 大韓專業調香師證書」「KPIA 專業調香師課程」，屬呈現用語差異，需人工核定，未自行改名。

## 優先級與決策

原始碼問題／風險共 8 項：P0 0、P1 6、P2 2。這是初步 source 清單，非完成跨裝置稽核後的總數。未確認可安全直接修正並複測的 P0，故本次僅文件及稽核工具，沒有產品程式碼修正。

待人工審核的方案（均未實作）：

1. ENTER 保留現有藝術影像，評估改為可選入口或提供直接進入主內容；先比較首次完成預約的步驟與鍵盤體驗，再決定首頁架構。
2. 四入口保留現有服務名稱與攝影，先測 320px 下換行與點擊辨識，再提具體間距／排版方案，不重做視覺。
3. KPIA、HELORI 決定是否公布時數、費用、作品與預約方式；由品牌提供核定資訊。
4. 合作／產品頁已有 CTA 與流程；優先驗證表單服務預選、成功／失敗和手機鍵盤，再評估是否新增回覆時程與所需資料文案。
5. 首頁 h1、載入失敗提示與服務名稱一致化涉及內容或語意結構，提出具體文案後審核。

尚須在可啟動瀏覽器、可連正式站且可取得測試資料的環境，完成四 viewport、每頁手機／桌機截圖、axe、Lighthouse、人工鍵盤與預約完整流程。正式送出預約、聯絡訊息與付款需使用測試環境／測試資料；本次未建立正式訂單或發送訊息。
