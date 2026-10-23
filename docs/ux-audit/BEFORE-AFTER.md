# 白底蝴蝶結課程預約｜2026-10-24

黑底方框箭頭按鈕改為白底細框圓角及淡粉蝴蝶結，手機390px寬195→175.5px，桌機220→198px，高53.5→48px。 詳細圖與證據：[booking-bow](booking-bow/README.md)。

---

# 修改前後差異

> 第二階段（2026-10-21）：Journal 技術方案及修正見 [TECHNICAL-PLAN](phase-2/TECHNICAL-PLAN.md)，內容決策見 [首頁／課程資訊核定表](HOME-COURSE-APPROVAL.md)。下方原階段紀錄保留；最新結果另見本檔後續補充。付款依使用者告知已測試，本階段不重測。

產品變更只有 `assets/site.js`；其餘為報告、腳本與證據。本文件記錄部署前的測試對照；後續發布範圍及實際狀態見 RELEASE.md。

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

初次受阻的 before-browser.json、環境錯誤與 TLS 失敗結果保留為歷史紀錄；最新成功矩陣取代「無測試環境」狀態。稽核階段 PR 為 Draft：效能與已知 P1 尚未通過，預約正式建單／付款／完成頁尚未受控驗證。

## 第二階段：Journal 技術修正

- Journal 四 viewport：原先 `link-name`／`target-size`／`color-contrast` → 零 axe 違規；archive 原先兩種 → 零。可見焦點、目標幾何與公開內容 fallback 另作互動驗證。
- 同資料延遲回傳：Journal CLS 0.611、News 0.587 → 兩者及 archive 均 0，焦點保留；Journal posts 請求由 2 次減為 1 次。這是資料刷新控制測試，不與整頁 Lighthouse CLS 混稱。
- 公開文章／消息先由 HTML 提供；SDK 失敗與無 JavaScript 仍可閱讀，API 成功回傳更新／空集合則呈現新狀態。快照維護限制見 TECHNICAL-PLAN。
- 首頁 HERO 2,224,150 bytes → 1920 WebP 103,420 bytes（少 95.4%）；手機依 srcset 選 17,040／44,324 bytes 版本。肖像原圖 843,655 → 88,330／27,818 bytes；logo 742,743 → 6,581 bytes（少 99.1%）。原始素材保留，沒有換圖或變更品牌字體。
- JS 在載入後注入的相同版面規則改為首屏 stylesheet；首頁原始 HTML 符合既有最終區塊順序，避免讀取中搬移。保留 ENTER 方案等待核定。
- 最終三次 Lighthouse 中位數與未達標項目見 TEST-RESULTS 最新段落；不以探索用報告代替最終數字。

證據在 `phase-2/`；手機／桌機完整截圖分別為 `screenshots/release-journal-390x844.png`、`release-journal-1440x900.png`（相對 phase-2），其他頁依同一命名。最後本機字體與 Journal 封面尺寸修正另有 release 四 viewport 全頁截圖。

## 2026-10-23：本批實際發布差異

- Vol.1 封面原 PNG 474,529 bytes → 1366w WebP 214,684 bytes／720w 49,496 bytes；保留原圖、構圖及文字，增加寬高、srcset、lazy、low priority。首屏 LCP 仍是文字，三次 lab LCP 中位數 4.205→1.731s、Performance 86→100，CLS 維持 0.00194。
- 首頁服務索引、自修室 soft-band kicker、產品開發 network 小字由 #767676 改為 #666666。四種裝置每組原有 8 個低對比節點 → 0；沒有改全域品牌灰色。
- 六頁四 viewport 回歸 24/24；ENTER 透明、自動開場與原動畫的控制器及 CSS 沒有修改。首屏效能候選（預載／AVIF／字體子集）因測試回退全數撤回，不能當作已發布改善。
- 課程 C01–C06 只整理問題，未改價格、正式名稱、正文或付款。四份 HTML 可見文字、連結及 alt 逐項相同。

[本批逐項結果、原始資料與截圖](followup-20261023/README.md)。首頁 lab 仍未達標，不以先前可選入口分數代表現在版本。

## 2026-10-24：醒目課程預約

首頁首屏原只有藝術影像重播入口 → 手機主視覺下方新增黑底白字「課程預約 →」，桌機導覽 ≥1200px 另設入口；兩者沿用頁尾的正式預約網址。原藝術開場及品牌內容不變。1199px 原有 scrollWidth 1228px → 無 root 溢出，開啟清單仍在 viewport。八項相關檢查通過，前後圖見 booking-cta-preview/。

## 2026-10-24 後續：Hero與漂浮預約

Hero由帶左右留白／最大1320px容器改為滿寬，保留原圖16:9與完整品牌文字，sizes100vw；以HINENI的滿寬作參考，未把橫圖硬裁成78vh。原Hero及寬桌機兩個預約按鈕改為單一右下角固定CTA，捲動保持位置；開場與手機選單時隱藏，頁尾預留空間。原價格、課程名稱、照片、ENTER與付款保留。六情境及截圖見hero-floating/。
