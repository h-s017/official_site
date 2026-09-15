(() => {
  'use strict';

  if (document.querySelector('script[type="application/ld+json"]')) return;
  if (/noindex/i.test(document.querySelector('meta[name="robots"]')?.content || '')) return;

  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (!canonical) return;

  const canonicalUrl = new URL(canonical);
  const path = canonicalUrl.pathname;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const pageMap = {
    '/overture-series/': { type: 'CollectionPage', name: '氣味藝術序曲系列', parent: ['調香課程', 'https://hanascent.com/courses/'] },
    '/practice/': { type: 'WebPage', name: '氣味自修室', parent: ['調香課程', 'https://hanascent.com/courses/'], service: '氣味自修室' },
    '/helori/': { type: 'WebPage', name: 'HELORI 香氣探索體驗', parent: ['調香課程', 'https://hanascent.com/courses/'], service: 'HELORI 香氣探索體驗' },
    '/h-fugue-atelier/': { type: 'CollectionPage', name: '氣味作品' },
    '/news/': { type: 'CollectionPage', name: '最新消息' },
    '/ciyu/programs/': { type: 'CollectionPage', name: '中心新村演出節目', parent: ['此域 Hineni', 'https://hanascent.com/ciyu/'] },
    '/projects/olfactory-culture/': { type: 'CollectionPage', name: '嗅覺文化', parent: ['氣味誌', 'https://hanascent.com/journal/'] },
    '/projects/scent-creation/': { type: 'CollectionPage', name: '氣味創作', parent: ['氣味誌', 'https://hanascent.com/journal/'] },
    '/projects/heart-village-notes/': { type: 'CollectionPage', name: '心村札記', parent: ['氣味誌', 'https://hanascent.com/journal/'] },
    '/member/': { type: 'WebPage', name: '訂閱氣味通信' },
    '/shop/': { type: 'CollectionPage', name: '商品' },
    '/student-tools/': { type: 'CollectionPage', name: '學員工具' },
    '/visit.html': { type: 'ContactPage', name: '聯繫我們' }
  };
  const page = pageMap[path];
  if (!page) return;

  const webpageId = `${canonical}#webpage`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: '首頁', item: 'https://hanascent.com/' }
  ];
  if (page.parent) {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: page.parent[0], item: page.parent[1] });
  }
  breadcrumbs.push({ '@type': 'ListItem', position: breadcrumbs.length + 1, name: page.name, item: canonical });

  const webPage = {
    '@type': page.type,
    '@id': webpageId,
    url: canonical,
    name: document.title,
    description,
    isPartOf: { '@id': 'https://hanascent.com/#website' },
    about: { '@id': 'https://hanascent.com/#organization' },
    breadcrumb: { '@id': breadcrumbId },
    inLanguage: 'zh-Hant'
  };
  const graph = [
    webPage,
    { '@type': 'BreadcrumbList', '@id': breadcrumbId, itemListElement: breadcrumbs }
  ];

  if (page.service) {
    const serviceId = `${canonical}#service`;
    webPage.mainEntity = { '@id': serviceId };
    graph.push({
      '@type': 'Service',
      '@id': serviceId,
      url: canonical,
      name: page.service,
      description,
      provider: { '@type': 'Organization', '@id': 'https://hanascent.com/#organization', name: 'HANA SCENT ARTIST', url: 'https://hanascent.com/' }
    });
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'hana-page-schema';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
})();
