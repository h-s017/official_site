(() => {
  const coreSrc = "/assets/site-core.js?v=20260906-footer-global";

  const installGlobalStyle = () => {
    if (document.getElementById("hana-global-20260910") || document.getElementById("hana-layout-css")) return;
    const style = document.createElement("style");
    style.id = "hana-global-20260910";
    style.textContent = `
      .nav-links a[href="/h-fugue-atelier/"],.nav-links a[href="/news/"]{display:none!important;}
      .nav-dropdown-menu{min-width:330px!important;}
      .nav-group-label{display:block;padding:10px 16px 7px;color:var(--gray500);font-size:12px;letter-spacing:.14em;line-height:1.5;border-top:1px solid var(--line);margin-top:4px;text-decoration:none!important;}
      .nav-group-label:hover,.nav-group-label:focus-visible{color:var(--black);background:var(--gray100);}
      .nav-dropdown-menu .nav-subitem{padding-left:34px!important;}
      .nav-dropdown-menu .nav-subitem strong{font-weight:500;}
      .nav-vol,.nav-vol .en-text,.nav-vol .tc-number{font-family:"Noto Serif TC","Source Han Serif TC","Source Han Serif","Songti TC",serif!important;font-style:normal!important;letter-spacing:inherit!important;}
      /* Course title goes to the overview; separate arrow controls the submenu. */
      .site-nav .nav-links .nav-dropdown>.nav-course-main{display:inline-flex!important;align-items:center!important;flex:0 0 auto;height:34px!important;padding:0!important;margin:0!important;border-bottom:1px solid transparent!important;text-decoration:none!important;font-size:inherit!important;line-height:1!important;color:#111!important;white-space:nowrap!important;}
      .site-nav .nav-links .nav-dropdown>.nav-course-main:hover,.site-nav .nav-links .nav-dropdown>.nav-course-main.active{border-bottom-color:var(--black)!important;}
      .site-nav .nav-dropdown>.nav-drop-button{width:28px;min-width:28px;padding:0 0 0 5px!important;border-bottom:0!important;font-size:inherit!important;}
      .site-nav .nav-dropdown>.nav-drop-button::after{margin:0!important;font-size:12px;}
      .site-nav .nav-dropdown>.nav-drop-button:focus-visible{outline:2px solid currentColor;outline-offset:2px;}
      @media(max-width:760px){
        .site-nav .nav-dropdown{display:flex!important;flex-wrap:wrap;align-items:center!important;width:100%!important;}
        .site-nav .nav-dropdown>.nav-course-main{height:44px!important;flex:1 1 auto!important;}
        .site-nav .nav-dropdown>.nav-drop-button{width:44px!important;height:44px!important;flex:0 0 44px!important;justify-content:center!important;padding:0!important;}
        .site-nav .nav-dropdown>.nav-dropdown-menu{flex:0 0 100%;width:100%!important;}
      }
      /* Keep the full course list reachable in short mobile/in-app viewports. */
      @media(max-width:760px){
        .site-nav.menu-open{max-height:100vh;max-height:100dvh;grid-template-rows:auto minmax(0,1fr)!important;}
        .site-nav.menu-open .nav-links{min-height:0;max-height:calc(100vh - 100px);max-height:calc(100dvh - 100px);overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;-webkit-overflow-scrolling:touch;align-items:stretch!important;}
        .site-nav .nav-links > *{flex-shrink:0;}
        .site-nav .nav-dropdown.is-open .nav-dropdown-menu{max-height:none;overflow:visible;}
        .site-nav .nav-dropdown-menu{min-width:0!important;}
        .site-nav .nav-dropdown-menu a{white-space:normal!important;overflow-wrap:anywhere;}
      }
      /* Disclosure state also controls visibility; focus/hover CSS cannot expose a closed panel. */
      .nav-dropdown:not(.is-open) .nav-dropdown-menu{opacity:0!important;visibility:hidden!important;pointer-events:none!important;}
      .nav-dropdown.is-open .nav-dropdown-menu{opacity:1!important;visibility:visible!important;transform:translateY(0)!important;pointer-events:auto!important;}
      .about-role-en{display:block;margin-top:10px;color:var(--gray500);font-family:"Cormorant Garamond",serif;font-size:clamp(14px,1.3vw,18px);font-weight:400;letter-spacing:.12em;line-height:1.45;}
      .footer-grid{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(180px,.75fr) minmax(200px,.8fr)!important;column-gap:clamp(42px,6vw,96px)!important;row-gap:0!important;align-items:start!important;}
      .footer-col{min-width:0;}.footer-brand-col{line-height:1.85!important}.footer-brand-title{display:block;margin-bottom:24px}.footer-brand-meta{display:block;margin-bottom:24px}.footer-role-zh,.footer-role-en{display:block}.footer-role-zh{font-size:14px;letter-spacing:.08em;line-height:1.7}.footer-role-en{margin-top:4px;font-family:"Cormorant Garamond",serif;font-size:12px;letter-spacing:.14em;line-height:1.55;color:var(--gray500)}.footer-brand-copy{display:block;margin-bottom:24px}
      .footer-social-col{display:flex!important;align-items:flex-start!important;justify-content:flex-start!important;text-align:left!important;padding:4px 0 0!important}.footer-social-links{display:flex;align-items:center;gap:20px;flex-wrap:wrap}.footer-social-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:30px;height:30px;border:0!important}.footer-social-link img{display:block;width:26px;height:26px;object-fit:contain}.footer-right-col .footer-actions{display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:11px!important}.footer-right-col .footer-action{display:inline!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important;box-shadow:none!important;text-decoration:none!important}.footer-bottom{grid-column:1/-1;display:flex;justify-content:space-between;gap:24px;margin-top:42px;padding-top:18px;border-top:1px solid var(--line);color:var(--gray500);font-size:12px}.footer-legal{text-align:right}.footer-legal a{white-space:nowrap}
      @media(max-width:900px){.footer-grid{grid-template-columns:minmax(0,1.25fr) minmax(160px,.75fr)!important;column-gap:42px!important;row-gap:34px!important}.footer-right-col{grid-column:2;grid-row:1}.footer-social-col{grid-column:1/-1;grid-row:2}.footer-bottom{grid-row:3}}
      @media(max-width:760px){.about-role-en{font-size:13px;letter-spacing:.08em}.footer-grid{display:block!important}.footer-brand-col,.footer-social-col,.footer-right-col{margin:0 0 30px!important}.footer-bottom{display:block;margin-top:10px}.footer-legal{text-align:left;margin-top:8px}.nav-dropdown-menu{min-width:min(330px,88vw)!important}}
    `;
    document.head.appendChild(style);
  };

  const installNavigationAppearance = () => {
    if (document.getElementById("hana-nav-appearance-20261024")) return;
    const style = document.createElement("style");
    style.id = "hana-nav-appearance-20261024";
    style.textContent = `
      /* Translucent background; text and disclosure panels stay fully legible. */
      .site-nav{--hana-nav-size:13.5px;--hana-menu-size:12px;background:rgba(255,255,255,.55)!important;}
      .site-nav .nav-links{font-size:calc(var(--hana-nav-size) + 2pt)!important;color:#111;}
      .site-nav .nav-links>a,.site-nav .nav-links>.nav-dropdown>.nav-drop-button{font-size:inherit!important;color:#111;}
      .site-nav .mobile-note{font-size:calc(var(--hana-menu-size) + 2pt)!important;color:#111;}
      .site-nav.menu-open{background:#fff!important;}
      @media(max-width:1240px){.site-nav{--hana-nav-size:12px;}}
      @media(max-width:980px){.site-nav{--hana-nav-size:13px;}}
      @media(max-width:760px){.site-nav{--hana-nav-size:15px;}}
      @media(max-width:420px){.site-nav{--hana-menu-size:11px;}}
      @media(prefers-contrast:more),(prefers-reduced-transparency:reduce),(forced-colors:active){.site-nav{background:#fff!important;}}
    `;
    document.head.appendChild(style);
  };

  const arrangeHomepageSections = () => {
    const isHomepage = window.location.pathname === "/" || window.location.pathname === "/index.html";
    if (!isHomepage) return;
    const news = document.querySelector("main .home-news");
    const about = document.querySelector("main .home-about");
    // The compact list has an explicit editorial position in the HTML.
    if (news?.dataset.newsLayout === "list") return;
    if (news && about && about.nextElementSibling !== news) about.insertAdjacentElement("afterend", news);
  };

  const renderNavigation = () => {
    const nav = document.querySelector(".nav-links");
    const siteNav = document.querySelector(".site-nav");
    const mobileMenu = document.querySelector(".mobile-note");
    if (!nav) return;
    nav.innerHTML = `
      <div class="nav-dropdown">
        <a class="nav-course-main" href="/courses/">專業調香課程</a>
        <button class="nav-drop-button" type="button" aria-label="展開專業調香課程子選單" aria-controls="hana-course-links" aria-expanded="false"></button>
        <div class="nav-dropdown-menu" id="hana-course-links">
          <a class="nav-group-label" href="/overture-series/">氣味藝術序曲系列</a>
          <a class="nav-subitem" href="/overture/"><strong class="nav-vol">Vol. 1</strong>　一日專業調香師</a>
          <a class="nav-subitem" href="/accord-etude/"><strong class="nav-vol">Vol. 2</strong>　調香師的和弦練習曲</a>
          <a class="nav-subitem" href="/practice/"><strong class="nav-vol">Vol. 0</strong>　氣味自修室</a>
          <a href="/helori/">HELORI 香氣探索體驗</a>
          <a href="/KPIA/">KPIA 大韓專業調香師證書</a>
          <a href="/corporate-workshops/">企業團體調香課程</a>
        </div>
      </div>
      <a href="/product-development/">品牌與產品開發</a>
      <a href="/journal/">氣味誌</a>
      <a href="https://hineni.hanascent.com/">此域 HINENI</a>
      <a href="/student-tools/">學員專區</a>
    `;

    const dropdown = nav.querySelector(".nav-dropdown");
    const button = nav.querySelector(".nav-drop-button");
    const courseLinks = nav.querySelector(".nav-dropdown-menu");
    const mobileViewport = window.matchMedia("(max-width:760px)");
    nav.id = nav.id || "hana-navigation";
    mobileMenu?.setAttribute("aria-controls", nav.id);

    const setCourseOpen = (open) => {
      dropdown?.classList.toggle("is-open", open);
      button?.setAttribute("aria-expanded", String(open));
      if (courseLinks) courseLinks.inert = !open;
    };
    const closeMobileMenu = () => {
      siteNav?.classList.remove("menu-open");
      if (mobileMenu) {
        mobileMenu.textContent = "MENU";
        mobileMenu.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-label", "開啟導覽選單");
      }
      setCourseOpen(false);
    };
    const syncNavigationState = () => {
      const closed = mobileViewport.matches && !siteNav?.classList.contains("menu-open");
      if (closed && nav.contains(document.activeElement)) mobileMenu?.focus();
      const wasClosed = nav.inert;
      nav.inert = closed;
      if (!closed && wasClosed && mobileViewport.matches && document.activeElement === mobileMenu) {
        nav.querySelector("a")?.focus();
      }
      if (closed) setCourseOpen(false);
    };
    button?.addEventListener("click", () => {
      setCourseOpen(button.getAttribute("aria-expanded") !== "true");
    });
    button?.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      setCourseOpen(true);
      courseLinks?.querySelector("a")?.focus();
    });
    dropdown?.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" && !mobileViewport.matches) setCourseOpen(true);
    });
    dropdown?.addEventListener("pointerleave", () => {
      if (!dropdown.contains(document.activeElement)) setCourseOpen(false);
    });
    dropdown?.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) setCourseOpen(false);
    });
    siteNav?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (dropdown?.classList.contains("is-open")) {
        event.preventDefault();
        setCourseOpen(false);
        button?.focus();
      } else if (mobileViewport.matches && siteNav.classList.contains("menu-open")) {
        event.preventDefault();
        closeMobileMenu();
        mobileMenu?.focus();
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (siteNav?.contains(event.target)) return;
      setCourseOpen(false);
      if (mobileViewport.matches) closeMobileMenu();
    });
    mobileViewport.addEventListener("change", () => {
      closeMobileMenu();
      syncNavigationState();
    });
    if (siteNav) new MutationObserver(syncNavigationState).observe(siteNav, {
      attributes: true, attributeFilter: ["class"]
    });
    setCourseOpen(false);
    syncNavigationState();
    nav.querySelectorAll("a").forEach((link) => {
      const href = link.getAttribute("href");
      const path = window.location.pathname;
      if (href !== "/" && path.startsWith(href)) link.classList.add("active");
      link.addEventListener("click", () => {
        closeMobileMenu();
      });
    });
  };

  const isCoursePage = () => {
    const path = window.location.pathname.replace(/index\.html$/, "");
    const coursePaths = ["/overture/", "/accord-etude/", "/practice/", "/helori/", "/KPIA/"];
    return coursePaths.some((p) => path.startsWith(p));
  };

  const renderFooter = () => {
    const footerGrid = document.querySelector(".footer-grid");
    if (!footerGrid) return;
    const isCiyuPage = /^\/ciyu(?:\/|\/index\.html)?$/.test(window.location.pathname);
    const addressBlock = isCiyuPage ? `<div style="margin-bottom:20px">台北市北投區新民路42號<br><a href="https://www.beitouheartvillage.taipei/" target="_blank" rel="noopener">北投中心新村</a> D1區C棟</div>` : "";
    const courseInfoLink = isCoursePage() ? `<a href="/course-info/">課程交易與履約資訊</a>　·　` : "";
    footerGrid.innerHTML = `
      <div class="footer-col footer-brand-col"><b class="footer-brand-title">HANA SCENT ARTIST</b><span class="footer-brand-meta"><span class="footer-role-zh">嗅覺藝術家　調香師　藝術發展顧問</span><span class="footer-role-en">OLFACTORY ARTIST · PERFUMER · CREATIVE MENTOR</span></span><span class="footer-brand-copy">創作與教育・品牌與產品開發</span>北投中心新村　<a href="https://hineni.hanascent.com/">此域 HINENI</a></div>
      <div class="footer-col footer-social-col"><div class="footer-social-links"><a class="footer-social-link" href="https://www.instagram.com/hanas.scent/" target="_blank" rel="noopener" aria-label="Instagram"><img src="/assets/footer-instagram.svg" alt=""></a><a class="footer-social-link" href="https://www.facebook.com/Hanas017" target="_blank" rel="noopener" aria-label="Facebook"><img src="/assets/footer-facebook.svg" alt=""></a><a class="footer-social-link" href="https://lin.ee/OI4bzr1" target="_blank" rel="noopener" aria-label="官方 LINE"><img src="/assets/footer-line.svg" alt=""></a><a class="footer-social-link" href="mailto:hanasscent@gmail.com" aria-label="Email"><img src="/assets/footer-email.svg" alt=""></a></div></div>
      <div class="footer-col footer-right-col">${addressBlock}<div class="footer-actions"><a class="footer-action" href="https://reservation.hanascent.com/">預約課程</a><a class="footer-action" href="/member/">訂閱氣味通信</a><a class="footer-action" href="/student-tools/">學員工具</a></div></div>
      <div class="footer-bottom"><div>© <span data-year></span> Hana Scent Artist</div><div class="footer-legal">${courseInfoLink}<a href="/terms/">消費者權益與服務條款</a>　·　<a href="/privacy/">隱私權政策</a>　·　<a href="/refund/">退換貨與退款政策</a></div></div>`;
    footerGrid.querySelectorAll("[data-year]").forEach((y) => y.textContent = new Date().getFullYear());
    footerGrid.style.visibility = "visible";
  };

  const afterCore = () => {
    installGlobalStyle();
    installNavigationAppearance();
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
