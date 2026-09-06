window.HANA_CMS_CONFIG = {
  supabaseUrl: 'https://uzqaodfmnrjrsbvxhlmh.supabase.co',
  supabaseAnonKey: 'sb_publishable_3ukkjs-QtgauXjmOrcDAVg_XBWzh2rd'
};

document.addEventListener('DOMContentLoaded', () => {
  const footerGrid = document.querySelector('.footer-grid');
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
        <a class="footer-social-link" href="https://www.instagram.com/hanas.scent/" target="_blank" rel="noopener" aria-label="Instagram">
          <img src="/assets/footer-instagram.svg" alt="">
        </a>
        <a class="footer-social-link" href="https://www.facebook.com/Hanas017" target="_blank" rel="noopener" aria-label="Facebook">
          <img src="/assets/footer-facebook.svg" alt="">
        </a>
        <a class="footer-social-link" href="https://lin.ee/OI4bzr1" target="_blank" rel="noopener" aria-label="官方 LINE">
          <img src="/assets/footer-line.svg" alt="">
        </a>
        <a class="footer-social-link" href="mailto:hanascent@gmail.com" aria-label="Email">
          <img src="/assets/footer-email.svg" alt="">
        </a>
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
      <div style="margin-top:14px">營業人名稱：藏花香徑工作室<br>統一編號：61269475<br>© <span data-year></span> Hana Scent Artist</div>
    </div>
  `;

  footerGrid.querySelectorAll('[data-year]').forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  if (!document.getElementById('hana-footer-social-style')) {
    const footerStyle = document.createElement('style');
    footerStyle.id = 'hana-footer-social-style';
    footerStyle.textContent = `
      .footer-social-col{display:flex;align-items:center;justify-content:center;align-self:stretch;min-height:100%;text-align:center;}
      .footer-social-links{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;padding-top:0;}
      .footer-social-link{display:inline-flex!important;align-items:center;justify-content:center;width:30px;height:30px;border:0!important;background:transparent;transition:opacity .2s ease;}
      .footer-social-link img{display:block;width:26px;height:26px;object-fit:contain;}
      .footer-social-link:hover,.footer-social-link:focus-visible{opacity:.55;border:0!important;}
      @media(max-width:760px){
        .footer-social-col{align-self:auto;min-height:72px;}
        .footer-social-links{gap:16px;justify-content:center;}
        .footer-social-link{width:28px;height:28px;}
        .footer-social-link img{width:24px;height:24px;}
      }
    `;
    document.head.appendChild(footerStyle);
  }
});
