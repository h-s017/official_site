(() => {
  const byId = (id) => document.getElementById(id);
  const cardUrl = document.querySelector('link[rel="canonical"]').href;
  const cardName = document.querySelector('.card h1').textContent.replace(/^Hana\s*/i, '').trim();
  const lineShare = byId('line-share');
  const status = byId('card-status');
  const liffId = document.querySelector('meta[name="line-liff-id"]').content.trim();

  async function copy(value, message) {
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = message;
    } catch {
      window.prompt('請複製以下內容', value);
    }
  }

  byId('show-qr').onclick = () => byId('qr-dialog').showModal();

  function buildFlexMessage(shareUrl) {
    const text = (value, properties = {}) => ({
      type: 'text', text: value, color: '#111111', wrap: true, align: 'center', ...properties,
    });
    const iconButton = (name, label, uri) => ({
      type: 'box', layout: 'vertical', flex: 1, height: '28px',
      backgroundColor: '#FFFFFF',
      justifyContent: 'center', alignItems: 'center',
      action: { type: 'uri', label, uri },
      contents: [{ type: 'image', url: new URL((name === 'line' ? './icon-line-v19.png' : './icon-' + name + '-v5.png'), cardUrl).href,
        size: '28px', aspectRatio: '1:1', aspectMode: 'fit', flex: 0 }],
    });
    const row = (...contents) => ({ type: 'box', layout: 'horizontal', spacing: 'xs', contents });
    return {
      type: 'flex',
      altText: 'HANA SCENT ARTIST',
      contents: {
        type: 'bubble',
        styles: { body: { backgroundColor: '#FFFFFF' } },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px',
          contents: [
            { type: 'box', layout: 'horizontal', alignItems: 'center', contents: [
              { type: 'box', layout: 'vertical', flex: 0, width: '32px', contents: [{ type: 'filler' }] },
              { type: 'box', layout: 'horizontal', flex: 1, alignItems: 'center', justifyContent: 'center', spacing: 'xs', contents: [
                { type: 'image', url: new URL('/assets/logo%E9%BB%91.png', cardUrl).href, size: '22px', aspectRatio: '1:1', aspectMode: 'fit', flex: 0 },
                { type: 'image', url: new URL('./brand-wordmark-v14.png', cardUrl).href, size: '160px', aspectRatio: '218:27', aspectMode: 'fit', flex: 0 }
              ] },
              { ...iconButton('share', '分享名片', shareUrl), flex: 0, width: '32px', height: '32px' }
            ] },
            { type: 'box', layout: 'horizontal', justifyContent: 'center', margin: '16px', contents: [{ type: 'box', layout: 'vertical', width: '144px', height: '152px', flex: 0, paddingAll: 'none', action: { type: 'uri', label: '查看完整名片', uri: cardUrl }, contents: [
              { type: 'image', url: new URL('./portrait.jpg', cardUrl).href, size: '112px', aspectRatio: '4:5', aspectMode: 'cover', position: 'absolute', offsetTop: '6px', offsetStart: '16px' },
              { type: 'image', url: new URL('./portrait-orbit-v18.png', cardUrl).href, size: 'full', aspectRatio: '18:19', aspectMode: 'fit', position: 'absolute', offsetTop: '0px', offsetStart: '0px' }
            ] }] },
            text(cardName, { weight: 'regular', size: 'xl' }),
            text('FOUNDER & PERFUMER', { size: 'sm', color: '#555555', style: 'italic', weight: 'regular' }),
            { ...row(iconButton('phone', '電話聯絡', byId('phone').href), iconButton('line', '加入 LINE', byId('line-contact').href), iconButton('web', '官方網站', byId('website').href), iconButton('ig', 'Instagram', byId('instagram').href)), margin: '16px' },
            text('創作與教育・品牌與產品開發', { weight: 'regular', size: 'sm', margin: '16px' }),
            text('香氛品牌孵化・氣味研發', { size: 'sm' }),
            text('香氛與日化產品開發・OEM／ODM', { size: 'sm' }),
            text('專業調香教育・企業團體課程', { size: 'sm' }),
            text('台北市北投區新民路42號', { size: 'xs', color: '#555555', margin: '16px' }),
          ],
        },
      },
    };
  }

  if (!liffId) return;
  const appUrl = 'https://liff.line.me/' + encodeURIComponent(liffId);
  const shareUrl = appUrl + '/share/';
  const sharePage = new URL('share/', cardUrl).href;
  const sdk = document.createElement('script');
  sdk.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
  let ready = false, sharing = false, autoShare = false;
  const initialParams = new URLSearchParams(location.search);
  const state = initialParams.get('liff.state') || '';
  const shareRequested = () => /\/card\/+share(?:\/|$)/.test(location.pathname) || new URLSearchParams(location.search).get('share') === '1';
  const shareIntent = shareRequested() || /(?:[?&])share=1(?:&|$)/.test(state) || /(?:^|\/)share(?:\/|$|\?)/.test(state);
  const overlay = document.createElement('div');
  overlay.setAttribute('role', 'status');
  overlay.style.cssText = 'position:fixed;inset:0;background:#fff;color:#333;display:none;z-index:99999;align-items:center;justify-content:center;flex-direction:column;gap:16px;font:14px system-ui,sans-serif;text-align:center;padding:24px;';
  const message = document.createElement('div');
  message.textContent = '正在開啟 LINE 分享…';
  const retry = document.createElement('button');
  retry.textContent = '選擇分享對象';
  retry.style.cssText = 'display:none;background:#fff;border:1px solid #aaa;padding:12px 20px;color:#111;font:inherit;border-radius:6px;';
  const cancel = document.createElement('button');
  cancel.textContent = '返回名片';
  cancel.style.cssText = 'display:none;background:none;border:0;color:#666;font:inherit;padding:8px;';
  overlay.append(message, retry, cancel);
  document.body.append(overlay);
  if (shareIntent) overlay.style.display = 'flex';
  const showFallback = (value) => {
    message.textContent = value;
    retry.style.display = 'block';
    cancel.style.display = 'block';
  };
  function finish() {
    if (liff.isInClient()) { try { liff.closeWindow(); } catch {} }
    if (/\/card\/+share(?:\/|$)/.test(location.pathname)) { location.replace(cardUrl); return; }
    overlay.style.display = 'none';
    if (shareRequested()) {
      const url = new URL(location.href); url.searchParams.delete('share');
      history.replaceState(null, '', url);
    }
  }
  cancel.onclick = finish;
  async function openPicker() {
    if (!ready || sharing) return;
    sharing = true;
    retry.style.display = 'none';
    try {
      if (!liff.isLoggedIn()) {
        if (!liff.isInClient()) {
          liff.login({redirectUri: autoShare ? sharePage : cardUrl});
          return;
        }
        throw new Error('LINE 尚未登入');
      }
      if (!liff.isApiAvailable('shareTargetPicker')) throw new Error('此環境無法使用分享選擇器，請從 LINE 開啟');
      const result = await liff.shareTargetPicker([buildFlexMessage(shareUrl)], {isMultiple:true});
      status.textContent = result?.status === 'success' ? '已分享 LINE 名片' : '';
      if (autoShare) finish();
    } catch(error) {
      status.textContent = 'LINE 分享失敗：' + (error.message || error.code || '請重試');
      if (autoShare) showFallback('無法自動開啟分享，請點選下方按鈕。' + (error.code ? '（' + error.code + '）' : ''));
    } finally { sharing = false; }
  }
  retry.onclick = openPicker;
  lineShare.onclick = async (event) => {
    event.preventDefault();
    if (!ready) { if (!location.href.includes('liff.state') && !window.liff?.isInClient()) location.assign(shareUrl); else status.textContent = 'LINE 初始化中，請稍後再試'; return; }
    await openPicker();
  };
  sdk.onload = async () => {
    try {
      await liff.init({liffId}); ready = true;
      autoShare = shareRequested() || shareIntent;
      if (autoShare) { overlay.style.display = 'flex'; await openPicker(); }
    } catch(error) {
      status.textContent = 'LIFF 初始化失敗：' + (error.message || error.code || '請重試');
      if (shareIntent) { message.textContent = 'LINE 初始化失敗，請重新開啟名片'; cancel.style.display = 'block'; }
    }
  };
  sdk.onerror = () => { status.textContent = 'LINE SDK 載入失敗，請重新開啟名片'; if (shareIntent) { message.textContent = status.textContent; cancel.style.display = 'block'; } };
  document.head.append(sdk);
})();
