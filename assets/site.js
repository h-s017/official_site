document.addEventListener("DOMContentLoaded", () => {
  const heloriUrl = "https://helori.hanascent.com/";

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const style = document.createElement("style");
  style.textContent = `
    .nav-links{gap:16px;font-size:13px;}
    .nav-links a{white-space:nowrap;}
    .footer{
      margin-top:72px!important;
      border-top:1px solid #ffffff!important;
      box-shadow:0 -1px 0 var(--line);
    }
    main + .footer{display:block;}
    @media (max-width:1240px){.nav-links{gap:10px;font-size:12px}.nav-cta{padding:7px 10px!important}}
    @media (max-width:980px){.footer{margin-top:52px!important;}}
  `;
  document.head.appendChild(style);

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

  replaceText(document.body);

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
});
