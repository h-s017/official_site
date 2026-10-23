# 滿寬 Hero 與漂浮課程預約

2026-10-24（Asia/Taipei）。使用者要求放大 Hero 如 HINENI 首頁，並讓課程預約按鈕隨畫面捲動。基準 main `d9dd6712f1df729c178cc43bcc6add290aa31851`。

## 參考站與手機呈現取捨

已實際讀取 https://hineni.hanascent.com/，390×844／1440×900 均 HTTP 200。Hero 無左右留白，分別為 390×658.3、1440×702px；原站桌機採 `clamp(520px,78vh,920px)`，手機採 `min(78vh,760px)` 並 cover 裁切。量測在 `hineni-measurements.json`，參考截圖 `reference-hineni-{390,1440}.png`。

HANA 現有 1920×1080 橫圖內含品牌字樣，手機直接套 78vh 的 cover 會裁掉文字。已詢問手機偏好；未把未回覆當成同意換圖或裁字。本批先採保留品牌的方案：**與參考站同樣左右滿寬，保留原圖 16:9 比例及文字**。這不是相同的 78vh 高度；若使用者希望手機也用高直幅，後續需核定直式照片／文字呈現。沒有擅自換圖、生成影像或移除圖中的品牌內容。

## 實際修改

- `index.html`：Hero 移除左右及頂部外距、取消圖片邊框／陰影，容器滿寬、圖片維持原比例，`sizes` 由90vw改100vw。圖片原檔、srcset、語意 h1、正文及藝術開場保留，說明文字區仍保留閱讀留白。
- 課程預約改為**單一右下角漂浮連結**，桌機寬220px、手機160–220px，最小高52px。維持黑底白字／方角／原字體；頁首、中段及頁尾位置固定，不使用捲動事件或新增JS套件。
- 按鈕置於 body 直下的具名稱 aside，避開 Hero/reveal 的 transform 祖先；避免 fixed 元素反而跟容器捲動。DOM位置在導覽後，手機鍵盤不必遍歷整頁才找到預約。
- 藝術開場或手機選單開啟時隱藏按鈕，關閉後恢復。底部與右側使用 safe-area inset；頁尾保留100px＋安全區、根頁設定 scroll-padding-bottom，使頁尾內容可完整捲到按鈕上方。
- 原主視覺下方及桌機導覽的重複預約按鈕移除，藝術影像重播仍在主視覺說明下方。預約URL沿用 https://reservation.hanascent.com/，沒有中繼頁、價格、課程名稱或付款邏輯修改。

## 前後與參考截圖

| 項目 | 手機 | 桌機 |
|---|---|---|
| 現行修改前 | [390](before-390x844.png) | [1440](before-1440x900.png) |
| 最終頁首 | [390](after-top-390x844.png) | [1440](after-top-1440x900.png) |
| 捲動中 | [390](after-scroll-390x844.png) | [1440](after-scroll-1440x900.png) |
| 完整頁尾 | [390](after-footer-390x844.png) | [1440](after-footer-1440x900.png) |
| HINENI參考 | [390](reference-hineni-390.png) | [1440](reference-hineni-1440.png) |

## 最終檢查

五 viewport＋手機 no-JS 共六情境通過。每組比較頁首／捲動1000px／頁尾的固定座標，位置差<1px；footer完整邊界位於漂浮按鈕上方，按鈕高度≥52px、無根頁水平溢出、鍵盤focus可見、CTA範圍axe零違規。實際tap／click關閉開場、重播／Escape／返回焦點正常；手機MENU開啟時不留下被覆蓋的預約焦點，關閉恢復，短螢幕560px高仍在viewport內。連結目標以攔截回應驗證，**不載入預約應用、不建單、不測付款**。

| Viewport | Hero尺寸 | 漂浮CTA尺寸 |
|---|---|---|
| 390×844 | 390×219.4 | 195×53.5 |
| 768×1024 | 768×432 | 220×53.5 |
| 1440×900 | 1440×810 | 220×53.5 |
| 320×844 | 320×180 | 160×53.5 |
| 1199×900 | 1199×674.4 | 220×53.5 |

原始資料在 results.json，檢查腳本 check.py。Playwright／Chromium154、axe4.10.3；未做實體手機 safe-area、VoiceOver／TalkBack、Lighthouse／CrUX／RUM／INP驗收，不宣稱全站AA或首頁效能達標。中段漂浮介面會覆蓋局部畫面，採精簡右下角尺寸減少覆蓋；不是宣稱整頁任何位置都沒有覆蓋。頁尾及固定位置則有實際量測。

原 `booking-cta-preview/check.py` 是前一版雙預約入口的歷史腳本；本版本使用本資料夾的檢查。可設定 HANA_HERO_BASE／HANA_HERO_OUT 另存唯讀正式站驗證。原生dialog的close事件非同步，測試等待實際恢復可見後才斷言，沒有改產品關閉時序。

發布沿用 `h-s017/official_site` main根目錄的GitHub Pages，依既有完成後直接合併部署授權。實際部署狀態以本批PR／Pages工作為準。
