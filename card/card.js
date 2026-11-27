(() => {
  const byId = (id) => document.getElementById(id);
  const cardUrl = document.querySelector('link[rel="canonical"]').href;
  const cardName = document.querySelector('.card h1').textContent;
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
      type: 'text', text: value, color: '#111111', wrap: true, ...properties,
    });
    const button = (label, uri, color, backgroundColor) => ({
      type: 'box', layout: 'vertical', flex: 1, height: '44px',
      backgroundColor, cornerRadius: '8px', justifyContent: 'center', alignItems: 'center',
      action: { type: 'uri', label, uri },
      contents: [text(label, { color, size: 'sm', weight: 'bold', align: 'center' })],
    });
    return {
      type: 'flex',
      altText: cardName + '｜HANA SCENT ARTIST 電子名片',
      contents: {
        type: 'bubble',
        styles: { body: { backgroundColor: '#FFFFFF' }, footer: { backgroundColor: '#FFFFFF' } },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
          contents: [
            { type: 'box', layout: 'horizontal', alignItems: 'center', justifyContent: 'center', spacing: 'sm', contents: [
              { type: 'image', url: new URL('/assets/logo%E9%BB%91.png', cardUrl).href, size: '32px', aspectRatio: '1:1', aspectMode: 'fit', flex: 0 },
              text('HANA SCENT ARTIST', { size: 'sm', weight: 'bold', flex: 0 })
            ] },
            { type: 'image', url: new URL('./portrait.jpg', cardUrl).href, size: 'xl', aspectRatio: '4:5', aspectMode: 'cover', margin: 'sm', action: { type: 'uri', label: '查看完整名片', uri: cardUrl } },
            text(cardName, { align: 'center', weight: 'bold', size: 'xl', margin: 'sm' }),
            text(byId('card-role').textContent, { align: 'center', size: 'xs', color: '#444444' }),
            { type: 'separator', color: '#DEDEDE', margin: 'md' },
            text('創作與教育・品牌與產品開發', { weight: 'bold', size: 'sm', margin: 'md' }),
            text('香氛品牌孵化・氣味研發', { size: 'sm' }),
            text('香氛與日化產品開發・OEM／ODM', { size: 'sm' }),
            text('專業調香教育・企業團體課程', { size: 'sm' }),
            text('藏花香徑工作室', { color: '#666666', size: 'xs', margin: 'sm' }),
          ],
        },
        footer: {
          type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px', paddingTop: '0px',
          contents: [
            button('加入 LINE', byId('line-contact').href, '#FFFFFF', '#06C755'),
            { type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
              button('官方網站', byId('website').href, '#111111', '#EEEEEE'),
              button('分享名片', shareUrl, '#111111', '#EEEEEE')
            ] }
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