(() => {
      'use strict';
      const root = document.querySelector('[data-news-archive]');
      const cfg = window.HANA_CMS_CONFIG || {};
      const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
      const sourceLabels = {
        news: '最新消息',
        fragrance: '新氣味發表',
        course: '課程發布'
      };
      const formatDate = value => {
        if (!value) return 'NEWS';
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'2-digit', day:'2-digit' }).format(date);
      };
      const pinnedNewsTitles = new Set(['亞洲香氛藝術大賽教室預約']);
      const isPinnedNews = item => pinnedNewsTitles.has(String(item?.title || '').trim().replace(/\s*→\s*$/, ''));
      const snapshot = document.getElementById('news-snapshot-data');
      const signature = rows => JSON.stringify(rows.map(x => [x.title || '',x.content || '',x.link_url || '',x.starts_at || '',x.created_at || '',x.category || '']));
      const render = rows => {
        if (snapshot && JSON.stringify(JSON.parse(snapshot.textContent)) === signature(rows)) return;
        rows = [...rows].sort((a, b) => Number(isPinnedNews(b)) - Number(isPinnedNews(a)));
        if (!rows.length) {
          root.innerHTML = '<p class="news-state">目前尚無已發布的消息與公告。</p>';
          return;
        }
        root.innerHTML = rows.map(item => {
          const body = item.content ? `<p>${esc(item.content.replace(/H[.]FUGUE ATELIER 新氣味發布。/g, '新氣味發布。'))}</p>` : '';
          const link = item.link_url ? `<a class="text-link" href="${esc(item.link_url)}">查看內容 →</a>` : '';
          const source = sourceLabels[item.category] || item.category || '公告';
          return `<article class="news-archive-row"><div class="news-archive-date">${esc(formatDate(item.starts_at || item.created_at))}</div><div><span class="news-source">${esc(source)}</span><h2>${esc((item.title || '未命名消息').replace(/HELORI 香氣探索所/g, 'HELORI 香氣探索體驗'))}</h2>${body}</div>${link}</article>`;
        }).join('');
      };
      async function init() {
        if (!root || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
          if (root && !snapshot) root.innerHTML = '<p class="news-state">目前無法載入最新消息。</p>';
          return;
        }
        const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        const { data, error } = await db
          .from('announcements')
          .select('title,content,link_url,starts_at,created_at,category')
          .eq('status', 'published')
          .order('starts_at', { ascending:false, nullsFirst:false })
          .order('created_at', { ascending:false });
        if (error) throw error;
        render(data || []);
      }
      init().catch(error => {
        console.error('[news archive]', error);
        if (root && !snapshot) root.innerHTML = '<p class="news-state">最新消息暫時無法載入，請稍後再試。</p>';
      });
    })();
