(() => {
  'use strict';

  const cfg = window.HANA_CMS_CONFIG || {};
  const status = document.getElementById('member-status');
  const authView = document.getElementById('auth-view');
  const resetView = document.getElementById('reset-view');
  const accountView = document.getElementById('account-view');

  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    showStatus('會員系統目前無法載入，請稍後再試。', 'error');
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let recoveryMode = new URLSearchParams(window.location.search).get('mode') === 'reset' ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery';

  const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
    reset: document.getElementById('reset-form')
  };

  function showStatus(message, type = '') {
    if (!status) return;
    status.textContent = message;
    status.className = `member-status${type ? ` is-${type}` : ''}`;
    status.hidden = !message;
  }

  function clearStatus() {
    showStatus('');
  }

  function setBusy(form, busy) {
    if (!form) return;
    form.querySelectorAll('button, input').forEach((element) => {
      element.disabled = busy;
    });
    form.setAttribute('aria-busy', String(busy));
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function markInvalid(input, invalid) {
    if (!input) return;
    input.setAttribute('aria-invalid', String(invalid));
  }

  function friendlyError(error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('invalid login credentials')) return '電子郵件或密碼不正確。';
    if (message.includes('email not confirmed')) return '請先到信箱完成電子郵件驗證。';
    if (message.includes('user already registered')) return '這個電子郵件已註冊，請直接登入或重設密碼。';
    if (message.includes('signup is disabled')) return '目前暫停開放新會員註冊。';
    if (message.includes('password should be at least') || message.includes('weak password')) return '密碼強度不足，請使用至少 8 個字元。';
    if (message.includes('rate limit') || message.includes('too many requests')) return '操作次數過多，請稍後再試。';
    if (message.includes('network') || message.includes('fetch')) return '網路連線異常，請確認連線後再試。';
    return '操作未完成，請確認資料後再試。';
  }

  function setTab(mode) {
    document.querySelectorAll('[data-member-tab]').forEach((tab) => {
      const active = tab.dataset.memberTab === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('[data-member-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.memberPanel !== mode;
    });
    clearStatus();
  }

  function renderSignedOut() {
    authView.hidden = false;
    resetView.hidden = true;
    accountView.hidden = true;
  }

  function renderRecovery() {
    authView.hidden = true;
    resetView.hidden = false;
    accountView.hidden = true;
  }

  function renderAccount(user) {
    authView.hidden = true;
    resetView.hidden = true;
    accountView.hidden = false;
    document.getElementById('account-name').textContent = user?.user_metadata?.full_name || '—';
    document.getElementById('account-email').textContent = user?.email || '—';
  }

  document.querySelectorAll('[data-member-tab]').forEach((tab) => {
    tab.addEventListener('click', () => setTab(tab.dataset.memberTab));
  });

  forms.login?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatus();
    const emailInput = forms.login.elements.email;
    const passwordInput = forms.login.elements.password;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const invalidEmail = !validEmail(email);
    const invalidPassword = password.length < 8;
    markInvalid(emailInput, invalidEmail);
    markInvalid(passwordInput, invalidPassword);
    if (invalidEmail || invalidPassword) {
      showStatus('請輸入正確的電子郵件及至少 8 個字元的密碼。', 'error');
      return;
    }

    setBusy(forms.login, true);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(forms.login, false);
    if (error) {
      showStatus(friendlyError(error), 'error');
      return;
    }
    forms.login.reset();
    renderAccount(data.user);
    showStatus('登入成功。', 'success');
  });

  forms.register?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatus();
    const nameInput = forms.register.elements.name;
    const emailInput = forms.register.elements.email;
    const passwordInput = forms.register.elements.password;
    const confirmInput = forms.register.elements.passwordConfirm;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = confirmInput.value;

    const invalidName = !name;
    const invalidEmail = !validEmail(email);
    const invalidPassword = password.length < 8;
    const invalidConfirm = password !== passwordConfirm;
    markInvalid(nameInput, invalidName);
    markInvalid(emailInput, invalidEmail);
    markInvalid(passwordInput, invalidPassword);
    markInvalid(confirmInput, invalidConfirm);
    if (invalidName || invalidEmail || invalidPassword || invalidConfirm) {
      showStatus(invalidConfirm ? '兩次輸入的密碼不一致。' : '請完整填寫姓名、電子郵件及至少 8 個字元的密碼。', 'error');
      return;
    }

    setBusy(forms.register, true);
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/member/`,
        data: { full_name: name }
      }
    });
    setBusy(forms.register, false);
    if (error) {
      showStatus(friendlyError(error), 'error');
      return;
    }

    forms.register.reset();
    if (data.session && data.user) {
      renderAccount(data.user);
      showStatus('註冊完成，已登入會員帳號。', 'success');
    } else {
      setTab('login');
      showStatus('註冊資料已送出，請到信箱點擊驗證連結後再登入。', 'success');
    }
  });

  document.getElementById('forgot-password')?.addEventListener('click', async () => {
    clearStatus();
    const emailInput = forms.login.elements.email;
    const email = emailInput.value.trim();
    const invalidEmail = !validEmail(email);
    markInvalid(emailInput, invalidEmail);
    if (invalidEmail) {
      showStatus('請先在電子郵件欄位輸入註冊信箱。', 'error');
      emailInput.focus();
      return;
    }

    setBusy(forms.login, true);
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/member/?mode=reset`
    });
    setBusy(forms.login, false);
    if (error) {
      showStatus(friendlyError(error), 'error');
      return;
    }
    showStatus('若此信箱已建立會員帳號，系統將寄出密碼重設信。', 'success');
  });

  forms.reset?.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearStatus();
    const passwordInput = forms.reset.elements.password;
    const confirmInput = forms.reset.elements.passwordConfirm;
    const password = passwordInput.value;
    const passwordConfirm = confirmInput.value;
    const invalidPassword = password.length < 8;
    const invalidConfirm = password !== passwordConfirm;
    markInvalid(passwordInput, invalidPassword);
    markInvalid(confirmInput, invalidConfirm);
    if (invalidPassword || invalidConfirm) {
      showStatus(invalidConfirm ? '兩次輸入的密碼不一致。' : '新密碼至少需要 8 個字元。', 'error');
      return;
    }

    setBusy(forms.reset, true);
    const { data, error } = await client.auth.updateUser({ password });
    setBusy(forms.reset, false);
    if (error) {
      showStatus(friendlyError(error), 'error');
      return;
    }
    recoveryMode = false;
    forms.reset.reset();
    window.history.replaceState({}, document.title, '/member/');
    renderAccount(data.user);
    showStatus('密碼已更新。', 'success');
  });

  document.getElementById('sign-out')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const { error } = await client.auth.signOut();
    button.disabled = false;
    if (error) {
      showStatus(friendlyError(error), 'error');
      return;
    }
    renderSignedOut();
    setTab('login');
    showStatus('已登出會員帳號。', 'success');
  });

  client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      recoveryMode = true;
      renderRecovery();
      showStatus('身分驗證完成，請設定新密碼。', 'success');
      return;
    }
    if (event === 'SIGNED_OUT') {
      renderSignedOut();
      return;
    }
    if (session?.user && !recoveryMode) renderAccount(session.user);
  });

  (async () => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const authError = hashParams.get('error_description');
    if (authError) {
      window.history.replaceState({}, document.title, '/member/');
      renderSignedOut();
      showStatus(decodeURIComponent(authError.replace(/\+/g, ' ')), 'error');
      return;
    }

    const { data, error } = await client.auth.getSession();
    if (error) {
      renderSignedOut();
      showStatus(friendlyError(error), 'error');
      return;
    }
    if (recoveryMode && data.session) {
      renderRecovery();
    } else if (data.session?.user) {
      renderAccount(data.session.user);
    } else {
      renderSignedOut();
    }
  })();
})();
