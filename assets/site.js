(() => {
  const coreSrc = "/assets/site-core.js?v=20260906-footer-global";

  const installFooterStyle = () => {
    if (document.getElementById("hana-global-footer-style")) return;
    const style = document.createElement("style");
    style.id = "hana-global-footer-style";
    style.textContent = `
      .footer-grid{align-items:stretch!important;}
      .footer-social-col{display:flex!important;align-items:center!important;justify-content:center!important;align-self:stretch!important;min-height:100%;text-align:center;}
      .footer-social-links{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;padding:0;}
      .footer-social-link{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:30px;height:30px;border:0!important;background:transparent!important;transition:opacity .2s ease;}
      .footer-social-link img{display:block;width:26px;height:26px;object-fit:contain;}
      .footer-social-link:hover,.footer-social-link:focus-visible{opacity:.55;border:0!important;}
      .footer-right-col{min-width:0;}
      @media(max-width:760px){
        .footer-social-col{align-self:auto!important;min-height:72px;}
        .footer-social-links{gap:16px;justify-content:center;}
        .footer-social-link{width:28px;height:28px;}
        .footer-social-link img{width:24px;height:24px;}
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
    footerGrid.innerHTML = `
      <div class="footer-col">
        <b>HANA SCENT ARTIST</b><br><br>
        Founder of<br>
        <a href="/h-fugue-atelier/">H.FUGUE ATELIER｜Scent Objects</a><br>
        <a href="/ciyu/">此域 氣味敘事空間｜Olfactory Narrative Space</a>
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
        台北市北投區新民路42號<br>
        <a href="https://www.beitouheartvillage.taipei/" target="_blank" rel="noopener">北投中心新村</a> D1區C棟
        <div class="footer-actions">
          <a class="footer-action" href="https://reservation.hanascent.com/">預約課程</a>
          <a class="footer-action" href="/member/">訂閱氣味通信</a>
          <a class="footer-action" href="/student-tools/">學員工具</a>
        </div>
        <div style="margin-top:14px">© <span data-year></span> Hana Scent Artist</div>
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
