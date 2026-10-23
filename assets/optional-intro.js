(() => {
  const dialog = document.getElementById('intro-screen');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const pause = dialog.querySelector('.intro-pause');
  // Use a new session key so visitors see the restored opening once after this release.
  const sessionKey = 'hana-intro-restored-seen';
  const returnFocus = document.querySelector('.site-nav .logo');
  let pointerClose = false;
  const openIntro = (automatic = false) => {
    pointerClose = false;
    dialog.querySelectorAll('img[data-src]').forEach(image => {
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    });
    dialog.classList.toggle('is-auto-opening', automatic);
    dialog.showModal();
    document.body.classList.add('intro-open');
  };
  dialog.querySelectorAll('.intro-enter').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  pause.addEventListener('click', () => {
    const paused = dialog.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? '繼續播放' : '暫停播放';
  });
  dialog.addEventListener('pointerdown', () => { pointerClose = true; });
  document.addEventListener('keydown', () => {
    pointerClose = false;
    dialog.classList.remove('is-auto-opening');
    document.querySelector('[data-intro-pointer-focus]')?.removeAttribute('data-intro-pointer-focus');
  });
  // Native dialog handles Escape and background focus isolation.
  dialog.addEventListener('close', () => {
    document.body.classList.remove('intro-open');
    try { window.sessionStorage.setItem(sessionKey, '1'); } catch (_) {}
    const target = returnFocus;
    // Preserve focus location without drawing a keyboard ring after touch/click.
    if (pointerClose && target?.matches('.site-nav .logo')) {
      target.setAttribute('data-intro-pointer-focus', '');
      target.addEventListener('blur', () => target.removeAttribute('data-intro-pointer-focus'), { once: true });
    }
    target?.focus({ preventScroll: true });
  });
  let seen = false;
  try { seen = window.sessionStorage.getItem(sessionKey) === '1'; } catch (_) {}
  if (!seen) openIntro(true);
})();
