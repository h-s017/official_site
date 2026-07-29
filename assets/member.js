(() => {
  'use strict';

  const cfg = window.HANA_CMS_CONFIG || {};
  const form = document.getElementById('subscription-form');
  const status = document.getElementById('subscription-status');

  function showStatus(message, type = '') {
    if (!status) return;
    status.textContent = message;
    status.className = `member-status${type ? ` is-${type}` : ''}`;
    status.hidden = !message;
  }

  function setBusy(busy) {
    if (!form) return;
    form.querySelectorAll('button, input').forEach((element) => {
      element.disabled = busy;
    });
    form.setAttribute('aria-busy', String(busy));
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (!form || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    showStatus('訂閱功能目前無法載入，請稍後再試。', 'error');
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showStatus('');

    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const consentInput = form.elements.consent;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const interests = [...form.querySelectorAll('input[name="interests"]:checked')].map((input) => input.value);

    const invalidName = !name;
    const invalidEmail = !validEmail(email);
    const invalidConsent = !consentInput.checked;
    nameInput.setAttribute('aria-invalid', String(invalidName));
    emailInput.setAttribute('aria-invalid', String(invalidEmail));
    consentInput.setAttribute('aria-invalid', String(invalidConsent));

    if (invalidName || invalidEmail || invalidConsent) {
      showStatus('請填寫姓名與正確的 Email，並勾選訂閱同意。', 'error');
      return;
    }

    setBusy(true);
    const { error } = await client.from('email_subscribers').insert({
      name,
      email,
      interests,
      source: 'website-subscription',
      path: window.location.pathname
    });
    setBusy(false);

    if (error) {
      if (error.code === '23505') {
        showStatus('這個 Email 已經訂閱過氣味通信。', 'success');
        return;
      }
      showStatus('訂閱未完成，請稍後再試。', 'error');
      return;
    }

    form.reset();
    showStatus('訂閱完成，謝謝您加入氣味通信。', 'success');
  });
})();
