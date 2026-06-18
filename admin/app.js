(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.supabaseUrl || '') && cfg.supabaseAnonKey && !cfg.supabaseAnonKey.includes('YOUR_');
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  if (!configured || !window.supabase) { $('#setup').classList.remove('hidden'); return; }

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const state = { media: [], posts: [], announcements: [], pageContents: [], booking: null, settings: null, mediaTarget: null };
  const titles = { dashboard: '總覽', media: '照片與媒體', posts: '氣味誌', announcements: '公告', content: '頁面內容', booking: '預約設定', layout: '版面設定' };
  const pageNames = { home: '首頁', helori: 'HELORI 香氣探索所', courses: '專業調香課程', scent_design: '嗅覺設計服務', atelier: 'H.FUGUE ATELIER', visit: '聯繫我們', journal: '氣味誌' };
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
  function insertAtCursor(textarea, text) {
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
    const position = start + text.length;
    textarea.focus();
    textarea.setSelectionRange(position, position);
  }
  function imageHtml(url) {
    return `\n<figure><img src="${escapeHtml(url)}" alt=""><figcaption></figcaption></figure>\n`;
  }
  function requirePostField(form, name, label) {
    const field = form.elements[name];
    if (!field || String(field.value || '').trim()) return true;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => field.focus(), 250);
    fail(new Error(`請先填寫${label}。`));
    return false;
  }
  function fileExtension(name, fallback = 'jpg') {
    return (name.split('.').pop() || fallback).toLowerCase().replace(/[^a-z0-9]/g, '') || fallback;
  }
  function safeBaseName(name) {
    return name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 55) || 'image';
  }
  function timeout(promise, ms, label) {
    let timer;
    const guard = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label}逾時，請先重新整理後再試。若仍失敗，通常是圖片太大、網路不穩，或 Supabase Storage 權限設定未開放上傳。`)), ms);
    });
    return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
  }
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} 圖片讀取失敗。`)); };
      img.src = url;
    });
  }
  async function prepareImageFile(file, progress) {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
    const shouldCompress = file.size > 1.8 * 1024 * 1024 || file.type === 'image/png';
    if (!shouldCompress) return file;
    if (progress) progress.textContent = `正在處理圖片：${file.name}`;
    try {
      const img = await loadImage(file);
      const maxEdge = 2200;
      const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.86));
      if (!blob) return file;
      const compressed = new File([blob], `${safeBaseName(file.name)}.webp`, { type: 'image/webp', lastModified: Date.now() });
      return compressed.size < file.size ? compressed : file;
    } catch (error) {
      console.warn(error);
      return file;
    }
  }
  async function uploadImageFile(source, progress, context = '照片', index = 1, total = 1) {
    if (!source) throw new Error('請先選擇圖片。');
    if (!source.type.startsWith('image/')) throw new Error(`${source.name} 不是支援的圖片格式。`);
    if (source.size > 12 * 1024 * 1024) throw new Error(`${source.name} 超過 12 MB，請先縮小圖片後再上傳。`);
    if (progress) progress.textContent = `正在準備 ${index} / ${total}：${source.name}`;
    const file = await prepareImageFile(source, progress);
    if (file.size > 8 * 1024 * 1024) throw new Error(`${source.name} 處理後仍超過 8 MB，請先壓縮後再上傳。`);
    if (progress) progress.textContent = `正在上傳 ${index} / ${total}：${file.name}`;
    const ext = fileExtension(file.name);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBaseName(file.name)}.${ext}`;
    const upload = db.storage.from('site-media').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    const { error } = await timeout(upload, 60000, `${context} ${file.name} 上傳`);
    if (error) throw error;
    return db.storage.from('site-media').getPublicUrl(path).data.publicUrl;
  }
  function extractSlug(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, location.origin);
      const slug = url.searchParams.get('slug');
      if (slug) return slug.trim();
    } catch (_) {}
    return raw.replace(/^https?:\/\/[^/]+\/blog\.html\?slug=/i, '').replace(/^.*slug=/i, '').replace(/^\/+|\/+$/g, '').trim();
  }

  async function loadAll() {
    const [media, posts, announcements, pageContents, booking, settings] = await Promise.all([
      db.storage.from('site-media').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }),
      db.from('posts').select('*').order('updated_at', { ascending: false }),
      db.from('announcements').select('*').order('updated_at', { ascending: false }),
      db.from('page_contents').select('*').order('page_key').order('sort_order'),
      db.from('booking_settings').select('*').eq('id', 1).single(),
      db.from('site_settings').select('*').eq('id', 1).single()
    ]);
    for (const result of [media, posts, announcements, pageContents, booking, settings]) if (result.error) throw result.error;
    state.media = media.data.filter(x => x.name !== '.emptyFolderPlaceholder').map(file => ({ ...file, url: db.storage.from('site-media').getPublicUrl(file.name).data.publicUrl }));
    state.posts = posts.data; state.announcements = announcements.data; state.pageContents = pageContents.data; state.booking = booking.data; state.settings = settings.data;
    renderAll();
  }

  function renderAll() { renderDashboard(); renderMedia(); renderPosts(); renderAnnouncements(); renderPageContents(); renderBooking(); renderLayout(); }
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
    const items = state.posts.filter(x => !q || `${x.title} ${x.summary} ${x.slug}`.toLowerCase().includes(q));
    $('#posts-list').innerHTML = items.length ? items.map(x => `<article class="list-item"><div><h3>${escapeHtml(x.title)}</h3><div class="meta"><span class="badge ${x.status}">${x.status === 'published' ? '已發布' : '草稿'}</span><span>更新 ${dateText(x.updated_at)}</span><span>/${escapeHtml(x.slug)}</span></div></div><button class="secondary edit-post" data-id="${x.id}">編輯</button></article>`).join('') : '<div class="empty">沒有符合的氣味誌文章</div>';
  }
  function renderAnnouncements() {
    $('#announcements-list').innerHTML = state.announcements.length ? state.announcements.map(x => `<article class="list-item"><div><h3>${escapeHtml(x.title)}</h3><div class="meta"><span class="badge ${x.status}">${x.status === 'published' ? '已發布' : '草稿'}</span><span class="badge ${x.priority}">${x.priority === 'high' ? '重要' : x.priority === 'low' ? '次要' : '一般'}</span><span>${x.starts_at || '不限'} ～ ${x.ends_at || '不限'}</span></div></div><button class="secondary edit-announcement" data-id="${x.id}">編輯</button></article>`).join('') : '<div class="empty">尚未建立公告</div>';
  }
  function renderPageContents() {
    const groups = Object.entries(pageNames).map(([key, name]) => {
      const fields = state.pageContents.filter(x => x.page_key === key);
      if (!fields.length) return '';
      return `<section class="content-group"><h2>${escapeHtml(name)}</h2><div class="content-fields">${fields.map(field => {
        const wide = field.content_type === 'multiline' || field.content_type === 'image' ? 'wide' : '';
        const control = field.content_type === 'multiline'
          ? `<textarea rows="4" data-content-id="${field.id}">${escapeHtml(field.value)}</textarea>`
          : field.content_type === 'image'
            ? `<div class="input-action"><input type="url" data-content-id="${field.id}" value="${escapeHtml(field.value)}"><button type="button" class="secondary choose-content-media" data-content-id="${field.id}">從媒體庫選取</button></div>`
            : `<input type="${field.content_type === 'url' ? 'url' : 'text'}" data-content-id="${field.id}" value="${escapeHtml(field.value)}">`;
        return `<label class="${wide}">${escapeHtml(field.label)}${control}</label>`;
      }).join('')}</div></section>`;
    }).join('');
    $('#page-content-forms').innerHTML = groups || '<div class="empty">尚未建立可編輯欄位</div>';
  }
  function toLocalInput(value) {
    if (!value) return '';
    const date = new Date(value); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  function formatSpecialTimes(value = {}) {
    return Object.entries(value).map(([day, times]) => `${day} | ${times.join(', ')}`).join('\n');
  }
  function parseSpecialTimes(value) {
    const output = {};
    value.split(/\r?\n/).map(x => x.trim()).filter(Boolean).forEach(line => {
      const [day, text] = line.split('|').map(x => x.trim());
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !text) throw new Error(`特殊時段格式錯誤：${line}`);
      output[day] = text.split(',').map(x => x.trim()).filter(Boolean);
    });
    return output;
  }
  function renderBooking() {
    if (!state.booking) return; const f = $('#booking-form');
    f.elements.booking_start_at.value = toLocalInput(state.booking.booking_start_at);
    f.elements.booking_end_date.value = state.booking.booking_end_date || '';
    $$('input[name="weekday"]', f).forEach(x => { x.checked = (state.booking.open_weekdays || []).includes(Number(x.value)); });
    f.elements.closed_dates.value = (state.booking.closed_dates || []).join('\n');
    f.elements.special_date_times.value = formatSpecialTimes(state.booking.special_date_times || {});
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
    form.reset();
    const progress = $('#post-upload-progress'); if (progress) progress.classList.add('hidden');
    Object.entries(record).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
    const del = $('[id^="delete-"]', form); if (del) del.classList.toggle('hidden', !record.id); dialog.showModal();
  }
  async function loadPostBySlug() {
    const slug = extractSlug($('#post-slug-loader').value);
    if (!slug) return fail(new Error('請輸入文章網址代稱或 blog 連結。'));
    const local = state.posts.find(x => x.slug === slug);
    if (local) { openRecord($('#post-dialog'), $('#post-form'), local); return; }
    const { data, error } = await db.from('posts').select('*').eq('slug', slug).limit(1);
    if (error) return fail(error);
    if (!data || !data.length) return fail(new Error(`找不到網址代稱為「${slug}」的文章。若這篇文章目前只存在於靜態檔，需先匯入 Supabase posts 資料表。`));
    state.posts = [data[0], ...state.posts.filter(x => x.id !== data[0].id)];
    renderPosts();
    openRecord($('#post-dialog'), $('#post-form'), data[0]);
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
  $('#load-post-by-slug').addEventListener('click', () => loadPostBySlug().catch(fail));
  $('#post-slug-loader').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); loadPostBySlug().catch(fail); } });
  $('#new-announcement').addEventListener('click', () => openRecord($('#announcement-dialog'), $('#announcement-form')));
  $('#save-page-content').addEventListener('click', async () => {
    const inputs = $$('[data-content-id]', $('#page-content-forms')).filter(x => x.matches('input,textarea'));
    try {
      await Promise.all(inputs.map(async input => {
        const { error } = await db.from('page_contents').update({ value: input.value }).eq('id', input.dataset.contentId);
        if (error) throw error;
      }));
      toast('頁面內容已儲存'); await loadAll();
    } catch (error) { fail(error); }
  });
  $$('dialog .close').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  $('#post-form').addEventListener('invalid', e => {
    e.preventDefault();
    const label = e.target.name === 'title' ? '標題' : e.target.name === 'body' ? '內文' : '必填欄位';
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => e.target.focus(), 250);
    fail(new Error(`請先填寫${label}。`));
  }, true);

  document.addEventListener('click', async e => {
    const post = e.target.closest('.edit-post'); if (post) openRecord($('#post-dialog'), $('#post-form'), state.posts.find(x => x.id === post.dataset.id));
    const ann = e.target.closest('.edit-announcement'); if (ann) openRecord($('#announcement-dialog'), $('#announcement-form'), state.announcements.find(x => x.id === ann.dataset.id));
    const insert = e.target.closest('.insert-html'); if (insert) { const form = insert.closest('form'); insertAtCursor(form.elements[insert.dataset.target], `\n${insert.dataset.html}\n`); }
    const choose = e.target.closest('.choose-media'); if (choose) { state.mediaTarget = { form: choose.closest('form'), name: choose.dataset.target, mode: choose.dataset.mode || 'replace' }; renderMedia(); $('#media-dialog').showModal(); }
    const chooseContent = e.target.closest('.choose-content-media'); if (chooseContent) { state.mediaTarget = { input: $(`[data-content-id="${chooseContent.dataset.contentId}"]`, $('#page-content-forms')), mode: 'replace' }; renderMedia(); $('#media-dialog').showModal(); }
    const pick = e.target.closest('.pick-media'); if (pick) {
      if (state.mediaTarget.mode === 'insert-image') { insertAtCursor(state.mediaTarget.form.elements[state.mediaTarget.name], imageHtml(pick.dataset.url)); toast('圖片已插入內文'); }
      else if (state.mediaTarget.input) state.mediaTarget.input.value = pick.dataset.url;
      else state.mediaTarget.form.elements[state.mediaTarget.name].value = pick.dataset.url;
      $('#media-dialog').close();
    }
    const copy = e.target.closest('.copy-media'); if (copy) { await navigator.clipboard.writeText(copy.dataset.url); toast('照片網址已複製'); }
    const del = e.target.closest('.delete-media'); if (del && confirm(`確定刪除「${del.dataset.name}」？已使用此網址的頁面將無法顯示圖片。`)) {
      const { error } = await db.storage.from('site-media').remove([del.dataset.name]); if (error) return fail(error); toast('照片已刪除'); await loadAll();
    }
  });

  $('#media-input').addEventListener('change', async e => {
    const files = [...e.target.files]; if (!files.length) return;
    const progress = $('#media-progress'); progress.classList.remove('hidden');
    try {
      for (let i = 0; i < files.length; i++) await uploadImageFile(files[i], progress, '照片', i + 1, files.length);
      progress.textContent = '照片上傳完成，正在更新媒體庫…';
      toast('照片上傳完成'); await loadAll();
    } catch (error) { fail(error); } finally { progress.classList.add('hidden'); e.target.value = ''; }
  });

  $('#post-cover-upload').addEventListener('change', async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const progress = $('#post-upload-progress'); progress.classList.remove('hidden');
    try {
      const url = await uploadImageFile(file, progress, '封面圖片', 1, 1);
      $('#post-form').elements.cover_url.value = url;
      progress.textContent = '封面圖片已上傳並填入網址。';
      toast('封面圖片已置換'); await loadAll();
    } catch (error) { fail(error); } finally { e.target.value = ''; }
  });

  $('#post-body-image-upload').addEventListener('change', async e => {
    const files = [...e.target.files]; if (!files.length) return;
    const progress = $('#post-upload-progress'); progress.classList.remove('hidden');
    try {
      const body = $('#post-form').elements.body;
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageFile(files[i], progress, '內文圖片', i + 1, files.length);
        insertAtCursor(body, imageHtml(url));
      }
      progress.textContent = '內文圖片已上傳並插入。';
      toast('內文圖片已插入'); await loadAll();
    } catch (error) { fail(error); } finally { e.target.value = ''; }
  });

  $('#post-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!requirePostField(e.target, 'title', '標題') || !requirePostField(e.target, 'body', '內文')) return;
    const data = formData(e.target); const id = data.id; delete data.id; data.slug = slugify(data.slug || data.title); data.published_at = data.status === 'published' ? (state.posts.find(x => x.id === id)?.published_at || new Date().toISOString()) : null;
    const query = id ? db.from('posts').update(data).eq('id', id) : db.from('posts').insert(data); const { error } = await query; if (error) return fail(error);
    $('#post-dialog').close(); toast('氣味誌文章已儲存'); await loadAll();
  });
  $('#announcement-form').addEventListener('submit', async e => {
    e.preventDefault(); const data = formData(e.target); const id = data.id; delete data.id; ['starts_at','ends_at'].forEach(k => { if (!data[k]) data[k] = null; });
    if (data.starts_at && data.ends_at && data.ends_at < data.starts_at) return fail(new Error('結束日期不可早於開始日期。'));
    const query = id ? db.from('announcements').update(data).eq('id', id) : db.from('announcements').insert(data); const { error } = await query; if (error) return fail(error);
    $('#announcement-dialog').close(); toast('公告已儲存'); await loadAll();
  });
  $('#delete-post').addEventListener('click', async () => {
    const id = $('#post-form').elements.id.value; if (!id || !confirm('確定刪除這篇氣味誌文章？')) return;
    const { error } = await db.from('posts').delete().eq('id', id); if (error) return fail(error); $('#post-dialog').close(); toast('氣味誌文章已刪除'); await loadAll();
  });
  $('#delete-announcement').addEventListener('click', async () => {
    const id = $('#announcement-form').elements.id.value; if (!id || !confirm('確定刪除這則公告？')) return;
    const { error } = await db.from('announcements').delete().eq('id', id); if (error) return fail(error); $('#announcement-dialog').close(); toast('公告已刪除'); await loadAll();
  });
  $('#layout-form').addEventListener('submit', async e => {
    e.preventDefault(); const data = formData(e.target); data.id = 1; data.content_width = Number(data.content_width); data.show_announcements = e.target.elements.show_announcements.checked; data.show_blog = e.target.elements.show_blog.checked; data.section_order = data.section_order.split(',');
    const { error } = await db.from('site_settings').update(data).eq('id', 1); if (error) return fail(error); toast('版面設定已儲存'); await loadAll();
  });
  $('#booking-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const data = formData(e.target);
      const open = $$('input[name="weekday"]:checked', e.target).map(x => Number(x.value));
      if (!open.length) throw new Error('請至少選擇一個開放星期。');
      const closedDates = data.closed_dates.split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
      if (closedDates.some(x => !/^\d{4}-\d{2}-\d{2}$/.test(x))) throw new Error('休館日期請使用 YYYY-MM-DD 格式。');
      const payload = {
        booking_start_at: new Date(data.booking_start_at).toISOString(),
        booking_end_date: data.booking_end_date,
        open_weekdays: open,
        closed_weekdays: [0,1,2,3,4,5,6].filter(x => !open.includes(x)),
        closed_dates: closedDates,
        special_date_times: parseSpecialTimes(data.special_date_times)
      };
      const { error } = await db.from('booking_settings').update(payload).eq('id', 1); if (error) throw error;
      toast('預約設定已儲存'); await loadAll();
    } catch (error) { fail(error); }
  });

  db.auth.onAuthStateChange(async (_event, session) => {
    $('#login').classList.toggle('hidden', !!session); $('#app').classList.toggle('hidden', !session);
    if (!session) return;
    $('#account-email').textContent = session.user.email; $('#view-site').href = cfg.siteUrl || 'https://hanascent.com';
    try { await loadAll(); } catch (error) { fail(error); }
  });
})();
