# 學員通知設定狀態

> 新註冊學員的氣味通信訂閱規則已改為首次註冊同意並驗證信箱後自動加入，詳見 [student-dashboard-newsletter.md](student-dashboard-newsletter.md)。下方「學員申請不自動訂閱」屬啟用本功能之前的狀態。

收件管理員：hanasscent@gmail.com。

2026-10-29 檢查：氣味通信的 assets/member.js 只 INSERT email_subscribers，沒有呼叫寄信服務；正式 email_subscribers 沒有寄信 trigger。原先此 Supabase 專案沒有 Edge Functions、自訂 Secrets，Auth 自訂 SMTP 關閉。後續確認已有 Resend 帳號，auth.hanascent.com 已驗證且有先前成功寄送紀錄，可沿用該網域。

學員驗證信仍由既有 Supabase Auth 流程處理，待審核畫面維持「資格審查中」。訂閱名單與學員通知不混用；申請學員資格不自動訂閱行銷信。

supabase/student-notifications.sql 是獨立通知佇列，隨申請交易建立事件；管理者固定收新申請通知，通過通知僅使用申請信箱。每次申請版本只建立一次；伺服器才能領取與完成事件，匿名／學員無法讀取或呼叫。含租約、重試間隔與重試上限，過期資格通知在領取時取消。信件不包含手機、密碼或驗證憑證，管理者需登入後台查看完整資料。

已部署 student_notifications_outbox、student_notification_schedule 與 student-notifications Edge Function。每分鐘透過 pg_cron + pg_net 呼叫 worker，專用隨機 token 僅存在 Vault；worker 使用後端 service role RPC 比對 token，再領取事件。關閉 gateway JWT 檢查是因為採專用內部 token 驗證，不代表匿名可寄信。匿名與 authenticated 都無法執行 worker RPC 或讀取佇列，正式權限查詢已確認。

使用者已自行建立限 auth.hanascent.com、Sending access 的 HANA Student Notifications key，並存入 Supabase Secret RESEND_API_KEY。程式庫、前端、工具輸出不保存其值。寄件地址 students@auth.hanascent.com、回覆地址 hanasscent@gmail.com；兩種信均只含固定文字與正式站連結，不含學員手機、密碼或驗證憑證。

worker 使用事件 UUID 作為 Resend Idempotency-Key。首次領取超過 23 小時即停止重試，以保持在供應商 24 小時去重視窗內；最多五次、指數退避與十五分鐘租約。外部供應商交付仍不可宣稱 exactly-once，sent 表示供應商 API 接受，不等於收件匣收到。

使用者明確同意將目前兩筆 pending 補寄到管理員信箱後，已建立兩個 application_received 事件。正式 worker 回應 HTTP 200 / sent:2 / failed:0，兩筆皆一次成功。Resend UI 兩封均顯示 Delivered。不變更學員資格，也沒有寄信給學員。後續新申請／重新申請與核准透過交易 trigger 自動建立事件，不需前端觸發。

學員通過通知已用隔離 Postgres 及模擬寄信測試；尚未對真實學員執行核准寄信測試。使用者自行輸入 SMTP 金鑰並儲存後，重新載入確認 SMTP 已啟用、Host=smtp.resend.com、Port=465、寄件名稱為 HANA 氣味練習曲，畫面顯示已儲存的密碼隱藏。未讀取任何密碼值。正式 Site URL 與三個精確 redirect URLs 已確認保留原設定。

驗證：31 項 Node/PGlite 測試通過；正式 worker sent:2/failed:0，Resend 兩封 Delivered。Auth SMTP 與真實學員核准通知尚未進行端到端寄送測試；需使用者指定測試學員或於下一筆真實申請／核准時確認。訂閱氣味通信仍僅儲存名單，本次沒有啟用行銷群發。
