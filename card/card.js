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

  byId('copy-line').onclick = () => copy(byId('copy-line').dataset.lineId, '已複製 LINE ID');
  byId('copy-url').onclick = () => copy(cardUrl, '已複製名片網址');
  byId('show-qr').onclick = () => byId('qr-dialog').showModal();
  byId('native-share').onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url: cardUrl });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    await copy(cardUrl, '已複製名片網址');
  };

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
            image('./portrait.jpg', 'lg', '160:186'),
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
            button('LINE 聯絡', byId('line-contact').href),
            button('官方網站', byId('website').href),
            button('Instagram', byId('instagram').href),
            button('分享名片', shareUrl),
          ],
        },
      },
    };
  }

  if (!liffId) return;

  const sdk = document.createElement('script');
  sdk.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
  sdk.onload = async () => {
    try {
      await liff.init({ liffId });
    } catch {
      return;
    }
    const appUrl = 'https://liff.line.me/' + encodeURIComponent(liffId);
    const fallback = lineShare.href;
    const flex = buildFlexMessage(appUrl);
    let sharing = false;
    lineShare.onclick = async (event) => {
      event.preventDefault();
      if (sharing) return;
      sharing = true;
      try {
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: cardUrl });
          return;
        }
        if (!liff.isApiAvailable('shareTargetPicker')) {
          location.assign(fallback);
          return;
        }
        const result = await liff.shareTargetPicker([flex], { isMultiple: true });
        status.textContent = result?.status === 'success' ? '已分享 LINE 名片' : '';
      } catch {
        location.assign(fallback);
      } finally {
        sharing = false;
      }
    };
  };
  document.head.append(sdk);
})();
