document.addEventListener("DOMContentLoaded", () => {
  const heloriUrl = "https://helori.hanascent.com/";

  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  const style = document.createElement("style");
  style.textContent = `
    :root{
      --hana-page-hero-y:65px;
      --hana-page-hero-bottom:49px;
      --hana-section-y:78px;
      --hana-section-head-gap:42px;
      --hana-section-head-bottom:36px;
      --hana-wrap:1180px;
    }

    body{
      font-family:var(--font-serif)!important;
      line-height:1.76!important;
      letter-spacing:.032em!important;
    }

    .wrap{max-width:var(--hana-wrap)!important;margin-left:auto!important;margin-right:auto!important;}
    section{padding-top:var(--hana-section-y)!important;padding-bottom:var(--hana-section-y)!important;}

    .site-nav{align-items:center;}
    .nav-links{gap:16px;font-size:13px;align-items:center;}
    .nav-links a{white-space:nowrap;}
    .nav-dropdown{position:relative;display:inline-flex;align-items:center;height:34px;}
    .nav-drop-button{display:inline-flex;align-items:center;height:34px;padding:0 0 9px;margin:0;border:0;border-bottom:1px solid transparent;background:transparent;color:inherit;font:inherit;font-size:inherit;letter-spacing:inherit;cursor:pointer;white-space:nowrap;}
    .nav-drop-button::after{content:"▾";font-size:10px;margin-left:6px;letter-spacing:0;}
    .nav-dropdown:hover .nav-drop-button,.nav-dropdown:focus-within .nav-drop-button{border-color:var(--black);}
    .nav-dropdown-menu{position:absolute;top:100%;left:0;min-width:190px;padding:8px 0;background:#fff;border:1px solid var(--line);box-shadow:0 12px 32px rgba(0,0,0,.07);opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease,visibility .2s ease;z-index:20;}
    .nav-dropdown:hover .nav-dropdown-menu,.nav-dropdown:focus-within .nav-dropdown-menu{opacity:1;visibility:visible;transform:translateY(0);}
    .nav-dropdown-menu a{display:block!important;width:100%;height:auto!important;padding:10px 16px!important;border:0!important;line-height:1.6!important;white-space:nowrap!important;}
    .nav-dropdown-menu a:hover{background:var(--gray100);}
    .mobile-note{cursor:pointer;user-select:none;letter-spacing:.18em;}
    .mobile-note:focus{outline:1px solid var(--black);outline-offset:4px;}

    .tc-number,.num,.counter,.course-meta,.meta-line,.fit-item,.detail-block p,.timeline-item b,.timeline-item span,.service-row b,.service-row span{
      font-family:"Noto Serif TC","Source Han Serif TC","Source Han Serif","Songti TC",serif!important;
    }
    .en-text{font-size:1.03em;}

    .page-hero,.helori-hero,.course-hero{
      padding:var(--hana-page-hero-y) 6vw var(--hana-page-hero-bottom)!important;
      background:#ffffff!important;
      border-bottom:1px solid var(--line)!important;
      text-align:center!important;
    }
    .journal-hero{border-bottom:none!important;}
    .page-hero .wrap,.helori-hero .wrap,.course-hero .wrap{
      max-width:820px!important;
      margin:0 auto!important;
      text-align:center!important;
      display:block!important;
    }

    .eyebrow,.kicker,.page-hero .kicker,.helori-hero .kicker,.course-hero .kicker{
      margin:0 0 14px!important;
      color:var(--gray500)!important;
      letter-spacing:.22em!important;
      text-transform:uppercase!important;
      font-size:13px!important;
      line-height:1.7!important;
      font-weight:500!important;
      font-family:"Cormorant Garamond","Noto Serif TC","Source Han Serif TC",serif!important;
    }
    .page-hero .kicker,.helori-hero .kicker,.course-hero .kicker{margin-bottom:18px!important;letter-spacing:.26em!important;}

    .hero-title{
      font-size:clamp(32px,4.1vw,64px)!important;
      line-height:1.02!important;
      letter-spacing:.15em!important;
      margin:0 0 14px!important;
      font-weight:500!important;
      font-family:var(--font-serif)!important;
    }
    .hero-title span{
      display:block!important;
      font-size:clamp(20px,2.25vw,30px)!important;
      line-height:1.24!important;
      letter-spacing:.21em!important;
      margin-top:14px!important;
      font-weight:500!important;
    }

    .page-hero h1,.helori-hero h1,.course-hero h1{
      margin:0 auto 20px!important;
      max-width:820px!important;
      font-family:var(--font-serif)!important;
      font-size:clamp(32px,4.1vw,64px)!important;
      line-height:1.14!important;
      letter-spacing:.115em!important;
      font-weight:500!important;
      color:var(--black)!important;
      text-align:center!important;
    }

    .page-hero h2,.helori-hero h2,.course-hero h2,.helori-hero .subtitle,.course-hero .subtitle{
      max-width:760px!important;
      margin-left:auto!important;
      margin-right:auto!important;
      text-align:center!important;
      font-family:var(--font-serif)!important;
      font-size:clamp(20px,2.25vw,30px)!important;
      line-height:1.45!important;
      letter-spacing:.14em!important;
      color:var(--black)!important;
      font-weight:500!important;
    }
    .page-hero p:not(.kicker),.helori-hero p:not(.kicker),.course-hero p:not(.kicker){
      max-width:720px!important;
      margin-left:auto!important;
      margin-right:auto!important;
      color:var(--gray700)!important;
      font-size:17px!important;
      line-height:1.82!important;
      letter-spacing:.05em!important;
      font-weight:400!important;
    }

    h1,h2,h3,p{overflow-wrap:anywhere;}
    h2,main h2,.section-head h2{
      margin:0!important;
      font-size:clamp(26px,2.8vw,40px)!important;
      line-height:1.28!important;
      letter-spacing:.12em!important;
      font-weight:500!important;
      font-family:var(--font-serif)!important;
    }
    h3,main h3,.card h3,.project-card h3,.course-card h3,.helori-card h3,.detail-block h3{
      margin:0 0 10px!important;
      font-size:22px!important;
      line-height:1.36!important;
      letter-spacing:.12em!important;
      font-weight:500!important;
      font-family:var(--font-serif)!important;
    }
    p,main p,.lead,.card p,.project-card p,.course-card p,.helori-card p,.detail-block p,.notice p,main li{
      font-size:17px!important;
      line-height:1.78!important;
      letter-spacing:.032em!important;
      font-weight:400!important;
      font-family:var(--font-serif)!important;
    }
    .lead{margin:14px 0 0!important;color:var(--gray700)!important;max-width:720px!important;}

    .section-head{
      display:grid!important;
      grid-template-columns:minmax(160px,.32fr) 1fr!important;
      gap:var(--hana-section-head-gap)!important;
      align-items:start!important;
      margin-bottom:var(--hana-section-head-bottom)!important;
    }
    .grid3,.grid2{gap:18px!important;}
    .card,.project-card,.course-card,.notice,.form-card,.helori-card,.detail-block{padding:26px!important;border:1px solid var(--line);}
    .project-card,.course-card,.card{min-height:230px!important;}

    .text-link,a.text-link{
      display:inline-block!important;
      width:max-content!important;
      margin-top:22px!important;
      border-bottom:1px solid currentColor!important;
      font-size:13.5px!important;
      line-height:1.8!important;
      letter-spacing:.15em!important;
    }

    .hero-actions,.actions{display:flex!important;gap:12px!important;flex-wrap:wrap!important;}
    .helori-hero .actions,.page-hero .actions,.course-hero .actions{justify-content:center!important;margin-top:30px!important;}
    .btn,a.btn,button.btn,.btn.primary,.btn.light,.btn.light.primary,.btn.red{
      min-height:44px!important;
      padding:11px 18px!important;
      background:#ffffff!important;
      color:var(--black)!important;
      border:1px solid var(--black)!important;
      box-shadow:none!important;
      transform:none!important;
      font-size:14px!important;
      letter-spacing:.12em!important;
    }
    .btn:hover,a.btn:hover,button.btn:hover,.btn.primary:hover,.btn.light:hover,.btn.light.primary:hover,.btn.red:hover{
      background:var(--black)!important;
      color:#ffffff!important;
      border-color:var(--black)!important;
      transform:translateY(-1px)!important;
      box-shadow:none!important;
    }
    .dark-band .btn,.cta .btn{background:#ffffff!important;color:var(--black)!important;border-color:#ffffff!important;}
    .dark-band .btn:hover,.cta .btn:hover{background:var(--black)!important;color:#ffffff!important;border-color:#ffffff!important;}

    .linked-hover-card,.news-row:has(a[href]),.card:has(a[href]),.project-card:has(a[href]),.course-card:has(a[href]),.notice:has(a[href]){
      transition:background-color .28s ease,border-color .28s ease,box-shadow .28s ease!important;
    }
    .linked-hover-card:hover,.linked-hover-card:focus-within,.news-row:has(a[href]):hover,.news-row:has(a[href]):focus-within,.card:has(a[href]):hover,.card:has(a[href]):focus-within,.project-card:has(a[href]):hover,.project-card:has(a[href]):focus-within,.course-card:has(a[href]):hover,.course-card:has(a[href]):focus-within,.notice:has(a[href]):hover,.notice:has(a[href]):focus-within{
      background:var(--gray100)!important;
      border-color:var(--gray300)!important;
    }
    .card:has(a[href]):hover,.card:has(a[href]):focus-within,.project-card:has(a[href]):hover,.project-card:has(a[href]):focus-within,.course-card:has(a[href]):hover,.course-card:has(a[href]):focus-within,.notice:has(a[href]):hover,.notice:has(a[href]):focus-within{box-shadow:0 12px 32px rgba(0,0,0,.05)!important;}

    .dark-band .enroll-panel{border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;padding:0!important;}
    .footer{margin-top:60px!important;border-top:1px solid #ffffff!important;box-shadow:0 -1px 0 var(--line);}
    main + .footer{display:block;}

    @media (prefers-reduced-motion:reduce){.linked-hover-card,.news-row:has(a[href]),.card:has(a[href]),.project-card:has(a[href]),.course-card:has(a[href]),.notice:has(a[href]){transition:none!important;}}
    @media (max-width:1240px){.nav-links{gap:10px;font-size:12px;}.nav-cta{padding:7px 10px!important;}}
    @media (max-width:980px){
      :root{--hana-page-hero-y:72px;--hana-page-hero-bottom:58px;--hana-section-y:62px;--hana-section-head-gap:20px;--hana-section-head-bottom:28px;}
      .page-hero,.helori-hero,.course-hero{padding:var(--hana-page-hero-y) 22px var(--hana-page-hero-bottom)!important;}
      .page-hero h1,.helori-hero h1,.course-hero h1{font-size:clamp(34px,9vw,48px)!important;line-height:1.22!important;}
      .page-hero h2,.helori-hero h2,.course-hero h2,.helori-hero .subtitle,.course-hero .subtitle{font-size:clamp(21px,5.6vw,30px)!important;line-height:1.45!important;}
      .page-hero p:not(.kicker),.helori-hero p:not(.kicker),.course-hero p:not(.kicker){font-size:16px!important;line-height:1.85!important;}
      h2,main h2,.section-head h2{font-size:clamp(25px,6.4vw,34px)!important;}
      h3,main h3,.card h3,.project-card h3,.course-card h3,.helori-card h3,.detail-block h3{font-size:21px!important;}
      p,main p,.lead,.card p,.project-card p,.course-card p,.helori-card p,.detail-block p,.notice p,main li{font-size:16px!important;}
      .section-head{grid-template-columns:1fr!important;}
      .footer{margin-top:44px!important;}
      .site-nav{align-items:flex-start;flex-wrap:wrap;}
      .mobile-note{display:block;font-size:12px;color:var(--gray500);padding:4px 0;}
      .nav-links{display:none!important;width:100%;flex-basis:100%;flex-direction:column;align-items:flex-start;gap:0!important;padding:18px 0 4px;margin-top:10px;border-top:1px solid var(--line);font-size:15px!important;}
      .site-nav.menu-open .nav-links{display:flex!important;}
      .nav-links a,.nav-drop-button{width:100%;height:auto!important;padding:12px 0!important;border-bottom:1px solid var(--line);justify-content:flex-start;text-align:left;}
      .nav-links a:last-child{border-bottom:none;}
      .nav-dropdown{display:block;width:100%;height:auto;}
      .nav-dropdown-menu{position:static;display:block;min-width:0;width:100%;padding:0 0 0 18px;border:0;box-shadow:none;opacity:1;visibility:visible;transform:none;}
      .nav-dropdown-menu a{padding:10px 0!important;font-size:14px!important;color:var(--gray700)!important;}
    }
  `;
  document.head.appendChild(style);

  const siteNav = document.querySelector(".site-nav");
  const nav = document.querySelector(".nav-links");
  if (nav) {
    nav.innerHTML = `
      <a href="/ciyu.html">此域</a>
      <a href="/h-fugue-atelier.html">H.FUGUE ATELIER</a>
      <div class="nav-dropdown">
        <button class="nav-drop-button" type="button" aria-haspopup="true">調香課程</button>
        <div class="nav-dropdown-menu" role="menu">
          <a href="/helori/">調香體驗探索</a>
          <a href="/overture/">藝術調香師</a>
          <a href="/courses/">KPIA</a>
        </div>
      </div>
      <a href="/scent-design.html">企業品牌合作</a>
      <a href="/projects.html">氣味誌</a>
    `;
  }

  const mobileMenu = document.querySelector(".mobile-note");
  if (siteNav && mobileMenu) {
    mobileMenu.setAttribute("role", "button");
    mobileMenu.setAttribute("tabindex", "0");
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "開啟導覽選單");
    const toggleMenu = () => {
      const isOpen = siteNav.classList.toggle("menu-open");
      mobileMenu.textContent = isOpen ? "CLOSE" : "MENU";
      mobileMenu.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.setAttribute("aria-label", isOpen ? "關閉導覽選單" : "開啟導覽選單");
    };
    mobileMenu.addEventListener("click", toggleMenu);
    mobileMenu.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleMenu();
      }
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        siteNav.classList.remove("menu-open");
        mobileMenu.textContent = "MENU";
        mobileMenu.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-label", "開啟導覽選單");
      });
    });
  }

  function replaceText(node){
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = node.nodeValue
        .replaceAll("心村限定｜Helori 香徑探索所", "心村限定｜Helori 香氣探索所")
        .replaceAll("Helori香徑探索課", "Helori香氣探索課")
        .replaceAll("Helori 香徑探索", "Helori 香氣探索")
        .replaceAll("所有課程", "專業調香課程")
        .replaceAll("調香藝術課程", "專業調香課程")
        .replaceAll("氣味設計服務線", "嗅覺設計服務線")
        .replaceAll("氣味設計", "嗅覺設計服務");
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE && !["SCRIPT", "STYLE"].includes(node.tagName)) {
      node.childNodes.forEach(replaceText);
    }
  }

  function wrapNumbers(node){
    if (node.nodeType === Node.TEXT_NODE) {
      if (!/[0-9０-９]/.test(node.nodeValue)) return;
      const parent = node.parentNode;
      if (!parent || parent.classList?.contains("tc-number")) return;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION"].includes(parent.tagName)) return;
      const parts = node.nodeValue.split(/([0-9０-９]+)/g);
      const fragment = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^[0-9０-９]+$/.test(part)) {
          const span = document.createElement("span");
          span.className = "tc-number";
          span.textContent = part;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      parent.replaceChild(fragment, node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION"].includes(node.tagName)) return;
      if (node.classList?.contains("tc-number")) return;
      Array.from(node.childNodes).forEach(wrapNumbers);
    }
  }

  function wrapEnglish(node){
    if (node.nodeType === Node.TEXT_NODE) {
      if (!/[A-Za-z]/.test(node.nodeValue)) return;
      const parent = node.parentNode;
      if (!parent || parent.classList?.contains("en-text") || parent.classList?.contains("tc-number")) return;
      const parts = node.nodeValue.split(/([A-Za-z][A-Za-z.'’&/| -]*[A-Za-z]|[A-Za-z])/g);
      const fragment = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/[A-Za-z]/.test(part)) {
          const span = document.createElement("span");
          span.className = "en-text";
          span.textContent = part;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      parent.replaceChild(fragment, node);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION"].includes(node.tagName)) return;
      if (node.classList?.contains("en-text") || node.classList?.contains("tc-number")) return;
      Array.from(node.childNodes).forEach(wrapEnglish);
    }
  }

  replaceText(document.body);

  document.querySelectorAll("a").forEach((a) => {
    const label = a.textContent.trim();
    if (label.includes("心村限定｜Helori 香氣探索所") || label.includes("心村限定｜Helori 香徑探索所") || (a.classList.contains("red") && label.includes("心村限定"))) {
      a.href = heloriUrl;
    }
  });

  const path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "helori-scent-lab.html") {
    document.title = "Helori 香氣探索所｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1, .helori-hero h1");
    if (h1 && !h1.innerHTML.includes("Helori")) h1.textContent = "Helori 香氣探索所";
  }
  if (path === "experiences.html") {
    document.title = "專業調香課程｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.innerHTML = "HANA SCENT ARTIST<br>專業調香課程系列";
  }
  if (path === "scent-design.html") {
    document.title = "企業品牌合作｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "企業品牌合作";
  }
  if (path === "projects.html") {
    document.title = "氣味誌｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "氣味誌";
  }
  if (path === "ciyu.html") {
    document.title = "此域｜HANA SCENT ARTIST";
  }
  if (path === "visit.html") {
    document.title = "聯繫我們｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "聯繫我們";
  }

  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || href === `/${path}` || (window.location.pathname !== "/" && href === window.location.pathname)) a.classList.add("active");
  });

  wrapNumbers(document.body);
  wrapEnglish(document.body);

  if (!window.location.pathname.startsWith('/admin')) {
    const tracker = document.createElement('script');
    tracker.src = '/assets/page-views.js';
    tracker.defer = true;
    document.body.appendChild(tracker);
  }
});