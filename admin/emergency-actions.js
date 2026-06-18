(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {};
  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const $ = (selector, root = document) => root.querySelector(selector);
  const directionLabels = {
    'olfactory-culture': '嗅覺文化',
    'scent-creation': '氣味創作',
    'heart-village-notes': '心村札記'
  };
  const defaultDirection = 'olfactory-culture';
  let isSaving = false;

  function toast(message, error = false) {
    let el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `toast show${error ? ' error-toast' : ''}`;
    window.clearTimeout(el._hanaTimer);
    el._hanaTimer = window.setTimeout(() => { el.className = 'toast'; }, error ? 7000 : 4200);
  }
  function stripDirection(body = '') {
    return String(body || '').replace(/<!--\s*reading-direction:\s*[a-z-]+\s*-->\s*/ig, '').trimStart();
  }
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }
  function hasHtmlMarkup(value = '') {
    return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
  }
  function textToHtml(value = '') {
    return String(value || '')
      .trim()
      .split(/\n{2,}/)
      .map(block => block.trim())
      .filter(Boolean)
      .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }
  function bodyForSave(value = '', direction = defaultDirection) {
    const clean = stripDirection(value).trim();
    const safeDirection = directionLabels[direction] ? direction : defaultDirection;
    const html = hasHtmlMarkup(clean) ? clean : textToHtml(clean);
    return `<!-- reading-direction:${safeDirection} -->\n${html}`;
  }
  function slugify(value = '') {
    return String(value || '').trim().toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || `post-${Date.now()}`;
  }
  function setup() {
    const form = $('#post-form');
    if (!form) return;
    const saveButton = form.querySelector('#save-post, button[type="submit"], .form-actions .primary');
    if (saveButton) {
      saveButton.id = 'save-post';
      saveButton.type = 'button';
    }
    const body = form.elements.body;
    if (body) {
      body.removeAttribute('required');
      body.placeholder = '可以直接輸入一般文章文字。段落之間空一行即可。';
      const small = body.closest('label')?.querySelector('small');
      if (small) small.textContent = '可直接輸入一般文字；段落之間空一行即可。若貼入 HTML 也會保留。';
    }
  }
  function errorText(error) {
    const text = error?.message || String(error || '');
    if (/row-level security|policy|permission|not authorized|unauthorized/i.test(text)) {
      return '儲存失敗：Supabase posts 權限未開放 authenticated update / insert。請先執行 posts 的 RLS SQL。';
    }
    return text || '儲存失敗，請稍後再試。';
  }
  async function savePost(event) {
    const form = $('#post-form');
    if (!form) return;
    event?.preventDefault();
    event?.stopPropagation();
    event?.stopImmediatePropagation();
    if (isSaving) return;

    setup();
    const saveButton = $('#save-post', form) || form.querySelector('.form-actions .primary');
    const original = saveButton?.textContent || '儲存';
    isSaving = true;
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = '儲存中…';
    }

    try {
      const id = form.elements.id?.value || '';
      const title = form.elements.title?.value.trim() || '';
      const body = form.elements.body?.value.trim() || '';
      const status = form.elements.status?.value || 'draft';
      const direction = form.elements.reading_direction?.value || defaultDirection;
      if (!title) {
        form.elements.title?.focus();
        throw new Error('請先填寫標題。');
      }
      if (!body) {
        form.elements.body?.focus();
        throw new Error('請先填寫內文。');
      }

      const payload = {
        title,
        slug: slugify(form.elements.slug?.value || title),
        status,
        summary: form.elements.summary?.value || '',
        cover_url: form.elements.cover_url?.value || '',
        body: bodyForSave(body, direction),
        published_at: status === 'published' ? new Date().toISOString() : null
      };

      toast('正在儲存氣味誌文章…');
      const query = id
        ? db.from('posts').update(payload).eq('id', id)
        : db.from('posts').insert(payload);
      const { error } = await query;
      if (error) throw error;
      toast('氣味誌文章已儲存。');
      $('#post-dialog')?.close();
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      console.error('[Emergency save]', error);
      toast(errorText(error), true);
    } finally {
      isSaving = false;
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = original;
      }
    }
  }
  async function logout(event) {
    event?.preventDefault();
    event?.stopPropagation();
    event?.stopImmediatePropagation();
    toast('正在登出…');
    try {
      await db.auth.signOut();
    } catch (error) {
      console.warn('[Emergency logout]', error);
    }
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/admin/';
    window.location.reload();
  }

  document.addEventListener('click', event => {
    const logoutButton = event.target.closest('#logout');
    if (logoutButton) {
      logout(event);
      return;
    }
    const saveButton = event.target.closest('#save-post, #post-form .form-actions .primary, #post-form button[type="submit"]');
    if (saveButton) {
      savePost(event);
    }
  }, true);

  document.addEventListener('submit', event => {
    if (event.target?.id === 'post-form') savePost(event);
  }, true);

  document.addEventListener('DOMContentLoaded', setup);
  setup();
})();