# HANA｜Supabase ↔ Resend Contacts 同步（2026-11-01）

## 狀態與核准界線
- 正式資料來源：官網 CMS Supabase 專案 `uzqaodfmnrjrsbvxhlmh`，`public.email_subscribers`。
- 已部署 migration `supabase/newsletter-resend-sync.sql`；資料庫有私有同步佇列、每 30 分鐘檢查排程、匿名不可執行同步 RPC。
- Edge Functions `newsletter-resend-sync`、`newsletter-resend-webhook` 已部署。
- 尚未取得 Resend 行銷聯絡人權限金鑰、氣味通信 Segment ID、Webhook 簽署密鑰；因此**尚未完成實際同步，也未驗證退訂端到端流程**。缺少設定時同步服務回覆 `sync:paused`，不擅自複製顧客資料。
- 此同步**不建立、不寄出、不排程任何 Broadcast／行銷郵件**；只管理 Resend Contacts 裡的特定 Segment。
- 既有學員通知 `RESEND_API_KEY` 限制為 Sending access，**不要修改或覆寫**，這裡使用另一把行銷用金鑰。

## 需在 Resend 後台完成
1. 在 Resend → Audience/Contacts → Segments 建立或確認獨立群組 `HANA 氣味通信`。取得 ID（UUID），不要使用其他行銷活動 Segment。
2. 在 Resend → API Keys 建立可管理 Contacts/Segments 的專用 API Key（僅 Sending access 不足以操作聯絡人）。
3. 在 Resend → Webhooks 建立端點 `https://uzqaodfmnrjrsbvxhlmh.supabase.co/functions/v1/newsletter-resend-webhook`，勾選 `contact.updated`。將簽署密鑰保存到 Supabase（不可貼到 ChatGPT、GitHub 或網站）。
4. 到 Supabase Edge Function Secrets：`https://supabase.com/dashboard/project/uzqaodfmnrjrsbvxhlmh/settings/functions` 儲存：
   - `RESEND_MARKETING_API_KEY` = 行銷聯絡人管理 API key
   - `RESEND_NEWSLETTER_SEGMENT_ID` = 「HANA 氣味通信」群組 UUID
   - `RESEND_NEWSLETTER_WEBHOOK_SECRET` = webhook signing secret（`whsec_` 開頭）
5. 三項填妥後，排程每 30 分鐘自動查詢待處理紀錄；首批必須在 Resend 確認實際聯絡人及退訂行為，不要視 SQL pending 狀態為同步成功。

## 資料流
- 官網、課前問卷、學員驗證後的訂閱，只進入既有 `email_subscribers` 表；觸發器將新增資料列入待同步佇列。
- Worker 先查詢 Resend 全域聯絡人。既有聯絡人如 `unsubscribed=true`，**不恢復**；本地標記退訂，避免重複匯入。
- 新聯絡人才建立 Contact；已存在但未退訂的聯絡人只加入指定 Segment，不覆蓋其他 Segment 或其他聯絡人內容。
- 官網取消訂閱或移除 Email，Worker 會從指定 Segment 移除，不刪除 Resend 全域 Contact，以免影響其他業務。
- Resend 端標記 `contact.updated` / `unsubscribed:true`，簽署驗證通過後刪除本地訂閱紀錄、標記學員偏好已退訂並保留私有防重複同步記錄。Webhook 事件 ID 具有重放去重設計。
- 帳號建立、資格審核、核准與通知郵件均獨立運作，不因此取得工具存取權限。

## 驗證與排錯
- 在 Supabase SQL Editor（管理員）執行：
  `select state, desired, count(*) from shop_private.newsletter_resend_queue group by state,desired;`
  `select jobname,schedule,active from cron.job where jobname='hana-newsletter-resend-sync';`
- 同步 worker 回覆 paused 常見原因是新金鑰或 Segment ID 未設定。
- 發生憑證權限不足或錯誤時，佇列保留並重試，不把錯誤當作已訂閱。
- 正式使用前，以指定測試信箱進行：新增同意 → 同步 Contacts → Resend 退訂 → 本地退訂記錄更新 → 排程不會重新訂閱。
- 注意目前 HANA FOCUS 的「氣味通信訂閱管理」頁面屬於尚未核准發布的預覽程式；名單同步本身在官網 Supabase 端執行，不依賴 HANA FOCUS 網頁發佈。
