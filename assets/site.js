document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const style = document.createElement("style");
  style.textContent = `
    .nav-links{gap:12px;font-size:12.5px;}
    .nav-links a{white-space:nowrap;}
    @media (max-width:1240px){.nav-links{gap:9px;font-size:12px}.nav-cta{padding:7px 10px!important}}
  `;
  document.head.appendChild(style);

  const nav = document.querySelector(".nav-links");

  function setText(href, label){
    const link = document.querySelector(`.nav-links a[href="${href}"]`);
    if (link) link.textContent = label;
  }

  function ensureLink(href, label, beforeHref){
    if (!nav || nav.querySelector(`a[href="${href}"]`)) return;
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    const before = nav.querySelector(`a[href="${beforeHref}"]`) || nav.querySelector(".nav-cta");
    if (before) nav.insertBefore(link, before);
    else nav.appendChild(link);
  }

  setText("experiences.html", "所有課程");
  setText("projects.html", "氣味誌");
  ensureLink("h-fugue-atelier.html", "H.FUGUE ATELIER", "about.html");
  ensureLink("about.html", "關於 HANA", "visit.html");
  ensureLink("student-tools.html", "學員工具", "visit.html");

  const path = window.location.pathname.split("/").pop() || "index.html";

  if (path === "experiences.html") {
    document.title = "所有課程｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "所有課程";
  }

  if (path === "projects.html") {
    document.title = "氣味誌｜HANA SCENT ARTIST";
    const h1 = document.querySelector(".page-hero h1");
    if (h1) h1.textContent = "氣味誌";
  }

  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
});
