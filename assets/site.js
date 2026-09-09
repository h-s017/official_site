(() => {
  const coreSrc = "/assets/site-core.js?v=20260906-footer-global";

  const installGlobalStyle = () => {
    if (document.getElementById("hana-global-20260910")) return;
    const style = document.createElement("style");
    style.id = "hana-global-20260910";
    style.textContent = `
      .nav-links a[href="/h-fugue-atelier/"],.nav-links a[href="/news/"]{display:none!important;}
      .nav-dropdown-menu{min-width:330px!important;}
      .nav-group-label{display:block;padding:10px 16px 7px;color:var(--gray500);font-size:12px;letter-spacing:.14em;line-height:1.5;border-top:1px solid var(--line);margin-top:4px;}
      .nav-dropdown-menu .nav-subitem{padding-left:34px!important;}
      .nav-dropdown-menu .nav-subitem strong{font-weight:500;}
      .footer-grid{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(180px,.75fr) minmax(200px,.8fr)!important;column-gap:clamp(42px,6vw,96px)!important;row-gap:0!important;align-items:start!important;}
      .footer-col{min-width:0;}.footer-brand-col{line-height:1.85!important}.footer-brand-title{display:block;margin-bottom:24px}.footer-brand-meta{display:block;margin-bottom:24px}.footer-brand-copy{display:block;margin-bottom:24px}
      .footer-social-col{display:flex!important;align-items:flex-start!important;justify-content:flex-start!important;text-align:left!important;padding:4px 0 0!important}.footer-social-links{display:flex;align-items:center;gap:20px;flex-wrap:wrap}.footer-social-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:30px;height:30px;border:0!important}.footer-social-link img{display:block;width:26px;height:26px;object-fit:contain}.footer-right-col .footer-actions{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:11px!important}.footer-right-col .footer-action{display:inline!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important;box-shadow:none!important;text-decoration:none!important}.footer-bottom{grid-column:1/-1;display:flex;justify-content:space-between;gap:24px;margin-top:42px;padding-top:18px;border-top:1px solid var(--line);color:var(--gray500);font-size:12px}.footer-legal{text-align:right}
      @media(max-width:900px){.footer-grid{grid-template-columns:minmax(0,1.25fr) minmax(160px,.75fr)!important;column-gap:42px!important;row-gap:34px!important}.footer-right-col{grid-column:2;grid-row:1}.footer-social-col{grid-column:1/-1;grid-row:2}.footer-bottom{grid-row:3}}
      @media(max-width:760px){.footer-grid{display:block!important}.footer-brand-col,.footer-social-col,.footer-right-col{margin:0 0 30px!important}.footer-bottom{display:block;margin-top:10px}.footer-legal{text-align:left;margin-top:8px}.nav-dropdown-menu{min-width:min(330px,88vw)!important}}
    `;
    document.head.appendChild(style);
  };

  const arrangeHomepageSections = () => {
    const isHomepage = window.location.pathname === "/" || window.location.pathname === "/index.html";
    if (!isHomepage) return;
    const news = document.querySelector("main .home-news");
    const about = document.querySelector("main .home-about");
    if (news && about && about.nextElementSibling !== news) about.insertAdjacentElement("afterend", news);
  };

  const renderNavigation = () => {
    const nav = document.querySelector(".nav-links");
    const siteNav = document.querySelector(".site-nav");
    const mobileMenu = document.querySelector(".mobile-note");
    if (!nav) return;
    nav.innerHTML = `
      <a href="/">首頁</a>
      <a href="/ciyu/">此域 HINENI</a>
      <div class="nav-dropdown">
        <button class="nav-drop-button" type="button" aria-haspopup="true" aria-expanded="false">調香課程</button>
        <div class="nav-dropdown-menu" role="menu">
          <span class="nav-group-label">氣味藝術序曲系列</span>
          <a class="nav-subitem" href="/overture/"><strong>Vol. 1</strong>　一日專業調香師</a>
          <a class="nav-subitem" href="/accord-etude/"><strong>Vol. 2</strong>　調香師的和弦練習曲</a>
          <a class="nav-subitem" href="/practice/"><strong>Vol. 0</strong>　氣味自修室</a>
          <a href="/helori/">Helori 香氣探索所體驗課程</a>
          <a href="/KPIA/">KPIA</a>
        </div>
      </div>
      <a href="/business/">企業品牌合作</a>
      <a href="/journal/">氣味誌</a>
    `;

    const dropdown = nav.querySelector(".nav-dropdown");
    const button = nav.querySelector(".nav-drop-button");
    button?.addEventListener("click", (event) => {
      if (!window.matchMedia("(max-width:980px)").matches) return;
      event.preventDefault();
      const open = dropdown.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href");
      const path = window.location.pathname;
      if ((href === "/" && (path === "/" || path === "/index.html")) || (href !== "/" && path.startsWith(href))) link.classList.add("active");
      link.addEventListener("click", () => {
        siteNav?.classList.remove("menu-open");
        dropdown?.classList.remove("is-open");
        button?.setAttribute("aria-expanded","false");
        if (mobileMenu) { mobileMenu.textContent = "MENU"; mobileMenu.setAttribute("aria-expanded","false"); }
      });
    });
  };

  const renderFooter = () => {
    const footerGrid = document.querySelector(".footer-grid");
    if (!footerGrid) return;
    const isCiyuPage = /^\/ciyu(?:\/|\/index\.html)?$/.test(window.location.pathname);
    const addressBlock = isCiyuPage ? `<div style="margin-bottom:20px">台北市北投區新民路42號<br><a href="https://www.beitouheartvillage.taipei/" target="_blank" rel="noopener">北投中心新村</a> D1區C棟</div>` : "";
    footerGrid.innerHTML = `
      <div class="footer-col footer-brand-col"><b class="footer-brand-title">HANA SCENT ARTIST</b><span class="footer-brand-meta">Olfactory Artist｜Founder &amp; Perfumer</span><span class="footer-brand-copy">以氣味譜寫無形的感官旋律</span>氣味品牌顧問｜專業調香課程<br>藝術駐村計畫　<a href="/ciyu/">此域</a></div>
      <div class="footer-col footer-social-col"><div class="footer-social-links"><a class="footer-social-link" href="https://www.instagram.com/hanas.scent/" target="_blank" rel="noopener" aria-label="Instagram"><img src="/assets/footer-instagram.svg" alt=""></a><a class="footer-social-link" href="https://www.facebook.com/Hanas017" target="_blank" rel="noopener" aria-label="Facebook"><img src="/assets/footer-facebook.svg" alt=""></a><a class="footer-social-link" href="https://lin.ee/OI4bzr1" target="_blank" rel="noopener" aria-label="官方 LINE"><img src="/assets/footer-line.svg" alt=""></a><a class="footer-social-link" href="mailto:hanascent@gmail.com" aria-label="Email"><img src="/assets/footer-email.svg" alt=""></a></div></div>
      <div class="footer-col footer-right-col">${addressBlock}<div class="footer-actions"><a class="footer-action" href="https://reservation.hanascent.com/">預約課程</a><a class="footer-action" href="/member/">訂閱氣味通信</a><a class="footer-action" href="/student-tools/">學員工具</a></div></div>
      <div class="footer-bottom"><div>© <span data-year></span> Hana Scent Artist</div><div class="footer-legal"><a href="/privacy/">隱私權政策</a>　·　<a href="/terms/">網站使用條款</a></div></div>`;
    footerGrid.querySelectorAll("[data-year]").forEach((y) => y.textContent = new Date().getFullYear());
    footerGrid.style.visibility = "visible";
  };

  const afterCore = () => {
    installGlobalStyle();
    arrangeHomepageSections();
    renderNavigation();
    renderFooter();
  };

  document.querySelector(".footer-grid")?.style.setProperty("visibility","hidden");
  if (document.readyState === "loading") {
    document.write('<script src="' + coreSrc + '"><\/script>');
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(afterCore, 0), {once:true});
  } else {
    const core = document.createElement("script");
    core.src = coreSrc;
    core.onload = () => window.setTimeout(afterCore, 0);
    document.head.appendChild(core);
  }
})();
