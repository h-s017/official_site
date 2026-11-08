(() => {
  'use strict';
  const model = window.HanaHomeLayout, managed = new WeakMap();
  const style = document.createElement('style'); style.id = 'hana-photo-editor-styles';
  style.textContent = '.hana-photo-clip{display:block;position:relative;width:100%;overflow:hidden;min-width:0}.hana-photo-clip>img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;margin:0!important;display:block!important}@media(max-width:760px){.hana-photo-clip[data-photo-kind="hero"]{aspect-ratio:1!important}}';
  document.head.append(style);
  function restore(image) {
    const saved = managed.get(image); if (!saved) return;
    if (saved.clip.contains(image) && saved.clip.parentNode) saved.clip.replaceWith(image);
    if (saved.imageStyle === null) image.removeAttribute('style'); else image.setAttribute('style', saved.imageStyle);
    if (saved.target !== saved.clip) {
      if (saved.targetStyle === null) saved.target.removeAttribute('style'); else saved.target.setAttribute('style', saved.targetStyle);
      saved.target.removeAttribute('data-photo-placement-target');
    }
    image.removeEventListener('load', saved.onLoad); managed.delete(image);
  }
  function apply(image, config, options = {}) {
    if (!image || !model) return;
    restore(image);
    image.style.setProperty('object-position', model.imagePosition(config), 'important');
    if (!config.crop && !(config.zoom > 1) && !config.placement) return;
    const imageStyle = image.getAttribute('style'), rect = image.getBoundingClientRect(), computed = getComputedStyle(image);
    const clip = document.createElement('span'); clip.className = 'hana-photo-clip'; clip.dataset.photoKind = options.kind || 'original';
    const ratio = options.ratio || (options.kind === 'hero' ? (image.naturalWidth || image.width) / (image.naturalHeight || image.height) : rect.width / rect.height) || 4 / 3;
    clip.style.aspectRatio = String(ratio); clip.style.borderRadius = computed.borderRadius;
    clip.style.gridColumn = computed.gridColumn; clip.style.gridRow = computed.gridRow; clip.style.order = computed.order;
    clip.style.maxWidth = computed.maxWidth !== 'none' ? computed.maxWidth : rect.width > 0 && rect.width < image.parentElement.clientWidth - 1 ? `${rect.width}px` : 'none';
    const target = options.target || clip, targetStyle = target === clip ? null : target.getAttribute('style');
    image.before(clip); clip.append(image);
    for (const [key, value] of Object.entries({ width:'100%', height:'100%', position:'absolute', inset:'0', margin:'0', 'max-width':'none' })) image.style.setProperty(key, value, 'important');
    image.style.setProperty('object-fit', config.fit || 'cover', 'important');
    image.style.setProperty('transform', `scale(${model.clamp(config.zoom, 1, 3, 1)})`, 'important');
    image.style.setProperty('transform-origin', model.imagePosition(config), 'important');
    const placement = model.normalizePlacement(config.placement);
    if (placement) {
      target.dataset.photoPlacementTarget = '';
      target.style.setProperty('width', `${placement.width}%`, 'important');
      target.style.setProperty('max-width', '100%', 'important');
      target.style.setProperty('margin-left', `${(100 - placement.width) * placement.x / 100}%`, 'important'); target.style.setProperty('margin-right', '0', 'important');
      target.style.setProperty('margin-top', `${placement.y}%`, 'important');
      target.style.setProperty('position', 'relative', 'important'); target.style.setProperty('left', '0', 'important');
      target.style.setProperty('transform', 'none', 'important');
    }
    const onLoad = () => {
      if (!options.ratio && options.kind === 'hero' && image.naturalHeight) clip.style.aspectRatio = String(image.naturalWidth / image.naturalHeight);
    };
    managed.set(image, { clip, target, imageStyle, targetStyle, onLoad }); image.addEventListener('load', onLoad);
  }
  window.HanaLayoutPhoto = { apply, restore };
})();
