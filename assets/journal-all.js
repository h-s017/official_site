(() => {
  'use strict';
  const root = document.querySelector('[data-archive-list]');
  const count = document.querySelector('[data-archive-count]');
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!root || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {'olfactory-culture':'嗅覺文化','scent-creation':'氣味創作','heart-village-notes':'心村札記'};
  const getDirection = (body='') => {
    const m = String(body).match(/<!--\s*reading-direction:\s*([a-z-]+)\s*-->/i);
    return m && labels[m[1]] ? m[1] : 'olfactory-culture';
  };
  const formatDate = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric'}).format(d);
  };

  const snapshot = document.getElementById('archive-snapshot-data');
  if (snapshot) root.querySelectorAll('time[datetime]').forEach(time => { time.textContent = formatDate(time.dateTime); });
  const signature = posts => JSON.stringify(posts.map(p => [p.slug || '',p.title || '',p.summary || '',p.cover_url || '',p.published_at || '',getDirection(p.body)]));
  async function init(){
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const {data,error} = await client.from('posts')
      .select('title,slug,summary,cover_url,published_at,body,status')
      .eq('status','published')
      .order('published_at',{ascending:false});
    if (error) throw error;
    const posts = Array.isArray(data) ? data : [];
    if (snapshot && JSON.stringify(JSON.parse(snapshot.textContent)) === signature(posts)) return;
    if (count) count.textContent = posts.length ? `${posts.length} 篇` : '';
    if (!posts.length) {
      root.innerHTML = '<div class="archive-empty">目前尚無文章。</div>';
      return;
    }
    root.innerHTML = posts.map(post => {
      const url = `/blog.html?slug=${encodeURIComponent(post.slug || '')}`;
      const image = post.cover_url ? `<a href="${url}" aria-label="閱讀 ${esc(post.title || '')}"><img src="${esc(post.cover_url)}" alt="" width="150" height="150" decoding="async" loading="lazy"></a>` : '';
      const direction = labels[getDirection(post.body)];
      const date = formatDate(post.published_at);
      return `<article class="archive-item">${image}<div><div class="archive-meta">${esc(direction)}${date ? ` · <time datetime="${esc(post.published_at)}">${esc(date)}</time>` : ''}</div><h3><a href="${url}">${esc(post.title || '')}</a></h3>${post.summary ? `<p>${esc(post.summary)}</p>` : ''}<a class="archive-link" href="${url}">閱讀文章 →</a></div></article>`;
    }).join('');
  }

  init().catch(() => {
    if (!snapshot) root.innerHTML = '<div class="archive-empty">文章暫時無法載入，請稍後再試。</div>';
  });
})();