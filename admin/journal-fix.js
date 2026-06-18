(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const dateText = value => value ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium' }).format(new Date(value)) : '未設定';
  const emptyStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const publicDb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storage: emptyStorage }
  });

  const directionLabels = {
    'olfactory-culture': '嗅覺文化',
    'scent-creation': '氣味創作',
    'heart-village-notes': '心村札記'
  };
  const defaultDirection = 'olfactory-culture';
  let posts = [];
  let saving = false;

  function toast(message, error = false) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.className = `toast show${error ? ' error-toast' : ''}`;
    setTimeout(() => { el.className = 'toast'; }, 4200);
  }
  function friendlySaveError(error) {
    const message = error?.message || String(error || '');
    if (/row-level security|policy|permission|not authorized|unauthorized/i.test(message)) {
      return '文章儲存失敗：Supabase posts 的 update/insert 權限尚未開放給登入帳號。請到 Supabase 補 posts 的 authenticated update policy。';
    }
    return message || '文章儲存失敗。';
  }
  function getDirection(body = '') {
    const match = String(body || '').match(/<!--\s*reading-direction:\s*([a-z-]+)\s*-->/i);
    return match?.[1] && directionLabels[match[1]] ? match[1] : defaultDirection;
  }
  function stripDirection(body = '') {
    return String(body || '').replace(/<!--\s*reading-direction:\s*[a-z-]+\s*-->\s*/ig, '').trimStart();
  }
  function withDirection(body = '', direction = defaultDirection) {
    const safe = directionLabels[direction] ? direction : defaultDirection;
    return `<!-- reading-direction:${safe} -->\n${stripDirection(body)}`;
  }
  function slugify(value) {
    return String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || `post-${Date.now()}`;
  }

  async function selectPosts(client, status) {
    return client
      .from('posts')
      .select('id,title,slug,summary,cover_url,body,status,published_at,updated_at')
      .eq('status', status)
      .order(status === 'published' ? 'published_at' : 'updated_at', { ascending: false });
  }
  async function loadPosts() {
    let published = [];
    let drafts = [];
    let errorMessage = '';

    const adminPublished = await selectPosts(db, 'published');
    if (!adminPublished.error) published = adminPublished.data || [];
    else errorMessage = adminPublished.error.message || String(adminPublished.error);

    if (!published.length) {
      const publicPublished = await selectPosts(publicDb, 'published');
      if (!publicPublished.error) published = publicPublished.data || [];
      else errorMessage = publicPublished.error.message || errorMessage;
    }

    const adminDrafts = await selectPosts(db, 'draft');
    if (!adminDrafts.error) drafts = adminDrafts.data || [];

    const seen = new Set();
    posts = [...published, ...drafts].filter(post => {
      const key = post.id || post.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    renderPosts(errorMessage);
  }

  function renderPosts(errorMessage = '') {
    const list = $('#posts-list');
    if (!list) return;
    const q = ($('#post-search')?.value || '').trim().toLowerCase();
    const rows = posts.filter(post => !q || `${post.title || ''} ${post.summary || ''} ${post.slug || ''} ${directionLabels[getDirection(post.body)] || ''}`.toLowerCase().includes(q));

    if (!rows.length) {
      list.innerHTML = `<div class="empty">目前後台沒有撈到氣味誌文章。${errorMessage ? `<br><small>${escapeHtml(errorMessage)}</small>` : ''}</div>`;
      return;
    }

    list.innerHTML = rows.map(post => {
      const direction = directionLabels[getDirection(post.body)] || directionLabels[defaultDirection];
      const status = post.status === 'published' ? 'projects.html 顯示中' : '草稿';
      const frontUrl = `/blog.html?slug=${encodeURIComponent(post.slug || '')}`;
      return `<article class="list-item"><div><h3>${escapeHtml(post.title || '未命名文章')}</h3><div class="meta"><span class="badge ${escapeHtml(post.status || '')}">${status}</span><span class="badge">${escapeHtml(direction)}</span><span>撰寫日 ${dateText(post.published_at)}</span><span>/${escapeHtml(post.slug || '')}</span></div></div><div class="button-row"><a class="secondary" href="${frontUrl}" target="_blank" rel="noopener">查看</a><button class="secondary edit-post" data-journal-id="${escapeHtml(post.id || '')}">編輯</button></div></article>`;
    }).join('');
  }

  function openPost(post) {
    const dialog = $('#post-dialog');
    const form = $('#post-form');
    if (!dialog || !form || !post) return;
    form.reset();
    form.elements.id.value = post.id || '';
    form.elements.title.value = post.title || '';
    form.elements.slug.value = post.slug || '';
    form.elements.status.value = post.status || 'draft';
    if (form.elements.reading_direction) form.elements.reading_direction.value = getDirection(post.body);
    form.elements.summary.value = post.summary || '';
    form.elements.cover_url.value = post.cover_url || '';
    form.elements.body.value = stripDirection(post.body || '');
    $('#delete-post')?.classList.toggle('hidden', !post.id);
    dialog.showModal();
  }

  async function writePost(id, existing, payload) {
    if (id) {
      const byId = await db.from('posts').update(payload).eq('id', id);
      if (!byId.error) return byId;
      if (existing?.slug) {
        const bySlug = await db.from('posts').update(payload).eq('slug', existing.slug);
        if (!bySlug.error) return bySlug;
        return bySlug;
      }
      return byId;
    }
    return db.from('posts').insert(payload);
  }

  async function savePost(event) {
    const form = event.target;
    if (!form || form.id !== 'post-form') return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (saving) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton?.textContent || '儲存';
    saving = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '儲存中…';
    }

    try {
      const id = form.elements.id.value;
      const existing = posts.find(post => post.id === id);
      const title = form.elements.title.value.trim();
      const body = form.elements.body.value.trim();
      if (!title) throw new Error('請先填寫標題。');
      if (!body) throw new Error('請先填寫內文。');

      const status = form.elements.status.value || 'draft';
      const payload = {
        title,
        slug: slugify(form.elements.slug.value || title),
        status,
        summary: form.elements.summary.value || '',
        cover_url: form.elements.cover_url.value || '',
        body: withDirection(body, form.elements.reading_direction?.value || defaultDirection),
        published_at: status === 'published' ? (existing?.published_at || new Date().toISOString()) : null
      };

      const { error } = await writePost(id, existing, payload);
      if (error) throw error;

      if (id) {
        posts = posts.map(post => post.id === id ? { ...post, ...payload, id, updated_at: new Date().toISOString() } : post);
      } else {
        posts.unshift({ ...payload, id: `local-${Date.now()}`, updated_at: new Date().toISOString() });
      }
      renderPosts();
      $('#post-dialog')?.close();
      toast('氣味誌文章已儲存，專題分類已更新。');
      loadPosts().catch(error => console.warn('[journal reload]', error));
    } catch (error) {
      console.error(error);
      toast(friendlySaveError(error), true);
    } finally {
      saving = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-journal-id]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openPost(posts.find(post => post.id === button.dataset.journalId));
  }, true);

  $('#post-form')?.addEventListener('submit', savePost, true);
  $('#post-search')?.addEventListener('input', () => renderPosts());

  async function boot() {
    const { data } = await db.auth.getSession();
    if (!data?.session) return;
    $('#login')?.classList.add('hidden');
    $('#app')?.classList.remove('hidden');
    await loadPosts();
  }
  db.auth.onAuthStateChange((_event, session) => {
    if (session) loadPosts().catch(error => toast(error.message || '氣味誌載入失敗。', true));
  });
  boot().catch(error => toast(error.message || '氣味誌載入失敗。', true));
})();