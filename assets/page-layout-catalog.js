(function (root) {
  const pages = [
    ['/', '首頁'], ['/courses/', '調香課程總覽'], ['/overture-series/', '氣味藝術序曲系列'],
    ['/overture/', 'Vol. 1 一日專業調香師'], ['/accord-etude/', 'Vol. 2 調香師的和弦練習曲'],
    ['/KPIA/', 'KPIA 專業調香師課程'], ['/helori/', 'HELORI 香氣探索體驗'], ['/practice/', '氣味自修室'],
    ['/incubation/', '藝術育成'], ['/business/', '品牌合作'], ['/product-development/', '香氛產品開發'],
    ['/pif/', 'PIF 文件整合'], ['/h-fugue-atelier/', '氣味作品'], ['/journal/', '氣味誌'],
    ['/journal/all/', '氣味誌全部文章'], ['/projects/olfactory-culture/', '嗅覺文化'],
    ['/projects/scent-creation/', '氣味創作'], ['/projects/heart-village-notes/', '心村札記'],
    ['/news/', '最新消息'], ['/member/', '訂閱氣味通信'], ['/shop/', '商品'], ['/visit.html', '聯繫我們'],
    ['/business/inquiry/', '品牌合作洽詢'], ['/pif/inquiry/', 'PIF 服務洽詢'],
    ['/course-info/', '課程交易與履約資訊'], ['/terms/', '消費者權益與服務條款'],
    ['/privacy/', '隱私權政策'], ['/refund/', '退換貨與退款政策']
  ].map(([path, name]) => ({ path, name }));
  root.HanaLayoutPages = pages;
  if (typeof module === 'object' && module.exports) module.exports = pages;
})(typeof window === 'object' ? window : globalThis);
