(() => {
  'use strict';
  const semantics = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,label,legend,summary,td,th,a,button';
  const excluded = 'script,style,noscript,svg,canvas,textarea,select,option,template,[aria-hidden="true"],[role="status"],[role="alert"],[aria-live],[data-year]';
  const cosmetic = '.en-text,.tc-number';
  const hash = str => { let n = 2166136261; for (const c of str) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); } return (n >>> 0).toString(36); };
  const compact = value => value.replace(/\s+/g, ' ').trim();
  function address(element, root) {
    const parts = [];
    while (element && element !== root) {
      if (!element.matches(cosmetic)) {
        const siblings = [...element.parentElement.children].filter(x => !x.matches(cosmetic));
        parts.unshift(element.tagName + ':' + siblings.indexOf(element));
      }
      element = element.parentElement;
    }
    return parts.join('/');
  }
  function capture(root, { dynamic = false } = {}) {
    const groups = new Map(), bindings = [], fields = [], used = new Set();
    function add(kind, element, label, value, extra) {
      let id = `${kind}-${hash(address(element, root))}`;
      while (used.has(id)) id += '-x'; used.add(id);
      const field = { id, kind, label, value, heading: /^H[1-6]$/.test(element.tagName), tag: element.tagName };
      fields.push(field); bindings.push({ ...extra, element, field });
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (parent.closest(excluded) || parent.closest('article[data-hana-announcement]')) continue;
      if (dynamic && (!parent.closest('h1,h2,h3,h4,h5,h6') || parent.closest('article'))) continue;
      let owner = parent.closest(semantics);
      if (!owner || !root.contains(owner)) owner = parent;
      if (owner.matches('a') && owner.querySelector('h1,h2,h3,p,div')) owner = parent;
      const blockSpan = parent.closest('span.about-role-en,span.hero-place,span.hero-line');
      if (blockSpan && root.contains(blockSpan)) owner = blockSpan;
      while (owner !== root && owner.matches(cosmetic)) owner = owner.parentElement;
      if (!groups.has(owner)) groups.set(owner, []);
      groups.get(owner).push(node);
    }
    const kinds = { H1:'頁面標題', H2:'區塊標題', H3:'小標題', H4:'小標題', P:'內文', LI:'清單項目',
      A:'連結文字', BUTTON:'按鈕文字', LABEL:'表單欄位名稱', LEGEND:'表單說明', SUMMARY:'展開標題', TD:'表格內容', TH:'表格標題' };
    for (const [element, nodes] of groups) {
      let raw = '';
      for (let i = 0; i < nodes.length; i++) {
        if (i) {
          const range = document.createRange(); range.setStartAfter(nodes[i - 1]); range.setEndBefore(nodes[i]);
          if (range.cloneContents().querySelector('br')) raw += '\n';
        }
        raw += nodes[i].data.replace(/\s+/g, ' ');
      }
      const value = raw.split('\n').map(compact).filter(Boolean).join('\n');
      if (!value) continue;
      add('text', element, `${kinds[element.tagName] || '文字'}｜${value.slice(0, 40)}`, value,
        { nodes: nodes.map(n => ({ node: n, value: n.data })), whiteSpace: element.style.getPropertyValue('white-space'),
          whiteSpacePriority: element.style.getPropertyPriority('white-space'), breaks: [...element.querySelectorAll('br')].map(br => ({ br, style: br.getAttribute('style') })) });
    }
    if (!dynamic) {
      for (const a of root.querySelectorAll('a[href]')) {
        if (a.closest(excluded)) continue;
        add('href', a, `連結網址｜${compact(a.textContent).slice(0, 40) || a.getAttribute('aria-label') || '圖片連結'}`, a.getAttribute('href'), { attribute: 'href' });
      }
      for (const input of root.querySelectorAll('input[placeholder]:not([type=password]):not([type=hidden]),textarea[placeholder]')) {
        add('placeholder', input, `輸入提示｜${input.getAttribute('placeholder').slice(0, 40)}`, input.getAttribute('placeholder'), { attribute: 'placeholder' });
      }
    }
    function restore() {
      for (const b of bindings) {
        if (b.nodes) {
          for (const n of b.nodes) if (n.node.data !== n.value) n.node.data = n.value;
          if (b.whiteSpace) b.element.style.setProperty('white-space', b.whiteSpace, b.whiteSpacePriority); else b.element.style.removeProperty('white-space');
          for (const x of b.breaks) { if (x.style === null) x.br.removeAttribute('style'); else x.br.setAttribute('style', x.style); }
        } else b.element.setAttribute(b.attribute, b.field.value);
      }
    }
    function apply(value) {
      restore();
      const copy = window.HanaHomeLayout.sanitizeCopy(value, fields);
      for (const b of bindings) {
        if (!Object.hasOwn(copy, b.field.id)) continue;
        const value = copy[b.field.id];
        if (b.nodes) {
          b.nodes.forEach((n, i) => { n.node.data = i === 0 ? value : ''; });
          b.element.style.setProperty('white-space', 'pre-line');
          for (const x of b.breaks) x.br.style.setProperty('display', 'none', 'important');
        } else if (b.attribute === 'href' && value === '') b.element.removeAttribute('href');
        else b.element.setAttribute(b.attribute, value);
      }
    }
    return { fields, apply, restore };
  }
  // The existing site script wraps Latin text and numbers, then updates homepage copy.
  // Capture the resulting native text nodes after those startup steps have completed.
  const ready = new Promise(resolve => {
    if (document.readyState === 'complete') setTimeout(resolve, 0);
    else document.addEventListener('DOMContentLoaded', () => setTimeout(resolve, 0), { once: true });
  });
  window.HanaLayoutText = { capture, ready };
})();
