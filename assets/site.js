(() => {
  const coreSrc = "/assets/site-core.js?v=20260906-footer-global";

  const installFooterStyle = () => {
    if (document.getElementById("hana-global-footer-style")) return;
    const style = document.createElement("style");
    style.id = "hana-global-footer-style";
    style.textContent = `
      .nav-links a[href="/h-fugue-atelier/"]{display:none!important;}
      .nav-links a[href="/news/"]{display:none!important;}

      .footer-grid{
        display:grid!important;
        grid-template-columns:minmax(0,1.35fr) minmax(180px,.75fr) minmax(200px,.8fr)!important;
        column-gap:clamp(42px,6vw,96px)!important;
        row-gap:0!important;
        align-items:start!important;
      }
      .footer-col{min-width:0;}
      .footer-brand-col{line-height:1.85!important;}
      .footer-brand-title{display:block;margin-bottom:24px;}
      .footer-brand-meta{display:block;margin-bottom:24px;}
      .footer-brand-copy{display:block;margin-bottom:24px;}

      .footer-social-col{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:flex-start!important;
        text-align:left!important;
        padding:4px 0 0!important;
      }
      .footer-social-links{
        display:flex;
        align-items:center;
        justify-content:flex-start;
        gap:20px;
        flex-wrap:wrap;
        padding:0;
      }
      .footer-social-link{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        width:30px;
        height:30px;
        border:0!important;
        background:transparent!important;
        transition:opacity .2s ease;
      }
      .footer-social-link img{display:block;width:26px;height:26px;object-fit:contain;}
      .footer-social-link:hover,.footer-social-link:focus-visible{opacity:.55;border:0!important;}

      .footer-right-col{min-width:0;padding-top:0!important;}
      .footer-right-col .footer-actions{
        display:flex!important;
        flex-direction:column!important;
        align-items:flex-start!important;
        gap:11px!important;
        margin:0!important;
      }
      .footer-right-col .footer-action{
        display:inline!important;
        width:auto!important;
        min-height:0!important;
        padding:0!important;
        margin:0!important;
        border:0!important;
        background:transparent!important;
        box-shadow:none!important;
        color:inherit!important;
        font-size:inherit!important;
        line-height:1.6!important;
        letter-spacing:inherit!important;
        text-decoration:none!important;
      }
      .footer-right-col .footer-action:hover,.footer-right-col .footer-action:focus-visible{
        border:0!important;
        text-decoration:underline!important;
        text-underline-offset:3px;
      }

      .footer-bottom{
        grid-column:1 / -1;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:24px;
        margin-top:42px;
        padding-top:18px;
        border-top:1px solid var(--line);
        color:var(--gray500);
        font-size:12px;
        line-height:1.7;
      }
      .footer-copyright{white-space:nowrap;}
      .footer-legal{margin:0;text-align:right;}
      .footer-legal a{display:inline!important;border:0!important;color:inherit!important;text-decoration:none!important;}
      .footer-legal a:hover,.footer-legal a:focus-visible{text-decoration:underline!important;text-underline-offset:3px;}

      @media(max-width:900px){
        .footer-grid{
          grid-template-columns:minmax(0,1.25fr) minmax(160px,.75fr)!important;
          column-gap:42px!important;
          row-gap:34px!important;
        }
        .footer-right-col{grid-column:2;grid-row:1;}
        .footer-social-col{grid-column:1 / -1;grid-row:2;padding-top:0!important;}
        .footer-bottom{grid-row:3;margin-top:2px;}
      }

      @media(max-width:760px){
        .footer-grid{display:block!important;}
        .footer-brand-col,.footer-social-col,.footer-right-col{margin:0 0 30px!important;}
        .footer-social-col{padding:0!important;}
        .footer-social-links{gap:18px;justify-content:flex-start;}
        .footer-social-link{width:28px;height:28px;}
        .footer-social-link img{width:24px;height:24px;}
        .footer-bottom{
          display:block;
          margin-top:10px;
          padding-top:16px;
        }
        .footer-copyright{white-space:normal;margin-bottom:8px;}
        .footer-legal{text-align:left;}
      }
    `;
    document.head.appendChild(style);
  };

  const hideLegacyFooter = () => {
    const footerGrid = document.querySelector(".footer-grid");
    if (footerGrid) footerGrid.style.visibility = "hidden";
  };

  const renderFooter = () => {
    const footerGrid = document.querySelector(".footer-grid");
    if (!footerGrid) return;

    const isCiyuPage = /^\/ciyu(?:\/|\/index\.html)?$/.test(window.location.pathname);
    const addressBlock = isCiyuPage
      ? `<div style="margin-bottom:20px">台北市北投區新民路42號<br>\n        <a href="https://www.beitouheartvillage.taipei/" target="_blank" rel="noopener">北投中心新村</a> D1區C棟</div>`
      : "";

    footerGrid.innerHTML = `
      <div class="footer-col footer-brand-col">
        <b class="footer-brand-title">HANA SCENT ARTIST</b>
        <span class="footer-brand-meta">Olfactory Artist｜Founder &amp; Perfumer</span>
        <span class="footer-brand-copy">以氣味譜寫無形的感官旋律</span>
        氣味品牌顧問｜專業調香課程<br>
        藝術駐村計畫　<a href="/ciyu/">此域</a>
      </div>

      <div class="footer-col footer-social-col" aria-label="社群與聯絡方式">
        <div class="footer-social-links">
          <a class="footer-social-link" href="https://www.instagram.com/hanas.scent/" target="_blank" rel="noopener" aria-label="Instagram"><img src="/assets/footer-instagram.svg" alt=""></a>
          <a class="footer-social-link" href="https://www.facebook.com/Hanas017" target="_blank" rel="noopener" aria-label="Facebook"><img src="/assets/footer-facebook.svg" alt=""></a>
          <a class="footer-social-link" href="https://lin.ee/OI4bzr1" target="_blank" rel="noopener" aria-label="官方 LINE"><img src="/assets/footer-line.svg" alt=""></a>
          <a class="footer-social-link" href="mailto:hanascent@gmail.com" aria-label="Email"><img src="/assets/footer-email.svg" alt=""></a>
        </div>
      </div>

      <div class="footer-col footer-right-col">
        ${addressBlock}
        <div class="footer-actions">
          <a class="footer-action" href="https://reservation.hanascent.com/">預約課程</a>
          <a class="footer-action" href="/member/">訂閱氣味通信</a>
          <a class="footer-action" href="/student-tools/">學員工具</a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-copyright">© <span data-year></span> Hana Scent Artist</div>
        <div class="footer-legal">
          <a href="/privacy/">隱私權政策</a>　·　<a href="/terms/">網站使用條款</a>
        </div>
      </div>
    `;
    footerGrid.querySelectorAll("[data-year]").forEach((year) => {
      year.textContent = new Date().getFullYear();
    });
    footerGrid.style.visibility = "visible";
  };

  installFooterStyle();
  hideLegacyFooter();

  if (document.readyState === "loading") {
    document.write('<script src="' + coreSrc + '"><\/script>');
    document.addEventListener("DOMContentLoaded", () => window.setTimeout(renderFooter, 0), {once:true});
  } else {
    const core = document.createElement("script");
    core.src = coreSrc;
    document.head.appendChild(core);
    window.setTimeout(renderFooter, 0);
  }
})();
