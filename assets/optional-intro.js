(() => {
  const dialog = document.getElementById('intro-screen');
  const opener = document.querySelector('.intro-open-button');
  if (!dialog || !opener || typeof dialog.showModal !== 'function') return;
  const pause = dialog.querySelector('.intro-pause');
  // Use a new session key so visitors see the restored opening once after this release.
  const sessionKey = 'hana-intro-restored-seen';
  let returnFocus = opener;
  const openIntro = (automatic = false) => {
    returnFocus = automatic ? document.querySelector('.site-nav .logo') : opener;
    dialog.querySelectorAll('img[data-src]').forEach(image => {
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    });
    dialog.classList.toggle('is-auto-opening', automatic);
    dialog.showModal();
    document.body.classList.add('intro-open');
  };
  opener.hidden = false;
  opener.addEventListener('click', () => openIntro());
  dialog.querySelectorAll('.intro-close,.intro-enter').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  pause.addEventListener('click', () => {
    const paused = dialog.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? '繼續播放' : '暫停播放';
  });
  dialog.addEventListener('keydown', () => dialog.classList.remove('is-auto-opening'));
  // Native dialog handles Escape and background focus isolation.
  dialog.addEventListener('close', () => {
    document.body.classList.remove('intro-open');
    try { window.sessionStorage.setItem(sessionKey, '1'); } catch (_) {}
    returnFocus?.focus({ preventScroll: true });
  });
  let seen = false;
  try { seen = window.sessionStorage.getItem(sessionKey) === '1'; } catch (_) {}
  if (!seen) openIntro(true);
})();
