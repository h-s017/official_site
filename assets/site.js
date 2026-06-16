document.addEventListener("DOMContentLoaded", () => {
  const heloriUrl = "https://helori.hanascent.com/";

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const style = document.createElement("style");
  style.textContent = `
    .nav-links{gap:16px;font-size:13px;}
    .nav-links a{white-space:nowrap;}
    .mobile-note{cursor:pointer;user-select:none;letter-spacing:.18em;}
    .mobile-note:focus{outline:1px solid var(--black);outline-offset:4px;}
    .tc-number,
    .num,
    .counter,
    .course-meta,
    .meta-line,
    .fit-item,
    .detail-block p,
    .timeline-item b,
    .timeline-item span,
    .service-row b,
    .service-row span{
      font-family:"Noto Serif TC","Source Han Serif TC","Source Han Serif","Songti TC",serif!important;
    }
    .en-text{font-size:1.1em;}
    .btn,
    a.btn,
    button.btn,
    .btn.primary,
    .btn.light,
    .btn.light.primary,
    .btn.red{
      background:#ffffff!important;
      color:var(--black)!important;
      border:1px solid var(--black)!important;
      box-shadow:none!important;
      transform:none!important;
    }
    .btn:hover,
    a.btn:hover,
    button.btn:hover,
    .btn.primary:hover,
    .btn.light:hover,
    .btn.light.primary:hover,
    .btn.red:hover{
      background:var(--black)!important;
      color:#ffffff!important;
      border-color:var(--black)!important;
      transform:translateY(-1px)!important;
      box-shadow:none!important;
    }
    .dark-band .btn,
    .cta .btn{
      background:#ffffff!important;
      color:var(--black)!important;
      border-color:#ffffff!important;
    }
    .dark-band .btn:hover,
    .cta .btn:hover{
      background:var(--black)!important;
      color:#ffffff!important;
      border-color:#ffffff!important;
    }
    .dark-band .enroll-panel{
      border:0!important;
      outline:0!important;
      box-shadow:none!important;
      background:transparent!important;
      padding:0!important;
    }
    .footer{
      margin-top:72px!important;
      border-top:1px solid #ffffff!important;
      box-shadow:0 -1px 0 var(--line);
    }
    main + .footer{display:block;}
    @media (max-width:1240px){.nav-links{gap:10px;font-size:12px}.nav-cta{padding:7px 10px!important}}
    @media (max-width:980px){
      .footer{margin-top:52px!important;}
      .site-nav{align-items:flex-start;flex-wrap:wrap;}
      .mobile-note{display:block;font-size:12px;color:var(--gray500);padding:4px 0;}
      .nav-links{
        display:none!important;
        width:100%;
        flex-basis:100%;
        flex-direction:column;
        align-items:flex-start;
        gap:0!important;
        padding:18px 0 4px;
        margin-top:10px;
        border-top:1px solid var(--line);
        font-size:15px!important;
      }
      .site-nav.menu-open .nav-links{display:flex!important;}
      .nav-links a{
        width:100%;
        padding:12px 0;
        border-bottom:1px solid var(--line);
      }
      .nav-links a:last-child{border-bottom:none;}
    }
  `;
  document.head.appendChild(style);

  const siteNav = document.querySelector(".site-nav");
  const nav = document.querySelector(".nav-links");
  if (nav) {
    nav.innerHTML = `
      <a href="index.html">首頁</a>
      <a href="helori-scent-lab.html">Helori 香氣探索所</a>
      <a href="experiences.html">專業調香課程</a>
      <a href="scent-design.html">嗅覺設計服務</a>
      <a href="h-fugue-atelier.html">H.FUGUE ATELIER</a>
      <a href="projects.html">氣味誌</a>
      <a href="visit.html">聯繫我們</a>
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

    nav?.querySelectorAll("a").forEach((link) => {
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
  wrapNumbers(document.body);

  document.querySelectorAll("a").forEach((a) => {
    const label = a.textContent.trim();
    if (
      label.includes("心村限定｜Helori 香氣探索所") ||
      label.includes("心村限定｜Helori 香徑探索所") ||
      (a.classList.contains("red") && label.includes("心村限定"))
    ) {
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
    if (h1) h1.textContent = "專業調香課程";
  }

  if (path === "scent-design.html") {
    document.title = "嗅覺設計服務｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "嗅覺設計服務";
  }

  if (path === "projects.html") {
    document.title = "氣味誌｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "氣味誌";
  }

  if (path === "visit.html") {
    document.title = "聯繫我們｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "聯繫我們";
  }

  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  const typographyRoots = Array.from(document.querySelectorAll("header.hero, .page-hero, .course-hero, .helori-hero, main"));
  const textElements = [];
  const seen = new Set();

  typographyRoots.forEach((root) => {
    root.querySelectorAll("*").forEach((el) => {
      if (seen.has(el)) return;
      if (el instanceof SVGElement) return;
      if (el.classList?.contains("tc-number")) return;
      if (["SCRIPT", "STYLE", "IMG", "SVG", "PATH"].includes(el.tagName)) return;
      if (el.closest(".site-nav") || el.closest(".footer")) return;
      const hasDirectText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0);
      if (!hasDirectText) return;
      seen.add(el);
      textElements.push(el);
    });
  });

  const originalSizes = textElements.map((el) => [el, parseFloat(window.getComputedStyle(el).fontSize)]);
  originalSizes.forEach(([el, size]) => {
    if (!Number.isFinite(size) || size <= 0) return;
    el.style.fontSize = `${Math.round(size * 0.8 * 1000) / 1000}px`;
  });

  const contentSelectors = [
    "header.hero p:not(.eyebrow)",
    ".page-hero p:not(.kicker)",
    ".course-hero p:not(.kicker):not(.course-label):not(.course-quote):not(.subtitle):not(.en-title)",
    ".helori-hero .subtitle",
    "main p:not(.kicker):not(.course-label):not(.course-quote):not(.large-quote)",
    "main .lead",
    "main .card p",
    "main .course-card p",
    "main .course-meta",
    "main .meta-line",
    "main .fit-item",
    "main .detail-block p",
    "main .service-row span",
    "main .timeline-item span",
    "main .timeline-item b",
    "main li"
  ];
  const contentSeen = new Set();
  document.querySelectorAll(contentSelectors.join(",")).forEach((el) => {
    if (contentSeen.has(el)) return;
    if (el.closest(".site-nav") || el.closest(".footer")) return;
    contentSeen.add(el);
    const size = parseFloat(el.style.fontSize || window.getComputedStyle(el).fontSize);
    if (!Number.isFinite(size) || size <= 0) return;
    el.style.fontSize = `${Math.round(size * 1.05 * 1000) / 1000}px`;
  });

  if (path === "index.html") {
    document.querySelectorAll("main .dark-band .service-row b, main .dark-band .service-row span").forEach((el) => {
      const size = parseFloat(el.style.fontSize || window.getComputedStyle(el).fontSize);
      if (!Number.isFinite(size) || size <= 0) return;
      el.style.fontSize = `${Math.round(size * 1.1 * 1000) / 1000}px`;
    });
  }

  wrapEnglish(document.body);
});
