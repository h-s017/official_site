# HANA 學員多元登入設定（Email、Google、Apple）

目標：提供 OAuth 登入，但保留現有 Email／密碼、HANA 人工學員資格審核、管理員 TOTP MFA，以及既有學員申請／訂單資料。新的社群登入 **不自動核准**，也不透過相同姓名／相似 Email 自動移轉資格。

## 上線現況

- 網頁已實作「Google 繼續」與「Apple 繼續」，但預設隱藏，因為尚未有完成設定的 OAuth credentials。
- 公開設定檔 `assets/cms-config.js` 的 `studentOAuth.google` 和 `studentOAuth.apple` 預設 `false`。**只有完成外部 OAuth 設定、實測成功後，才將對應旗標設為 `true` 並更新網站。**
- 入口使用 Supabase JS `auth.signInWithOAuth({provider,options:{redirectTo:redirect}})`，沿用 `/student-tools/`；OAuth 返回後使用原有 `student_access_status` 判斷 `pending`、`approved`、`not_applied`。
- 初次使用 Google／Apple 的學員在登入後需填上課姓名、手機與課程，送交 HANA 審核，**沒有核准就不能進入學員購物服務**。
- 若既有帳戶使用不同 Email，OAuth 會成為另一帳戶；**不得**藉由同名、Email 字串或未驗證身分自動承接原帳戶的核准資格、訂單或審核歷史。

## 1｜Google Cloud 設定

1. 登入 https://console.cloud.google.com/auth/overview ，建立或選擇 Google Cloud 專案，設定 OAuth consent screen／Audience。
2. 建立 OAuth Client：**Web application**。
3. 在 **Authorized JavaScript origins** 新增：
   - `https://hanascent.com`
4. 在 **Authorized redirect URIs** 新增：
   - `https://uzqaodfmnrjrsbvxhlmh.supabase.co/auth/v1/callback`
5. 複製 Google OAuth **Client ID** 和 **Client Secret**。Client Secret 僅輸入 Supabase Dashboard，**不要**貼進 GitHub 或公開網站。

## 2｜Supabase 設定

1. 前往 https://supabase.com/dashboard/project/uzqaodfmnrjrsbvxhlmh/auth/providers
2. 開啟 **Google** → Enable Sign in with Google → 填入 Client IDs、Client Secret → Save。不能留空；錯誤訊息「At least one Client ID is required」代表 Google OAuth Client 尚未建好。
3. 前往 https://supabase.com/dashboard/project/uzqaodfmnrjrsbvxhlmh/auth/url-configuration ，確認允許 `https://hanascent.com/student-tools/` 返回。
4. 先以**測試帳號**驗證：Google 跳轉／返回、學員待審核、管理員 MFA 核准、核准後學員工具與原料訂購，拒絕／停權後不能存取。
5. 經測試後，才將 `assets/cms-config.js` 的 `studentOAuth.google` 改為 `true` 並部署網站。

## 3｜Apple（未設定）

Apple 另需 Apple Developer 的 Services ID、授權金鑰等憑證，且須在 Supabase Apple provider 設定完成，實測後才開 `studentOAuth.apple=true`。**不要在未配置 Apple provider 時顯示此按鈕。**

## 4｜LINE（後續評估）

LINE 並非 Supabase 內建列出的 provider，需另外建立 LINE Login channel，評估自訂 OAuth/OIDC provider 與 Email 聯絡資料完整性。LINE 帳戶可能沒有可用或經確認的 Email，因此不應以 LINE 暱稱／頭像／Email 相似就合併學員身份。

## 5｜既有學員與安全

- 原 Email＋密碼入口必須保留；不能要求所有既有學員重新註冊。
- 同一 Email 使用 Google OAuth 時，Supabase 可能自動連結相同 Email 的身份；不應假定每個舊帳戶都能成功自動連結。上線前以一筆測試帳戶確認。
- 不開放未經管理員批准的學員購買、查閱私人資料，且原管理員審核仍要求 `aal2` MFA。
- 前端 feature flag 無法代替 Supabase Auth provider 的後端設定。沒有 OAuth Client ID／Secret 時，按鈕不得顯示。
- OAuth Client Secret、Apple 私密金鑰不可存放在 GitHub；公開網站只能有 Supabase publishable key 與不敏感的功能旗標。

依據：Supabase 官方 [Google social sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)、[Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)、[Identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking)、[Custom OAuth providers](https://supabase.com/docs/guides/auth/custom-oauth-providers)。
