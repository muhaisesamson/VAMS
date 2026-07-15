(function () {
  const roleMap = {
    'doc-verifier': {
      label: 'Document Verification Board',
      panel: 'doc-verification.html'
    },
    'pension-committee': {
      label: 'Pension Committee',
      panel: 'pension-committee.html'
    },
    'healthcare-committee': {
      label: 'Healthcare Committee',
      panel: 'healthcare-committee.html'
    },
    'education-committee': {
      label: 'Education Committee',
      panel: 'education-committee.html'
    },
    'super-admin': {
      label: 'Super Administrator',
      panel: 'super-admin-panel.html'
    }
  };

  function getCurrentAdminRole() {
    const stored = sessionStorage.getItem('vamsUser') || localStorage.getItem('vamsUser');
    if (!stored) return 'doc-verifier';
    try {
      const parsed = JSON.parse(stored);
      return parsed.role || 'doc-verifier';
    } catch (error) {
      return 'doc-verifier';
    }
  }

  function getPanelForRole(role) {
    return roleMap[role] || roleMap['doc-verifier'];
  }

  async function loadAdminPanel(targetEl, role = getCurrentAdminRole()) {
    const panelConfig = getPanelForRole(role);
    if (!targetEl) return;
    const response = await fetch(`partials/${panelConfig.panel}`);
    if (!response.ok) {
      targetEl.innerHTML = '<div class="note">Panel is not available yet.</div>';
      return;
    }
    const html = await response.text();
    targetEl.innerHTML = html;
    if (typeof window.renderAdminPanel === 'function') {
      window.renderAdminPanel(role);
    }
  }

  window.rbac = {
    roleMap,
    getCurrentAdminRole,
    getPanelForRole,
    loadAdminPanel
  };
})();
