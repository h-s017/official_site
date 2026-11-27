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
      altText: cardName + '｜HANA SCENT ARTIST 電子名片',
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
  const sdk = document.createElement('script');
  sdk.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
  let ready = false, sharing = false;
  lineShare.onclick = async (event) => {
    event.preventDefault();
    if (!ready) { if (!location.href.includes('liff.state') && !window.liff?.isInClient()) location.assign(appUrl); else status.textContent = 'LINE 初始化中，請稍後再試'; return; }
    if (sharing) return;
    sharing = true;
    try {
      if (!liff.isLoggedIn()) { if (!liff.isInClient()) { liff.login({redirectUri:cardUrl}); return; } throw new Error('LINE 尚未登入'); }
      if (!liff.isApiAvailable('shareTargetPicker')) throw new Error('此環境無法使用分享選擇器，請從 LINE 開啟名片');
      const result = await liff.shareTargetPicker([buildFlexMessage(appUrl)], {isMultiple:true});
      status.textContent = result?.status === 'success' ? '已分享 LINE 名片' : '';
    } catch(error) { status.textContent = 'LINE 分享失敗：' + (error.message || error.code || '請重試'); }
    finally { sharing = false; }
  };
  sdk.onload = async () => {
    try { await liff.init({liffId}); ready = true; }
    catch(error) { status.textContent = 'LIFF 初始化失敗：' + (error.message || error.code || '請重試'); }
  };
  sdk.onerror = () => { status.textContent = 'LINE SDK 載入失敗，請重新開啟名片'; };
  document.head.append(sdk);
})();