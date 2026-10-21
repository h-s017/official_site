# 修改前後差異

產品變更只有 `assets/site.js`；其餘為報告、腳本與證據。正式站未部署，正式站仍是 Before。

| 項目 | Before | After（本機分支） |
|---|---|---|
| 390／320px MENU 收合後 Tab | 第 2 個焦點進入透明的「此域 HINENI」，後續仍可進不可見課程連結 | 第 2 個焦點為可見 MENU；收合內容 inert、不進入 Tab 順序 |
| 手機展開 MENU | 焦點沒有移入可見導覽 | 由 MENU 鍵盤展開時移到第一個可見連結 |
| 課程 Escape／MENU Escape | 沒有關閉及焦點歸位行為 | 先關閉課程並聚焦觸發按鈕，再關閉 MENU 並聚焦 MENU |
| 桌機課程按鈕 Enter | >980px click handler 提早 return，aria-expanded 仍為 false | 真正開關 panel，aria-expanded 與可見狀態同步 |
| 導覽 ARIA | role=menu 中為一般連結，mobile axe 報 aria-required-children | 使用一般導覽 disclosure，保留連結與名稱；收合／展開連結可操作 |
| 橫向溢出 | 正式站 56 組 root scrollWidth 未超過 viewport | 本機主站 52 組未超過；未聲稱原本有溢出或本次修復溢出 |
| 內容、價格、品牌、付款 | 基準版本 | 未修改 |

`results/before-nav.json`：初始 22 項斷言中 9 項失敗。`after-nav.json`：24 項通過（新增兩項展開焦點檢查）；最終完整回歸另見 `after-nav-final.json`，含最後課程連結位於 viewport 的檢查。失敗明細與 viewport 都保存在 JSON，不能只看程序 exit code。

逐頁 axe 與 Lighthouse 前後數字見 TEST-RESULTS。正式站與 localhost 的效能分數不直接作因果比較；同本機基準與修改版另有抽樣，仍為單次 lab，不代表真實使用者改善或已達驗收。

完整捲動對照：screenshots/before-local-scrolled-home-390x844.png 與 after-local-scrolled-home-390x844.png；其他頁面索引見 screenshots/README.md。早期 before-live 截圖是在進場動畫未全觸發時保存；不可把全頁圖中的透明區塊判為使用者捲動後的內容缺失。補拍使用真正的 instant 捲動，未改產品動畫。

初次受阻的 before-browser.json、環境錯誤與 TLS 失敗結果保留為歷史紀錄；最新成功矩陣取代「無測試環境」狀態。本 PR 仍為 Draft：效能與已知 P1 尚未通過，預約正式建單／付款／完成頁尚未受控驗證。
