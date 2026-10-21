# UX/UI V2 第二階段：正式發布及驗證

2026-10-21。Repository：`h-s017/official_site`，GitHub Pages 由 `main` 根目錄發布至 https://hanascent.com/。

- 技術修正：[PR #13](https://github.com/h-s017/official_site/pull/13)，已合併。
- 程式提交：`6c7b91aeb546ecb9f496f1728eb4b52bcbdd5eba`；main 合併提交：`7a733de619964d312fead1ca530685ce68b33c27`。
- [正式發布工作](https://github.com/h-s017/official_site/actions/runs/39550567267)：成功。
- 發布後 15 個關鍵 HTML／CSS／JS／字體／封面檔案與提交 SHA-256 完全相符。
- 正式 Journal／archive／News 四 viewport 共 12/12，零 axe 違規、零 root 溢出；共用導覽 26/26。證據見 `phase-2/production/`，另存正式 Journal 手機／桌機截圖。

本次完成 Journal 連結名稱、對比、觸控與焦點、公開資料載入及位移修正、同品牌字體與圖片傳送最佳化；本機 14 頁×四 viewport 56/56，21 個資料情境與 6 個邊界檢查通過。Lighthouse mobile 三次中位數：Journal Performance 97、Accessibility 100、LCP 2.466s、CLS 0。這是 lab，不是 CrUX／RUM／INP 驗收；其中一次 Journal LCP 2.565s，沒有聲稱每次都達標。

首頁 mobile Performance 69／LCP 7.881s、Vol.1 單次 Performance 86／LCP 4.130s 及其他頁既有對比仍待後續。首頁／課程內容只提供 HOME-COURSE-APPROVAL.md，尚未核定；價格、品牌文字與付款流程未修改。使用者已告知付款測試完成，本批未重跑預約／付款、未建單。

本發布驗證紀錄的後續提交只增加 docs 證據；沒有再修改產品檔案。其他文件中的早期測試／未部署描述是歷史快照，以本紀錄及 PR／Actions 真實狀態為準。

---

## 第一階段發布紀錄（歷史）


2026-10-21（Asia/Taipei），使用者授權已完成項目直接提交、合併並部署。

本次可發布的產品變更為 `assets/site.js`：修正手機 MENU 收合後仍可進入隱形焦點，並同步課程 disclosure、鍵盤開關、Escape 與焦點歸位、滑鼠和 breakpoint 行為。產品修正提交為 c1d2ca7；其後提交只新增發布紀錄及重跑證據。

合併前再次執行 `nav_regression.py`，26/26 通過，結果在 `results/release-nav.json`。原有主站52組跨裝置、正式站56組與Lighthouse等證據保留；沒有把待辦列為已完成。遠端PR沒有配置CI check runs或commit statuses，並非CI已通過的主張；發布依據為已保存的實際測試。

價格、正式內容、品牌視覺與付款流程沒有修改。Journal無障礙、效能／CLS、首頁與課程資訊決策、預約付款端到端驗收仍是後續事項。完整UX/UI V2與WCAG2.2 AA尚未全數驗收，沒有CrUX/RUM。

發布 PR：[h-s017/official_site#12](https://github.com/h-s017/official_site/pull/12)。正式部署沿用 `main` 的 [GitHub Pages workflow](https://github.com/h-s017/official_site/actions/workflows/pages/pages-build-deployment)。實際合併提交、時間及部署成功狀態，以 PR 與 [Actions runs](https://github.com/h-s017/official_site/actions) 的記錄為準；本文件不預先宣稱已上線。

其他稽核文件中的「未部署」「Draft」「deployed:false」是稽核完成時的快照，不代表之後的線上狀態。正式站發布後仍需重跑導覽 smoke test，確認實際供應的site.js與發布版本一致。
