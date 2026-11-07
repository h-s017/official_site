(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {}, model = window.HanaHomeLayout;
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const $ = s => document.querySelector(s);
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state, published, updatedAt, userId, draftKey, dirty = false, busy = false, loaded = false;
  let previewReady = false;
  const status = (message, error = false) => { $('#status').textContent = message; $('#status').classList.toggle('error', error); };
  const name = id => id === 'hero' ? '首頁主視覺' : model.builtins.find(b => b.id === id)?.name || '自訂圖文區塊';
  const items = () => [state.hero, ...state.sections];
  function buttons() {
    for (const id of ['save-draft', 'publish', 'reset', 'add-block']) $('#' + id).disabled = !loaded || busy;
    $('#blocks').querySelectorAll('button,input,select,textarea').forEach(el => el.disabled = busy || el.dataset.unavailable === 'true');
  }
  function preview() {
    if (previewReady) $('#preview').contentWindow.postMessage({ type: 'hana-layout-preview', layout: model.normalize(state) }, location.origin);
  }
  function changed() { dirty = true; status('尚未發布，請先預覽。'); preview(); }
  function render(openIds = ['hero']) {
    $('#blocks').innerHTML = items().map((b, index) => `<details class="block" data-id="${esc(b.id)}" ${openIds.includes(b.id) ? 'open' : ''}>
      <summary>${esc(name(b.id))}<span>${b.id === 'hero' ? '固定頁首' : b.visible ? '顯示' : '已隱藏'}</span></summary>
      <div class="block-body">${b.id !== 'hero' ? `<div class="block-actions"><button type="button" data-action="up" data-unavailable="${index === 1}">上移</button><button type="button" data-action="down" data-unavailable="${index === state.sections.length}">下移</button>${b.id.startsWith('custom-') ? '<button type="button" data-action="delete">刪除區塊</button>' : ''}</div><label class="check"><input type="checkbox" data-field="visible" ${b.visible ? 'checked' : ''}>顯示這個區塊</label><label>圖文排列<select data-field="layout">${[['original', '原有版面'], ['left', '左圖右文'], ['right', '右圖左文'], ['top', '上圖下文']].map(([v, l]) => `<option value="${v}" ${b.layout === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
      ${b.id.startsWith('custom-') ? `<label>標題<input data-field="title" maxlength="160" value="${esc(b.title)}"></label><label>內容<textarea data-field="body" maxlength="5000" rows="5">${esc(b.body)}</textarea></label><label>按鈕文字<input data-field="label" maxlength="80" value="${esc(b.label)}"></label><label>按鈕連結<input data-field="link" value="${esc(b.link)}" placeholder="https:// 或 /頁面路徑"></label>` : ''}
      <img class="photo-preview" alt="${esc(name(b.id))}照片預覽" ${b.image ? `src="${esc(b.image)}"` : 'hidden'}>
      <label>上傳照片<input type="file" data-file accept="image/jpeg,image/png,image/webp,image/gif"></label>
      <label>照片網址<input data-field="image" value="${esc(b.image)}" placeholder="https:// 或 /assets/照片"></label>
      <label>照片說明（替代文字）<input data-field="alt" maxlength="500" value="${esc(b.alt)}"></label>
      <label>照片顯示方式<select data-field="fit"><option value="cover" ${b.fit === 'cover' ? 'selected' : ''}>填滿裁切</option><option value="contain" ${b.fit === 'contain' ? 'selected' : ''}>完整顯示</option></select></label>
      <label>裁切位置<select data-field="position">${[['center', '置中'], ['top', '靠上'], ['bottom', '靠下']].map(([v, l]) => `<option value="${v}" ${b.position === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button type="button" data-action="clear">${b.id === 'hero' || b.id === 'about' ? '還原原始照片' : '移除照片'}</button></div></details>`).join('');
    buttons(); preview();
  }
  function openIds() { return [...$('#blocks').querySelectorAll('details[open]')].map(el => el.dataset.id); }
  async function load(session) {
    if (!session) {
      userId = null; loaded = false; dirty = false; state = null; previewReady = false;
      $('#editor').hidden = true; $('#login').hidden = false; $('#preview').removeAttribute('src'); return;
    }
    if (userId === session.user.id) return;
    const requestUser = session.user.id; userId = requestUser;
    $('#login').hidden = true; $('#editor').hidden = false;
    const { data, error } = await db.from('site_settings').select('*').eq('id', 1).single();
    if (userId !== requestUser) return;
    if (error) { userId = null; status('無法載入首頁設定：' + error.message, true); return; }
    updatedAt = data.updated_at;
    published = model.normalize(data.home_layout);
    published.hero.image ||= model.imageUrl(data.hero_image_url) || '/assets/home-hero-1920.webp';
    published.hero.alt ||= data.hero_image_alt || 'HANA SCENT ARTIST 首頁主視覺';
    published.sections.find(b => b.id === 'about').image ||= '/assets/about-hana-900.webp';
    state = model.normalize(published);
    draftKey = `hana-home-layout:${cfg.supabaseUrl}:${userId}`;
    let restored = false;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey));
      if (saved?.layout) {
        state = model.normalize(saved.layout); dirty = true; restored = true;
        status(saved.updatedAt !== updatedAt ? '已載入此裝置草稿；官網已有新版本，請先還原已發布版面再編輯。' : '已載入此裝置草稿，尚未發布。');
        // Retain the draft base so publication detects stale edits.
        updatedAt = saved.updatedAt;
      }
    } catch (_) {}
    loaded = true; render();
    if (!restored) status('已載入已發布版面。');
    $('#preview').src = '/?hana-layout-preview=1';
  }
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault(); $('#login-error').textContent = '';
    const { error } = await db.auth.signInWithPassword({ email: $('#email').value, password: $('#password').value });
    $('#password').value = '';
    if (error) $('#login-error').textContent = '登入失敗，請確認帳號與密碼。';
  });
  $('#logout').onclick = async () => {
    if (dirty && !confirm('尚有未發布變更。要登出嗎？請先儲存草稿以保留變更。')) return;
    const { error } = await db.auth.signOut(); if (error) status('登出失敗：' + error.message, true);
  };
  db.auth.onAuthStateChange((_event, session) => { setTimeout(() => load(session), 0); });
  db.auth.getSession().then(({ data, error }) => error ? status(error.message, true) : load(data.session));
  window.addEventListener('message', e => {
    if (e.origin !== location.origin || e.source !== $('#preview').contentWindow || e.data?.type !== 'hana-layout-ready') return;
    previewReady = true; preview();
  });
  $('#blocks').addEventListener('input', e => {
    const field = e.target.dataset.field;
    if (!field || !state) return;
    const b = items().find(x => x.id === e.target.closest('[data-id]').dataset.id);
    const value = field === 'visible' ? e.target.checked : e.target.value;
    if ((field === 'image' || field === 'link') && value && !model.imageUrl(value)) {
      e.target.setCustomValidity('請輸入 HTTPS 網址或以 / 開頭的站內路徑。'); e.target.reportValidity(); return;
    }
    e.target.setCustomValidity(''); b[field] = value;
    if (field === 'image') { const img = e.target.closest('.block').querySelector('.photo-preview'); img.hidden = !value; if (value) img.src = value; else img.removeAttribute('src'); }
    if (field === 'visible') e.target.closest('.block').querySelector('summary span').textContent = value ? '顯示' : '已隱藏';
    changed();
  });
  $('#blocks').addEventListener('change', async e => {
    if (!e.target.matches('[data-file]')) return;
    const file = e.target.files[0], id = e.target.closest('[data-id]').dataset.id;
    try {
      model.validateImage(file); busy = true; buttons(); status('照片上傳中…');
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type];
      const path = `home/blocks/${id}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await db.storage.from('site-media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const b = items().find(x => x.id === id); b.image = db.storage.from('site-media').getPublicUrl(data.path).data.publicUrl;
      dirty = true; render(openIds()); status('照片已上傳，請預覽後發布。');
    } catch (error) { status('上傳失敗：' + error.message, true); }
    finally { busy = false; buttons(); e.target.value = ''; }
  });
  $('#blocks').addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action || busy) return;
    const id = e.target.closest('[data-id]').dataset.id, b = items().find(x => x.id === id), open = openIds();
    if (action === 'clear') {
      b.image = id === 'hero' ? '/assets/home-hero-1920.webp' : id === 'about' ? '/assets/about-hana-900.webp' : '';
      b.position = 'center'; b.fit = 'cover';
    } else if (action === 'delete') {
      if (!confirm('刪除這個圖文區塊？發布後才會從官網移除。')) return;
      state.sections = state.sections.filter(x => x.id !== id);
    } else {
      const i = state.sections.indexOf(b), j = i + (action === 'up' ? -1 : 1);
      if (j < 0 || j >= state.sections.length) return;
      [state.sections[i], state.sections[j]] = [state.sections[j], state.sections[i]];
    }
    changed(); render(open);
  });
  $('#add-block').onclick = () => {
    if (state.sections.length >= 30) return status('首頁最多可放 30 個區塊。', true);
    const id = `custom-${crypto.randomUUID()}`;
    state.sections.push({ ...model.normalize().sections[0], id, title: '新增圖文區塊', layout: 'left' });
    changed(); render([...openIds(), id]);
  };
  $('#save-draft').onclick = () => {
    if ($('#blocks').querySelector(':invalid')) return status('請先修正照片或按鈕網址。', true);
    try { localStorage.setItem(draftKey, JSON.stringify({ layout: model.normalize(state), updatedAt })); dirty = false; status('草稿已儲存於此裝置，尚未發布。'); }
    catch (_) { status('無法儲存草稿，請確認瀏覽器允許儲存資料。', true); }
  };
  $('#reset').onclick = async () => {
    if (!confirm('要捨棄此裝置草稿，重新載入官網已發布版面嗎？')) return;
    try { localStorage.removeItem(draftKey); } catch (_) {}
    userId = null; dirty = false; loaded = false; buttons();
    const { data } = await db.auth.getSession(); await load(data.session);
  };
  $('#publish').onclick = async () => {
    if ($('#blocks').querySelector(':invalid')) return status('請先修正照片或按鈕網址。', true);
    if (!confirm('將目前版面與照片發布到官網首頁？')) return;
    busy = true; buttons(); status('正在發布…');
    try {
      const layout = model.normalize(state);
      const query = db.from('site_settings').update({ home_layout: layout, hero_image_url: layout.hero.image, hero_image_alt: layout.hero.alt }).eq('id', 1);
      const { data, error } = await (updatedAt ? query.eq('updated_at', updatedAt) : query).select('updated_at').single();
      if (error) {
        if (error.code === 'PGRST116') throw new Error('設定已更新或目前帳號沒有編輯權限。請先儲存草稿並重新載入。');
        throw error;
      }
      updatedAt = data.updated_at; published = layout; dirty = false;
      try { localStorage.removeItem(draftKey); } catch (_) {}
      status('已發布，官網首頁重新整理後即可看到。');
    } catch (error) { status('發布失敗：' + error.message, true); }
    finally { busy = false; buttons(); }
  };
  for (const mode of ['desktop', 'mobile']) $('#' + mode).onclick = () => {
    $('#preview').classList.toggle('mobile', mode === 'mobile');
    $('#desktop').setAttribute('aria-pressed', String(mode === 'desktop')); $('#mobile').setAttribute('aria-pressed', String(mode === 'mobile'));
  };
  window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
})();
