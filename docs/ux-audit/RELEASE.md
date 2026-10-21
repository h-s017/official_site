# 導覽修正發布範圍

2026-10-21（Asia/Taipei），使用者授權已完成項目直接提交、合併並部署。

本次可發布的產品變更為 `assets/site.js`：修正手機 MENU 收合後仍可進入隱形焦點，並同步課程 disclosure、鍵盤開關、Escape 與焦點歸位、滑鼠和 breakpoint 行為。產品修正提交為 c1d2ca7；其後提交只新增發布紀錄及重跑證據。

合併前再次執行 `nav_regression.py`，26/26 通過，結果在 `results/release-nav.json`。原有主站52組跨裝置、正式站56組與Lighthouse等證據保留；沒有把待辦列為已完成。遠端PR沒有配置CI check runs或commit statuses，並非CI已通過的主張；發布依據為已保存的實際測試。

價格、正式內容、品牌視覺與付款流程沒有修改。Journal無障礙、效能／CLS、首頁與課程資訊決策、預約付款端到端驗收仍是後續事項。完整UX/UI V2與WCAG2.2 AA尚未全數驗收，沒有CrUX/RUM。

發布 PR：[h-s017/official_site#12](https://github.com/h-s017/official_site/pull/12)。正式部署沿用 `main` 的 [GitHub Pages workflow](https://github.com/h-s017/official_site/actions/workflows/pages/pages-build-deployment)。實際合併提交、時間及部署成功狀態，以 PR 與 [Actions runs](https://github.com/h-s017/official_site/actions) 的記錄為準；本文件不預先宣稱已上線。

其他稽核文件中的「未部署」「Draft」「deployed:false」是稽核完成時的快照，不代表之後的線上狀態。正式站發布後仍需重跑導覽 smoke test，確認實際供應的site.js與發布版本一致。
