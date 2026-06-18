// 部署前填入 Supabase Project Settings → API 的 Project URL 與 anon public key。
// anon key 可公開；後台權限由 Supabase Auth + RLS 控制。絕對不要放 service_role key。
window.HANA_CMS_CONFIG = {
  supabaseUrl: 'https://uzqaodfmnrjrsbvxhlmh.supabase.co',
  supabaseAnonKey: 'sb_publishable_3ukkjs-QtgauXjmOrcDAVg_XBWzh2rd',
  siteUrl: 'https://hanascent.com'
};
