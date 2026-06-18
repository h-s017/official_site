(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.supabaseUrl || '') && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('YOUR_');
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  if (!configured || !window.supabase) { $('#setup').classList.remove('hidden'); return; }

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const state = { media: [], posts: [], announcements: [], settings: null, mediaTarget: null };
  const titles = { dashboard: '總覽', media: '照片與媒體', posts: '部落格', announcements: '公告', layout: '版面設定' };
  let toastTimer;

  function toast(message, error = false) {
    const el = $('#toast'); el.textContent = message; el.className = `toast show${error ? ' error-toast' : ''}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
  }
  function fail(error) { console.error(error); toast(error.message || '操作失敗，請稍後再試。', true); }
  function escapeHtml(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
  function dateText(value) { return value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(new Date(value)) : '未設定'; }
  function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
  function slugify(value) { return value.trim().toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || `post-${Date.now()}`; }

  async function loadAll() {
    const [media, posts, announcements, settings] = await Promise.all([
      db.storage.from('site-media').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
      db.from('posts').select('*').order('updated_at', { ascending: false }),
      db.from('announcements').select('*').order('updated_at', { ascending: false }),
      db.from('site_settings').select('*').eq('id', 1).single()
    ]);
    for (const result of [media, posts, announcements, settings]) if (result.error) throw result.error;
    state.media = media.data.filter(x => x.name !== '.emptyFolderPlaceholder').map(file => ({ ...file, url: db.storage.from('site-media').getPublicUrl(file.name).data.publicUrl }));
    state.posts = posts.data; state.announcements = announcements.data; state.settings = settings.data;
    renderAll();
  }

  function renderAll() { renderDashboard(); renderMedia(); renderPosts(); renderAnnouncements(); renderLayout(); }
  function renderDashboard() {
    const today = new Date().toISOString().slice(0, 10);
    $('#stat-media').textContent = state.media.length;
    $('#stat-posts').textContent = state.posts.filter(x => x.status === 'published').length;
    $('#stat-announcements').textContent = state.announcements.filter(x => x.status === 'published' && (!x.starts_at || x.starts_at <= today) && (!x.ends_at || x.ends_at >= today)).length;
  }
  function mediaCard(item, picker = false) {
    return `<article class="media-card"><img src="${escapeHtml(item.url)}" alt="" loading="lazy"><div class="media-info"><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><div class="media-actions">${picker ? `<button class="primary pick-media" data-url="${escapeHtml(item.url)}">選取</button>` : `<button class="secondary copy-media" data-url="${escapeHtml(item.url)}">複製網址</button><button class="danger delete-media" data-name="${escapeHtml(item.name)}">刪除</button>`}</div></div></article>`;
  }
  function renderMedia() {
    $('#media-grid').innerHTML = state.media.length ? state.media.map(x => mediaCard(x)).join('') : '<div class="empty">尚未上傳照片</div>';
    $('#media-picker').innerHTML = state.media.length ? state.media.map(x => mediaCard(x, true)).join('') : '<div class="empty">請先到「照片與媒體」上傳照片</div>';
  }
  function renderPosts() {
    const q = $('#post-search').value.trim().toLowerCase();
    const items = state.posts.filter(x => !q || `${x.title} ${x.summary}`.toLowerCase().includes(q));
    $('#posts-list').innerHTML = items.length ? items.map(x => `<article class="list-item"><div><h3>${escapeHtml(x.title)}</h3><div class="meta"><span class="badge ${x.status}">${x.status === 'published' ? '已發布' : '草稿'}</span><span>更新 ${dateText(x.updated_at)}</span><span>/${escapeHtml(x.slug)}</span></div></div><button class="secondary edit-post" data-id="${x.id}">編輯</button></article>`).join('') : '<div class="empty">沒有符合的文章</div>';
  }
  function renderAnnouncements() {
    $('#announcements-list').innerHTML = state.announcements.length ? state.announcements.map(x => `<article class="list-item"><div><h3>${escapeHtml(x.title)}</h3><div class="meta"><span class="badge ${x.status}">${x.status === 'published' ? '已發布' : '草稿'}</span><span class="badge ${x.priority}">${x.priority === 'high' ? '重要' : x.priority === 'low' ? '次要' : '一般'}</span><span>${x.starts_at || '不限'} ～ ${x.ends_at || '不限'}</span></div></div><button class="secondary edit-announcement" data-id="${x.id}">編輯</button></article>`).join('') : '<div class="empty">尚未建立公告</div>';
  }
  function renderLayout() {
    if (!state.settings) return; const f = $('#layout-form');
    ['site_name','hero_title','hero_subtitle','hero_image_url','accent_color','content_width'].forEach(k => { f.elements[k].value = state.settings[k] ?? ''; });
    f.elements.show_announcements.checked = state.settings.show_announcements;
    f.elements.show_blog.checked = state.settings.show_blog;
    f.elements.section_order.value = (state.settings.section_order || ['announcements','blog']).join(',');
  }
  function showView(name) {
    $$('.view').forEach(x => x.classList.toggle('active', x.id === `view-${name}`));
    $$('#nav button').forEach(x => x.classList.toggle('active', x.dataset.view === name));
    $('#view-title').textContent = titles[name];
  }
  function openRecord(dialog, form, record = {}) {
    form.reset(); Object.entries(record).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
    const del = $('[id^="delete-"]', form); if (del) del.classList.toggle('hidden', !record.id); dialog.showModal();
  }

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('#login-error').textContent = '';
    const { error } = await db.auth.signInWithPassword({ email: $('#login-email').value, password: $('#login-password').value });
    if (error) $('#login-error').textContent = '登入失敗，請檢查帳號或密碼。';
  });
  $('#logout').addEventListener('click', () => db.auth.signOut());
  $('#nav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) showView(b.dataset.view); });
  $('#post-search').addEventListener('input', renderPosts);
  $('#new-post').addEventListener('click', () => openRecord($('#post-dialog'), $('#post-form')));
  $('#new-announcement').addEventListener('click', () => openRecord($('#announcement-dialog'), $('#announcement-form')));
  $$('dialog .close').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

  document.addEventListener('click', async e => {
    const post = e.target.closest('.edit-post'); if (post) openRecord($('#post-dialog'), $('#post-form'), state.posts.find(x => x.id === post.dataset.id));
    const ann = e.target.closest('.edit-announcement'); if (ann) openRecord($('#announcement-dialog'), $('#announcement-form'), state.announcements.find(x => x.id === ann.dataset.id));
    const choose = e.target.closest('.choose-media'); if (choose) { state.mediaTarget = { form: choose.closest('form'), name: choose.dataset.target }; renderMedia(); $('#media-dialog').showModal(); }
    const pick = e.target.closest('.pick-media'); if (pick) { state.mediaTarget.form.elements[state.mediaTarget.name].value = pick.dataset.url; $('#media-dialog').close(); }
    const copy = e.target.closest('.copy-media'); if (copy) { await navigator.clipboard.writeText(copy.dataset.url); toast('照片網址已複製'); }
    const del = e.target.closest('.delete-media'); if (del && confirm(`確定刪除「${del.dataset.name}」？已使用此網址的頁面將無法顯示圖片。`)) {
      const { error } = await db.storage.from('site-media').remove([del.dataset.name]); if (error) return fail(error); toast('照片已刪除'); await loadAll();
    }
  });

  $('#media-input').addEventListener('change', async e => {
    const files = [...e.target.files]; if (!files.length) return;
    const progress = $('#media-progress'); progress.classList.remove('hidden');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]; if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} 超過 8 MB。`);
        progress.textContent = `正在上傳 ${i + 1} / ${files.length}：${file.name}`;
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase(); const safe = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 55) || 'image';
        const path = `${Date.now()}-${safe}.${ext}`; const { error } = await db.storage.from('site-media').upload(path, file, { contentType: file.type, upsert: false }); if (error) throw error;
      }
      toast('照片上傳完成'); await loadAll();
    } catch (error) { fail(error); } finally { progress.classList.add('hidden'); e.target.value = ''; }
  });

  $('#post-form').addEventListener('submit', async e => {
    e.preventDefault(); const data = formData(e.target); const id = data.id; delete data.id; data.slug = slugify(data.slug || data.title); data.published_at = data.status === 'published' ? (state.posts.find(x => x.id === id)?.published_at || new Date().toISOString()) : null;
    const query = id ? db.from('posts').update(data).eq('id', id) : db.from('posts').insert(data); const { error } = await query; if (error) return fail(error);
    $('#post-dialog').close(); toast('文章已儲存'); await loadAll();
  });
  $('#announcement-form').addEventListener('submit', async e => {
    e.preventDefault(); const data = formData(e.target); const id = data.id; delete data.id; ['starts_at','ends_at'].forEach(k => { if (!data[k]) data[k] = null; });
    if (data.starts_at && data.ends_at && data.ends_at < data.starts_at) return fail(new Error('結束日期不可早於開始日期。'));
    const query = id ? db.from('announcements').update(data).eq('id', id) : db.from('announcements').insert(data); const { error } = await query; if (error) return fail(error);
    $('#announcement-dialog').close(); toast('公告已儲存'); await loadAll();
  });
  $('#delete-post').addEventListener('click', async () => {
    const id = $('#post-form').elements.id.value; if (!id || !confirm('確定刪除這篇文章？')) return;
    const { error } = await db.from('posts').delete().eq('id', id); if (error) return fail(error); $('#post-dialog').close(); toast('文章已刪除'); await loadAll();
  });
  $('#delete-announcement').addEventListener('click', async () => {
    const id = $('#announcement-form').elements.id.value; if (!id || !confirm('確定刪除這則公告？')) return;
    const { error } = await db.from('announcements').delete().eq('id', id); if (error) return fail(error); $('#announcement-dialog').close(); toast('公告已刪除'); await loadAll();
  });
  $('#layout-form').addEventListener('submit', async e => {
    e.preventDefault(); const data = formData(e.target); data.id = 1; data.content_width = Number(data.content_width); data.show_announcements = e.target.elements.show_announcements.checked; data.show_blog = e.target.elements.show_blog.checked; data.section_order = data.section_order.split(',');
    const { error } = await db.from('site_settings').update(data).eq('id', 1); if (error) return fail(error); toast('版面設定已儲存'); await loadAll();
  });

  db.auth.onAuthStateChange(async (_event, session) => {
    $('#login').classList.toggle('hidden', !!session); $('#app').classList.toggle('hidden', !session);
    if (!session) return;
    $('#account-email').textContent = session.user.email; $('#view-site').href = cfg.siteUrl || 'https://hanascent.com';
    try { await loadAll(); } catch (error) { fail(error); }
  });
})();
