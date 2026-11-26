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
    const image = (src, size, aspectRatio) => ({
      type: 'image', url: new URL(src, cardUrl).href, size, aspectRatio, aspectMode: 'fit',
    });
    const button = (label, uri) => ({
      type: 'button', style: 'link', height: 'sm', color: '#111111',
      action: { type: 'uri', label, uri },
    });
    return {
      type: 'flex',
      altText: cardName + '｜HANA SCENT ARTIST 電子名片',
      contents: {
        type: 'bubble',
        styles: { body: { backgroundColor: '#FFFFFF' }, footer: { backgroundColor: '#FFFFFF', separator: true, separatorColor: '#DEDEDE' } },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm',
          contents: [
            image('/assets/logo%E9%BB%91.png', 'xs', '1:1'),
            text('HANA SCENT ARTIST', { align: 'center', weight: 'bold', size: 'sm' }),
            image('./portrait.jpg', 'lg', '4:5'),
            text(cardName, { align: 'center', weight: 'bold', size: 'xl' }),
            text(byId('card-role').textContent, { align: 'center', size: 'sm' }),
            { type: 'separator', color: '#DEDEDE', margin: 'md' },
            text(document.querySelector('.card-services h2').textContent, { weight: 'bold', size: 'sm' }),
            ...Array.from(document.querySelectorAll('.card-services li'), (item) => text(item.textContent, { size: 'sm' })),
            text(document.querySelector('.card-studio').textContent, { color: '#555555', size: 'xs', margin: 'md' }),
          ],
        },
        footer: {
          type: 'box', layout: 'vertical', paddingAll: 'sm',
          contents: [
            button('電話聯絡', byId('phone').href),
            button('加入 LINE', byId('line-contact').href),
            button('官方網站', byId('website').href),
            button('Instagram', byId('instagram').href),
            button('分享名片', shareUrl),
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