(function () {
  const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000';

  function setMessage(el, text, type = 'info') {
    if (!el) return;
    el.textContent = text;
    el.dataset.type = type;
    el.style.display = 'block';
  }

  function clearMessage(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }

  function getStoredUser() {
    const raw = sessionStorage.getItem('vamsCurrentUser') || localStorage.getItem('vamsCurrentUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function setStoredUser(user) {
    const payload = JSON.stringify(user);
    sessionStorage.setItem('vamsCurrentUser', payload);
    localStorage.setItem('vamsCurrentUser', payload);
  }

  async function loginWithCredentials(role, email, password, messageEl) {
    try {
      const endpoint = role === 'admin' ? '/api/auth/admin/login' : '/api/auth/veteran/login';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        if (messageEl) setMessage(messageEl, payload.message || 'Unable to sign in.', 'error');
        return { success: false };
      }

      const profile = {
        id: payload.user.id,
        fullName: payload.user.full_name || payload.user.name || payload.user.email,
        email: payload.user.email,
        role: payload.user.role,
        accountType: role === 'admin' ? 'admin' : 'veteran'
      };
      setStoredUser(profile);
      return { success: true, user: profile, redirect: role === 'admin' ? 'admin-dashboard.html' : 'veteran-dashboard.html' };
    } catch (error) {
      if (messageEl) setMessage(messageEl, 'The server is unavailable. Please try again shortly.', 'error');
      return { success: false };
    }
  }

  function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const messageEl = document.getElementById('loginMessage');

    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage(messageEl);

        const selectedRole = document.querySelector('input[name="loginRole"]:checked')?.value || 'veteran';
        const email = document.getElementById('loginId')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
          setMessage(messageEl, 'Enter your credentials to continue.', 'error');
          return;
        }

        const result = await loginWithCredentials(selectedRole, email, password, messageEl);
        if (result.success) {
          window.location.href = result.redirect;
        }
      });
    }

    const demoButton = document.getElementById('useDemoAccount');
    if (demoButton) {
      demoButton.addEventListener('click', () => {
        const loginId = document.getElementById('loginId');
        const loginPassword = document.getElementById('loginPassword');
        if (loginId) loginId.value = 'amina@example.com';
        if (loginPassword) loginPassword.value = 'demo';
      });
    }
  }

  window.auth = {
    getStoredUser,
    setStoredUser,
    initAuthForms,
    loginWithCredentials
  };

  document.addEventListener('DOMContentLoaded', initAuthForms);
})();
