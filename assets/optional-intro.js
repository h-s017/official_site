(() => {
  const dialog = document.getElementById('intro-screen');
  const opener = document.querySelector('.intro-open-button');
  if (!dialog || !opener || typeof dialog.showModal !== 'function') return;
  const pause = dialog.querySelector('.intro-pause');
  opener.hidden = false;
  opener.addEventListener('click', () => {
    dialog.querySelectorAll('img[data-src]').forEach(image => {
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    });
    dialog.showModal();
    document.body.classList.add('intro-open');
  });
  dialog.querySelectorAll('.intro-close,.intro-enter').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  pause.addEventListener('click', () => {
    const paused = dialog.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.textContent = paused ? '繼續播放' : '暫停播放';
  });
  // Native modal dialog handles Escape and background focus isolation.
  dialog.addEventListener('close', () => {
    document.body.classList.remove('intro-open');
    opener.focus({ preventScroll: true });
  });
})();
