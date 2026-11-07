(() => {
  'use strict';
  const cfg = window.HANA_CMS_CONFIG || {}, homeModel = window.HanaHomeLayout, pageModel = window.HanaPageLayout;
  const pages = window.HanaLayoutPages;
  let activePage = pages.find(p => p.path === new URLSearchParams(location.search).get('page')) || pages[0];
  let descriptor = null, pendingRecord = null, generation = 0;
  const isHome = () => activePage.path === '/';
  const model = {
    normalize: value => isHome() ? homeModel.normalize(value, descriptor || undefined) : pageModel.normalize(value, descriptor || {}),
    validateImage: homeModel.validateImage, imageUrl: homeModel.imageUrl,
    get builtins() { return isHome() ? homeModel.builtins : descriptor?.sections || []; }
  };
  const db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const $ = s => document.querySelector(s);
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state, published, updatedAt, userId, draftKey, dirty = false, busy = false, loaded = false;
  let previewReady = false;
  const status = (message, error = false) => { $('#status').textContent = message; $('#status').classList.toggle('error', error); };
  const name = id => id === 'hero' ? (isHome() ? '首頁主視覺' : '頁首主視覺') : model.builtins.find(b => b.id === id)?.name || '自訂圖文區塊';
  const fieldsOf = id => (id === 'hero' ? descriptor?.hero : descriptor?.sections?.find(x => x.id === id))?.fields || [];
  const fieldsHtml = block => {
    const fields = fieldsOf(block.id);
    if (!fields.length) return '';
    return `<details class="copy-editor" open><summary>文字與按鈕（${fields.length}）</summary><input type="search" data-copy-search placeholder="搜尋這個區塊的文字" aria-label="搜尋區塊文字"><div class="copy-list">${fields.map(field => {
      const value = Object.hasOwn(block.copy || {}, field.id) ? block.copy[field.id] : field.value;
      const attrs = `data-copy-field="${esc(field.id)}" data-copy-kind="${field.kind}" maxlength="10000"`;
      const input = field.kind === 'text' ? `<textarea ${attrs} rows="${['P','LI','TD','DD'].includes(field.tag) ? 3 : 2}">${esc(value)}</textarea>` : `<input ${attrs} value="${esc(value)}">`;
      return `<div class="copy-field" data-copy-match="${esc((field.label + ' ' + value).toLowerCase())}"><label>${esc(field.label)}${input}</label><button type="button" data-action="restore-copy" data-copy-id="${esc(field.id)}">${field.kind === 'href' ? '還原原始連結' : field.kind === 'placeholder' ? '還原原始提示' : '還原原始文字'}</button></div>`;
    }).join('')}</div></details>`;
  };
  const items = () => [state.hero, ...state.sections].filter(Boolean);
  function buttons() {
    $('#page-select').disabled = busy;
    for (const id of ['save-draft', 'publish', 'reset', 'add-block']) $('#' + id).disabled = !loaded || busy;
    $('#blocks').querySelectorAll('button,input,select,textarea').forEach(el => el.disabled = busy || el.dataset.unavailable === 'true');
  }
  function preview() {
    if (previewReady && loaded && state) $('#preview').contentWindow.postMessage({ type: 'hana-layout-preview', path: activePage.path, layout: model.normalize(state) }, location.origin);
  }
  function changed() { dirty = true; status('尚未發布，請先預覽。'); preview(); }
  function render(openIds = ['hero']) {
    $('#blocks').innerHTML = items().map((b, index) => `<details class="block" data-id="${esc(b.id)}" ${openIds.includes(b.id) ? 'open' : ''}>
      <summary>${esc(name(b.id))}<span>${b.id === 'hero' ? '固定頁首' : b.visible ? '顯示' : '已隱藏'}</span></summary>
      <div class="block-body">${b.id !== 'hero' ? `<div class="block-actions"><button type="button" data-action="up" data-unavailable="${index === (state.hero ? 1 : 0)}">上移</button><button type="button" data-action="down" data-unavailable="${index === items().length - 1}">下移</button>${b.id.startsWith('custom-') ? '<button type="button" data-action="delete">刪除區塊</button>' : ''}</div><label class="check"><input type="checkbox" data-field="visible" ${b.visible ? 'checked' : ''}>顯示這個區塊</label><label>圖文排列<select data-field="layout">${[['original', '原有版面'], ['left', '左圖右文'], ['right', '右圖左文'], ['top', '上圖下文']].map(([v, l]) => `<option value="${v}" ${b.layout === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
      ${b.id.startsWith('custom-') ? `<label>標題<input data-field="title" maxlength="160" value="${esc(b.title)}"></label><label>內容<textarea data-field="body" maxlength="5000" rows="5">${esc(b.body)}</textarea></label><label>按鈕文字<input data-field="label" maxlength="80" value="${esc(b.label)}"></label><label>按鈕連結<input data-field="link" value="${esc(b.link)}" placeholder="https:// 或 /頁面路徑"></label>` : ''}
      ${fieldsHtml(b)}
      <p class="hint">${isHome() ? '區塊照片' : '新增區塊照片（可搭配圖文排列）'}</p>
      <img class="photo-preview" alt="${esc(name(b.id))}照片預覽" ${b.image ? `src="${esc(b.image)}"` : 'hidden'}>
      <label>上傳照片<input type="file" data-file accept="image/jpeg,image/png,image/webp,image/gif"></label>
      <label>照片網址<input data-field="image" value="${esc(b.image)}" placeholder="https:// 或 /assets/照片"></label>
      <label>照片說明（替代文字）<input data-field="alt" maxlength="500" value="${esc(b.alt)}"></label>
      <label>照片顯示方式<select data-field="fit"><option value="cover" ${b.fit === 'cover' ? 'selected' : ''}>填滿裁切</option><option value="contain" ${b.fit === 'contain' ? 'selected' : ''}>完整顯示</option></select></label>
      <label>裁切位置<select data-field="position">${[['center', '置中'], ['top', '靠上'], ['bottom', '靠下']].map(([v, l]) => `<option value="${v}" ${b.position === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button type="button" data-action="clear">${isHome() && (b.id === 'hero' || b.id === 'about') ? '還原原始照片' : '移除區塊照片'}</button>
      ${(b.images || []).map((photo, i) => `<details class="existing-photo"><summary>原有照片 ${i + 1}</summary><div class="photo-fields"><img class="photo-preview" src="${esc(photo.url)}" alt="原有照片 ${i + 1} 預覽"><label>更換這張照片<input type="file" data-file data-image="${esc(photo.id)}" accept="image/jpeg,image/png,image/webp,image/gif"></label><label>照片網址<input data-image="${esc(photo.id)}" data-photo-field="url" value="${esc(photo.url)}"></label><label>照片說明<input data-image="${esc(photo.id)}" data-photo-field="alt" value="${esc(photo.alt)}" maxlength="500"></label><label>照片顯示方式<select data-image="${esc(photo.id)}" data-photo-field="fit"><option value="cover" ${photo.fit === 'cover' ? 'selected' : ''}>填滿裁切</option><option value="contain" ${photo.fit === 'contain' ? 'selected' : ''}>完整顯示</option></select></label><label>裁切位置<select data-image="${esc(photo.id)}" data-photo-field="position">${['center','top','bottom'].map((v,j)=>`<option value="${v}" ${photo.position===v?'selected':''}>${['置中','靠上','靠下'][j]}</option>`).join('')}</select></label><button type="button" data-action="restore-photo" data-image="${esc(photo.id)}">還原這張照片</button></div></details>`).join('')}
      </div></details>`).join('');
    buttons(); preview();
  }
  function openIds() { return [...$('#blocks').querySelectorAll('details[open]')].map(el => el.dataset.id); }
  function completeLoad() {
    if (!pendingRecord || !descriptor) return;
    const data = pendingRecord;
    updatedAt = data.updated_at;
    published = model.normalize(isHome() ? data.home_layout : data.layout);
    if (isHome()) {
      published.hero.image ||= model.imageUrl(data.hero_image_url) || '/assets/home-hero-1920.webp';
      published.hero.alt ||= data.hero_image_alt || 'HANA SCENT ARTIST 首頁主視覺';
      published.sections.find(b => b.id === 'about').image ||= '/assets/about-hana-900.webp';
    }
    state = model.normalize(published);
    draftKey = isHome() ? `hana-home-layout:${cfg.supabaseUrl}:${userId}` : `hana-page-layout:${cfg.supabaseUrl}:${userId}:${activePage.path}`;
    let restored = false;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey));
      if (saved?.layout) {
        state = model.normalize(saved.layout); dirty = true; restored = true;
        status(saved.updatedAt !== updatedAt ? '已載入此頁草稿；官網已有新版本，請先還原已發布版面再編輯。' : '已載入此頁草稿，尚未發布。');
        updatedAt = saved.updatedAt;
      }
    } catch (_) {}
    loaded = true; busy = false; pendingRecord = null; render(state.hero ? ['hero'] : [state.sections[0]?.id]);
    if (!restored) status(`已載入「${activePage.name}」的已發布版面。`);
  }
  async function loadPage() {
    const request = ++generation;
    loaded = false; busy = true; dirty = false; state = null; descriptor = null; pendingRecord = null; previewReady = false;
    $('#blocks').replaceChildren(); buttons(); status(`正在載入「${activePage.name}」…`);
    $('#preview').src = activePage.path + '?hana-layout-preview=1&copy-editor=2';
    const result = isHome()
      ? await db.from('site_settings').select('*').eq('id', 1).single()
      : await db.from('site_page_layouts').select('layout,updated_at').eq('page_key', activePage.path).single();
    if (request !== generation || !userId) return;
    if (result.error) { busy = false; buttons(); status('無法載入頁面設定：' + result.error.message, true); return; }
    pendingRecord = result.data; completeLoad();
  }
  async function load(session) {
    if (!session) {
      ++generation; userId = null; loaded = false; dirty = false; busy = false; state = null; previewReady = false;
      $('#editor').hidden = true; $('#login').hidden = false; $('#preview').removeAttribute('src'); return;
    }
    if (userId === session.user.id) return;
    userId = session.user.id; $('#login').hidden = true; $('#editor').hidden = false;
    await loadPage();
  }
  $('#page-select').innerHTML = pages.map(p => `<option value="${esc(p.path)}" ${p.path === activePage.path ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  $('#page-select').onchange = async e => {
    if (dirty && !confirm('此頁尚有未儲存變更。要捨棄並切換頁面嗎？')) { e.target.value = activePage.path; return; }
    activePage = pages.find(p => p.path === e.target.value); history.replaceState(null, '', '?page=' + encodeURIComponent(activePage.path)); await loadPage();
  };
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
    if (isHome() ? !!e.data.path && e.data.path !== '/' : e.data.path !== activePage.path) return;
    descriptor = e.data.descriptor;
    previewReady = true; completeLoad(); preview();
  });
  $('#blocks').addEventListener('input', e => {
    if (e.target.matches('[data-copy-search]')) {
      const query = e.target.value.toLowerCase();
      e.target.closest('.copy-editor').querySelectorAll('.copy-field').forEach(field => field.hidden = !field.dataset.copyMatch.includes(query));
      return;
    }
    if (e.target.dataset.copyField && state) {
      const block = items().find(b => b.id === e.target.closest('[data-id]').dataset.id), value = e.target.value;
      if (e.target.dataset.copyKind === 'href' && homeModel.linkUrl(value) === null) {
        e.target.setCustomValidity('請輸入 HTTPS、站內路徑、#錨點、mailto: 或 tel: 連結。'); e.target.reportValidity(); return;
      }
      e.target.setCustomValidity(''); block.copy ||= {}; block.copy[e.target.dataset.copyField] = value; block.title = '';
      changed(); return;
    }
    const photoField = e.target.dataset.photoField;
    if (photoField && state) {
      const b = items().find(x => x.id === e.target.closest('[data-id]').dataset.id);
      const photo = b.images.find(x => x.id === e.target.dataset.image);
      const value = e.target.value;
      if (photoField === 'url' && !model.imageUrl(value)) { e.target.setCustomValidity('請輸入 HTTPS 網址或站內路徑。'); e.target.reportValidity(); return; }
      e.target.setCustomValidity(''); photo[photoField] = value;
      if (photoField === 'url') e.target.closest('.existing-photo').querySelector('img').src = value;
      changed(); return;
    }
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
    const file = e.target.files[0], id = e.target.closest('[data-id]').dataset.id, imageId = e.target.dataset.image;
    try {
      model.validateImage(file); busy = true; buttons(); status('照片上傳中…');
      const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[file.type];
      const path = `pages/${activePage.path.replace(/[^a-z0-9-]/gi, '-')}/blocks/${id}/${crypto.randomUUID()}.${ext}`;
      const { data, error } = await db.storage.from('site-media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const b = items().find(x => x.id === id), url = db.storage.from('site-media').getPublicUrl(data.path).data.publicUrl;
      if (imageId) b.images.find(x => x.id === imageId).url = url; else b.image = url;
      dirty = true; render(openIds()); status('照片已上傳，請預覽後發布。');
    } catch (error) { status('上傳失敗：' + error.message, true); }
    finally { busy = false; buttons(); e.target.value = ''; }
  });
  $('#blocks').addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action || busy) return;
    const id = e.target.closest('[data-id]').dataset.id, b = items().find(x => x.id === id), open = openIds();
    if (action === 'restore-copy') {
      delete b.copy[e.target.dataset.copyId]; b.title = '';
    } else if (action === 'restore-photo') {
      const imageId = e.target.dataset.image;
      const original = (descriptor.hero?.id === id ? descriptor.hero : descriptor.sections.find(x => x.id === id)).images.find(x => x.id === imageId);
      Object.assign(b.images.find(x => x.id === imageId), original, { fit: 'cover', position: 'center' });
    } else if (action === 'clear') {
      b.image = isHome() && id === 'hero' ? '/assets/home-hero-1920.webp' : isHome() && id === 'about' ? '/assets/about-hana-900.webp' : '';
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
    if (state.sections.length >= 30) return status('每頁最多可放 30 個區塊。', true);
    const id = `custom-${crypto.randomUUID()}`;
    state.sections.push({ ...homeModel.normalize().sections[0], id, title: '新增圖文區塊', layout: 'left', images: [] });
    changed(); render([...openIds(), id]);
  };
  $('#save-draft').onclick = () => {
    if ($('#blocks').querySelector(':invalid')) return status('請先修正照片或文字連結的網址。', true);
    try { localStorage.setItem(draftKey, JSON.stringify({ layout: model.normalize(state), updatedAt })); dirty = false; status('草稿已儲存於此裝置，尚未發布。'); }
    catch (_) { status('無法儲存草稿，請確認瀏覽器允許儲存資料。', true); }
  };
  $('#reset').onclick = async () => {
    if (!confirm('要捨棄此裝置草稿，重新載入官網已發布版面嗎？')) return;
    try { localStorage.removeItem(draftKey); } catch (_) {}
    dirty = false; await loadPage();
  };
  $('#publish').onclick = async () => {
    if ($('#blocks').querySelector(':invalid')) return status('請先修正照片或文字連結的網址。', true);
    if (!confirm(`將目前版面與照片發布到「${activePage.name}」？`)) return;
    busy = true; buttons(); status('正在發布…');
    try {
      const layout = model.normalize(state);
      const query = isHome()
        ? db.from('site_settings').update({ home_layout: layout, hero_image_url: layout.hero.image, hero_image_alt: layout.hero.alt }).eq('id', 1)
        : db.from('site_page_layouts').update({ layout }).eq('page_key', activePage.path);
      const { data, error } = await (updatedAt ? query.eq('updated_at', updatedAt) : query).select('updated_at').single();
      if (error) {
        if (error.code === 'PGRST116') throw new Error('設定已更新或目前帳號沒有編輯權限。請先儲存草稿並重新載入。');
        throw error;
      }
      updatedAt = data.updated_at; published = layout; dirty = false;
      try { localStorage.removeItem(draftKey); } catch (_) {}
      status(`已發布「${activePage.name}」，重新整理頁面後即可看到。`);
    } catch (error) { status('發布失敗：' + error.message, true); }
    finally { busy = false; buttons(); }
  };
  for (const mode of ['desktop', 'mobile']) $('#' + mode).onclick = () => {
    $('#preview').classList.toggle('mobile', mode === 'mobile');
    $('#desktop').setAttribute('aria-pressed', String(mode === 'desktop')); $('#mobile').setAttribute('aria-pressed', String(mode === 'mobile'));
  };
  window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
})();
