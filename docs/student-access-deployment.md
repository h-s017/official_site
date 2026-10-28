# 學員申請與審核部署紀錄

> 2026-10-29 更新：自動通知與 Auth SMTP 已接上 Resend，管理員補寄兩封顯示 Delivered。通知設定最新狀態見 [student-notifications.md](student-notifications.md)；下列初次部署時的「未實作通知／尚未發布」描述為歷史紀錄。

2026-10-29 登入修正：使用者明確同意「同一瀏覽器持續登入」後，共用 SDK 改用同源 localStorage 持續保留工作階段；舊 sessionStorage 僅遷移一次，標記避免其他舊分頁在登出後復活憑證。學員資格與訂單仍每次由後端確認，持續登入不代表永久核准；管理員審核仍需 MFA。網路或 Auth 暫時失敗會顯示重試畫面，不當成登出重新導向。密碼重設成功後不再顯示原解說段落。共用裝置須自行登出。

## 頁面與操作

- 學員入口 `/student-tools/`：Email、姓名、手機、曾上課程（KPIA／KDCA／氣味藝術序曲，可複選）、個資同意、個人密碼。先驗證 Email，再等待 HANA 審核。
- 審核 `/admin/students/`：沿用既有 `profiles.role = admin`，不新增管理員。第一次自行綁定驗證器；每個管理員登入工作階段需達到 `aal2` 才能讀取學員資料及審核。原 CMS 側欄有入口。
- 原料購買 `/student-tools/materials/`：共用學員工作階段。每筆新訂單均由資料庫檢查當下的審核狀態及驗證信箱，價格從伺服器目錄取得。取消資格立即阻擋新訂單。已存在的訂單仍可由本人讀取。
- 不寄送自動核准通知；學員可登入或按重新檢查取得結果。手機只作審核聯絡，未宣稱已通過簡訊驗證。

## 本次已完成的驗證

`node --test tests/student-access.test.cjs` 以固定版本 PGlite 建立獨立、記憶體內 Postgres，模擬既有 Auth schema、角色及訂單 API。測試不連正式專案、不寄信、不建立真實帳號。

涵蓋假造 metadata、匿名 RPC、學生自我核准、私有資料表與角色寫入、未審核直接下單、跨學生訂單、管理員缺少 MFA、信箱未驗證、伺服器計價、重試防重複、過期審核版本、即時停權與審核歷史。

瀏覽器確認申請表、課程複選、登入及忘記密碼頁，並確認未登入直接進入原料購買會返回統一入口。正式 Email 寄送、重設密碼回跳及真實管理員 MFA 尚未端到端測試。

## 等待核准的正式資料庫變更

**2026-10-28：使用者已明確核准下列正式變更，migration `student_approval_access` 已成功套用。** 初次曾被自動安全審查擋下，取得明確授權後由原生migration工具套用，沒有繞過拒絕。

完整變更：`supabase/student-access.sql`。

1. 新增私有學員申請與審核紀錄表、申請建立 trigger，以及受限制的 RPC；不刪除既有會員或訂單。
2. 撤銷前端對 `profiles` 的寫入權限，保留本人讀取。現有 CMS 管理員角色與帳號不變，`can_edit_cms()` 不變。
3. 將 `page_views`、`analytics_events` 的登入者讀取範圍收窄為既有 CMS 編輯者，避免新開放註冊者讀取後台統計。
4. `material_orders` 新增插入檢查：必須為已核准學員／完成 MFA 的管理員，且訂單屬於當前帳號；前端僅保留本人訂單讀取。

影響：尚未申請／未核准的舊會員會被阻擋下新訂單；不影響其既有訂單記錄。一般登入者不再可讀後台統計。管理員未完成 MFA 時不能審核或以管理員資格下單。

另執行 `supabase/backfill-student-applications.sql`，將啟用前由使用者測試留下、格式有效的1筆申請補入pending；不自動核准、不新增管理員、不更改原密碼或Email驗證結果。此補入操作可重複執行而不覆寫既有審核。

正式檢查確認：匿名不能執行status/review RPC；authenticated不能直接讀寫私有申請表、不能更新profiles、不能直接INSERT訂單；訂單核准trigger存在。以既有測試帳戶的資料庫角色模擬驗證pending/allowed=false及student_list拒絕通過，transaction已rollback，沒有改變實際審核結果。GitHub authorization CI通過。

新資料表的advisor `RLS Enabled No Policy` 為預期的拒絕所有直接存取設計，該私有schema沒有前端表權限，僅透過具身分檢查的RPC操作；沒有為消除INFO而開放資料。既有CMS definer及leaked-password protection兩項WARN仍需分別評估，不能宣稱全部安全項目已清除。正式前端仍在草稿PR，未合併發布；管理員MFA與真實登入/審核操作仍由使用者進行。

## 核准後部署順序

1. 套用上列資料庫 migration，重跑 Supabase security advisor，檢查新增私有表與函式權限。
2. 在 Supabase Auth 確認 Email provider、Email confirmations 已啟用；保持安全的 Email change 驗證，停用不需要的匿名登入。
3. 已於2026-10-28經使用者明確核准並在Supabase儲存：Site URL為 `https://hanascent.com/student-tools/`；Redirect URLs保留 `https://hanascent.com/student-tools/materials/`，新增 `https://hanascent.com/student-tools/` 與 `http://127.0.0.1:4176/student-tools/`，重載確認共3筆。沒有使用萬用來源。正式上線且本機測試結束後，應移除不再需要的本機回跳。舊信若嵌入localhost:3000不會自動更新，已驗證帳戶可直接以密碼登入。
4. Auth 端密碼最少設 12 個字元，檢查寄信 SMTP 設定及 Auth rate limits。啟用可用的 leaked-password protection；若受方案限制需明確紀錄。前端 minlength 不可替代服務端密碼規則。
5. 上線前配置 Supabase CAPTCHA（Turnstile 或 hCaptcha）並在 signup／password login／recovery 提交對應 `captchaToken`；此版本尚未包含 CAPTCHA site key 或 widget，因此先不要開放大規模公開註冊。不要把服務端 secret 放進 GitHub。
6. 使用管理員本人及指定測試學員完成寄信、驗證、核准、登入、下單、拒絕、停權、忘記密碼與登出驗證。未獲指定收件人前不代寄測試信。管理員自行設定驗證器，勿將 QR code／密碼／OTP 發到聊天或存到 GitHub。
7. 上述條件完成後，合併 GitHub PR 並確認 GitHub Pages 發布。前端與後端須一起啟用；不能先發布依賴未部署 RPC 的入口。

## 安全界線

### 台幣總額與刷卡成本（草稿試算）

學員商品頁、購物車、匯出及訂單不顯示韓元成本／費用拆算，只顯示確認的台幣應付總額；既有 KRW 訂單不可直接改標 NT$，未報價顯示「待 HANA 確認」。

`student-tools/materials/pricing.js` 是有單元測試的純試算函式，尚未連接正式報價或收款。參數為 0.0255 匯率、每公斤進位 NT$200、15% 稅費預留（不是法定稅率）、處理20、服務10%、另加固定100，以及採購刷卡3.5%。重量未知時不產生可付款金額。合寄應使用正式整批分攤結果；本函式目前用每筆獨立寄件保守試算。以加台灣配送前、已進位的台幣報價判斷：未滿3000元配送80元，滿3000元（含）免運；自取0元。不可藉加上80元後達到3000元而回算免運。

使用者已確認刷卡3.5%指「向韓國採購的刷卡費」。計算為 `韓元採購額 × 0.0255 × 3.5%`，僅列入採購成本；不在學員收款端除以0.965，也不再依學員付款方式加收3.5%。原0.0255保留為報價匯率與匯差緩衝，明確不包含另列的3.5%刷卡費。若未來改用已含刷卡費的帳單有效匯率，需將此費率設0，不能重複計入。

總額試算：`[(韓元 × 0.0255) + 採購刷卡費 + 國際運費 + 稅費預留 + 20] × 1.10 + 100`，先向上取十元，再依3000元門檻加台灣配送費。固定100元在服務費計算後加一次，未另命名用途。稅費預留仍以商品換算成本加國際運費為基礎，刷卡費不是法定關稅稅率，也不據此認定實際海關完稅價格。例：韓元10,000、含包裝300g，台灣運費前710元、宅配80元，預估總額為NT$790。

正式收款還需伺服器報價、價格快照、付款方式及配送方式、正式重量和金流串接；不得信任瀏覽器試算作為收款金額，也不會把原始KRW數字當成已含所有費用的TWD報價。本次未啟用收款或變更已確認訂單。

- 學員個資在 Supabase 的私有 schema；GitHub 僅含程式碼及無真實個資的測試資料。前端只有 publishable key，沒有 service-role／SMTP／資料庫密碼。
- 授權使用資料庫內的審核結果、現有受保護管理員角色及簽署 JWT 的 `aal`；不使用學員可修改的 metadata 作權限判斷。
- 密碼由 Supabase Auth 處理；前端不另存密碼，登入 token 使用 `sessionStorage`，不遷移舊版 localStorage token。共享電腦務必登出；帳號資料仍需防 XSS。
- 新登入與審核頁的 CSP 僅允許本地腳本及指定 Supabase API，使用固定版本、本地供應的 Supabase SDK，沒有第三方 analytics。
- GitHub Pages 與公開 GitHub repository **不能保密已提交的教材、靜態產品檔案或歷史版本**。入口隱藏僅是導覽控制。真正需保密的教材須另移到私有 Storage／伺服器授權下載；本次伺服器保護的範圍是學員個資、審核及購買資格、個人訂單。
- 已發現的既有 advisor：`public.can_edit_cms()` 為可供登入者執行的 SECURITY DEFINER（原 CMS 所需，未修改）；leaked-password protection 原設定未啟用，需在上線前處理。

## 文件依據

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/password-security
- https://supabase.com/docs/guides/auth/auth-mfa/totp
- https://supabase.com/docs/guides/database/postgres/row-level-security

## 註冊測試與登入信修正

2026-10-28的使用者測試帳戶已在Auth完成Email驗證。當時正式Site URL仍為localhost:3000，且原本僅允許materials路徑，本機預覽註冊提供的redirect不在允許清單，導致信箱驗證後無法回到預覽。以上URL設定已依明確授權修正。未代寄新驗證信、未操作使用者密碼。

修正回跳時曾確認正式 `student_access_status()` 與私有申請表尚未部署，後續取得核准才正式啟用。前端遇到明確的PGRST202（缺少審核RPC）時，會顯示「帳戶登入成功、審核服務尚未啟用」而非籠統網路錯誤，保持allowed=false且不清除已驗證帳戶。其他API錯誤仍照錯誤處理，不作授權放行。此行為另有4項單元測試。新增學員的metadata已由Auth保存，但不能當作已核准；未實作管理員通知信，不能將註冊驗證信稱為管理員審核通知。
