(() => {
  'use strict';
  const model = window.HanaHomeLayout;
  let dialog;
  function open({ url, config, ratio = 4 / 3, placement, onApply }) {
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.id = 'photo-editor'; dialog.className = 'photo-editor';
      dialog.innerHTML = `<header><h2>拖曳照片</h2><button type="button" data-close aria-label="關閉照片編輯">×</button></header>
        <div class="photo-editor-body"><div class="photo-mode"><button type="button" data-mode="crop" aria-pressed="true">調整裁切</button><button type="button" data-mode="place" aria-pressed="false">版面位置</button></div>
        <p class="hint" data-help></p><div class="photo-crop-surface" tabindex="0" role="group" aria-label="拖曳調整照片裁切"><img draggable="false" alt="照片裁切預覽"></div>
        <div class="photo-placement-surface" hidden><div class="photo-placement-item" tabindex="0" role="group" aria-label="拖曳移動照片"><div class="photo-placement-clip"><img draggable="false" alt="照片版面位置預覽"></div><button type="button" class="photo-resize-handle" aria-label="拖曳調整照片大小"></button></div></div>
        <label data-zoom-label>縮放 <output data-zoom-value></output><input data-zoom type="range" min="100" max="300" step="1"></label>
        <label data-width-label hidden>照片寬度 <output data-width-value></output><input data-width type="range" min="25" max="100" step="1"></label>
        <p data-position class="hint" aria-live="polite"></p><p data-error class="error" role="alert"></p>
        <div class="actions"><button type="button" data-reset>還原位置與大小</button><button type="button" data-close>取消</button><button type="button" class="primary" data-apply>套用</button></div></div>`;
      document.body.append(dialog);
    }
    const $ = s => dialog.querySelector(s);
    let value = { position: config.position || 'center', fit: config.fit || 'cover', crop: model.normalizeCrop(config.crop), zoom: model.clamp(config.zoom, 1, 3, 1), placement: model.normalizePlacement(config.placement) };
    let draftPlacement = value.placement || model.normalizePlacement(placement) || { width: 100, x: 50, y: 0 }, mode = 'crop', drag = null, loaded = false;
    ratio = Number.isFinite(ratio) && ratio > 0 ? ratio : 4 / 3;
    const crop = $('.photo-crop-surface'), stage = $('.photo-placement-surface'), item = $('.photo-placement-item');
    const images = [...dialog.querySelectorAll('img')];
    crop.style.aspectRatio = String(ratio); $('.photo-placement-clip').style.aspectRatio = String(ratio);
    crop.style.maxWidth = `${55 * ratio}vh`; crop.style.marginInline = 'auto';
    stage.style.maxWidth = `${55 / (1 / ratio + .5)}vh`; stage.style.marginInline = 'auto';
    function update() {
      crop.hidden = mode !== 'crop'; stage.hidden = mode !== 'place'; $('[data-zoom-label]').hidden = mode !== 'crop'; $('[data-width-label]').hidden = mode !== 'place';
      for (const button of dialog.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
      for (const image of images) { image.style.objectFit = value.fit; image.style.objectPosition = model.imagePosition(value); image.style.transform = `scale(${value.zoom})`; image.style.transformOrigin = model.imagePosition(value); }
      $('[data-zoom]').value = Math.round(value.zoom * 100); $('[data-zoom-value]').textContent = `${Math.round(value.zoom * 100)}%`;
      $('[data-width]').value = draftPlacement.width; $('[data-width-value]').textContent = `${Math.round(draftPlacement.width)}%`;
      const width = stage.clientWidth;
      stage.style.height = `${width / ratio + width * .5}px`;
      item.style.width = `${draftPlacement.width}%`; item.style.left = `${(100 - draftPlacement.width) * draftPlacement.x / 100}%`; item.style.top = `${draftPlacement.y}%`;
      // Percent top offsets refer to stage height; use parent width for responsive spacing.
      item.style.top = `${width * draftPlacement.y / 100}px`;
      const focus = model.imageFocus(value);
      $('[data-position]').textContent = mode === 'crop' ? `裁切位置：水平 ${Math.round(focus.x)}% · 垂直 ${Math.round(focus.y)}%` : `版面位置：左右 ${Math.round(draftPlacement.x)}% · 上下 ${Math.round(draftPlacement.y)}%`;
      $('[data-help]').textContent = mode === 'crop' ? '直接拖動照片調整露出的範圍；可先放大，再拖曳。方向鍵可微調。' : '拖動照片調整區塊內的位置；拖動右下角可改變寬度。方向鍵可微調。';
    }
    function start(event) {
      if (!loaded || drag || event.button > 0) return;
      const surface = event.currentTarget; event.preventDefault();
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, focus: model.imageFocus(value), placement: { ...draftPlacement }, width: (mode === 'crop' ? crop : stage).clientWidth, height: crop.clientHeight, resize: !!event.target.closest('.photo-resize-handle') };
      try { surface.setPointerCapture(event.pointerId); } catch (_) {}
      surface.classList.add('is-dragging');
    }
    function move(event) {
      if (!drag || event.pointerId !== drag.id) return;
      event.preventDefault(); const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (mode === 'crop') value.crop = model.panCrop(drag.focus, dx, dy, drag.width, drag.height, images[0].naturalWidth, images[0].naturalHeight, value.zoom, value.fit);
      else {
        if (drag.resize) {
          const width = model.clamp(drag.placement.width + dx / drag.width * 100, 25, 100, 100), left = (100 - drag.placement.width) * drag.placement.x / 100;
          draftPlacement = model.normalizePlacement({ ...drag.placement, width, x: width < 100 ? left / (100 - width) * 100 : 50 });
        } else draftPlacement = model.panPlacement(drag.placement, dx, dy, drag.width);
        value.placement = { ...draftPlacement };
      }
      update();
    }
    function end(event) { if (drag && event.pointerId === drag.id) { drag = null; event.currentTarget.classList.remove('is-dragging'); } }
    for (const surface of [crop, item]) {
      surface.onpointerdown = start; surface.onpointermove = move; surface.onpointerup = end; surface.onpointercancel = end;
      surface.onkeydown = event => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
        event.preventDefault(); const amount = event.shiftKey ? 5 : 1, x = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0, y = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0;
        if (mode === 'crop') { const p = model.imageFocus(value); value.crop = model.normalizeCrop({ x: p.x + x, y: p.y + y }); }
        else { draftPlacement = model.normalizePlacement({ ...draftPlacement, x: draftPlacement.x + x, y: draftPlacement.y + y }); value.placement = { ...draftPlacement }; }
        update();
      };
    }
    for (const b of dialog.querySelectorAll('[data-mode]')) b.onclick = () => { mode = b.dataset.mode; update(); };
    $('[data-zoom]').oninput = event => { value.zoom = Number(event.target.value) / 100; update(); };
    $('[data-width]').oninput = event => { draftPlacement.width = Number(event.target.value); value.placement = { ...draftPlacement }; update(); };
    $('[data-reset]').onclick = () => { value = { ...value, position: 'center', crop: null, zoom: 1, placement: null }; draftPlacement = model.normalizePlacement(placement) || { width: 100, x: 50, y: 0 }; update(); };
    for (const b of dialog.querySelectorAll('[data-close]')) b.onclick = () => dialog.close();
    $('[data-apply]').disabled = true; $('[data-error]').textContent = '';
    $('[data-apply]').onclick = () => { onApply({ position: value.position, crop: value.crop, zoom: value.zoom, placement: value.placement }); dialog.close(); };
    images[0].onload = () => { loaded = true; $('[data-apply]').disabled = false; update(); };
    images[0].onerror = () => { loaded = false; $('[data-apply]').disabled = true; $('[data-error]').textContent = '照片無法載入，請確認照片網址。'; };
    for (const image of images) image.src = url;
    dialog.showModal(); update();
    if (images[0].complete && images[0].naturalWidth) { loaded = true; $('[data-apply]').disabled = false; }
  }
  window.HanaPhotoEditor = { open };
})();
