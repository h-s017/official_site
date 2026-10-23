# 本批發布與正式站驗證

2026-10-23。產品 [PR #18](https://github.com/h-s017/official_site/pull/18) 已合併；產品提交 `83e7498f8df3cf63055bcb8cf706718a21d09766`，main 合併提交 `5a3f0d8af8d502503cb71a6ddda7d0ef4646e741`。[Pages run 39931775258](https://github.com/h-s017/official_site/actions/runs/39931775258) 成功。正式部署仍由 `h-s017/official_site` 的 main 根目錄提供 https://hanascent.com/。

## 上線後實際證據

- `production-assets.json`：14/14 SHA-256 相符，包含六個本批產品檔案及八個刻意保留的控制器／CSS／共用 JS／KPIA／HELORI。`verify_production_assets.py` 保存比對方法。
- `results/production-matrix.json`：六頁×390×844、768×1024、1440×900、320×844 共 24/24 完成，主內容零 axe 違規、零 root 溢出、零 JS pageerror；首頁仍有與基準相同的 optional `page_contents` 404，以靜態內容 fallback，不宣稱所有請求皆成功。四種 Vol.1 封面均已載入並解碼，實際 candidate 見 production-summary.json。
- `production-intro/results.json`：四 viewport＋no-JS／儲存受阻／reduced-motion 共七情境通過，自動開場、同 session 跳過、重播、暫停、Escape、關閉、焦點返回及品牌 h1 正常。ENTER computed background 透明且目標 ≥44px；原始 axe 的照片文字對比違規／incomplete 完整保留。
- `screenshots/production-*.png` 及 `production-intro/*.png`：正式站手機、平板、桌機及 320px 截圖。這些是發布後唯讀回歸，沒有再次執行 Lighthouse，也沒有 CrUX／RUM／INP 驗收或預約／付款測試。
- GitHub PR 沒有配置 status check runs，不能宣稱 PR CI 通過；依據是 Repository 保存的本機測試、Pages 成功及上線後實際驗證。

## 本批後續範圍

保存此證據的提交僅新增／更新 `docs/ux-audit/`，不再修改產品檔案；其 Pages 再發布仍使用相同產品雜湊。首頁仍未達 lab 效能目標，透明文字對比仍待設計核定，課程 C01–C06 待品牌回覆。未重新定價、改文案、改付款或重測付款。
