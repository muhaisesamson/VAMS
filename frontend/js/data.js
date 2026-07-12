(function () {
  const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:5000';

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || 'Request failed');
    }
    return payload;
  }

  function getCurrentSessionUser() {
    const raw = sessionStorage.getItem('vamsCurrentUser') || localStorage.getItem('vamsCurrentUser');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function setCurrentSessionUser(user) {
    const payload = JSON.stringify(user);
    sessionStorage.setItem('vamsCurrentUser', payload);
    localStorage.setItem('vamsCurrentUser', payload);
  }

  async function getVeterans() {
    try {
      const payload = await request('/api/admin/veterans');
      return payload.data || [];
    } catch (error) {
      return [];
    }
  }

  async function getAdmins() {
    return [];
  }

  async function getApplications() {
    try {
      const payload = await request('/api/admin/applications');
      return payload.data || [];
    } catch (error) {
      return [];
    }
  }

  async function getDocuments() {
    try {
      const payload = await request('/api/admin/documents');
      return payload.data || [];
    } catch (error) {
      return [];
    }
  }

  async function getCurrentVeteranDocuments() {
    const user = getCurrentSessionUser();
    if (!user || user.role !== 'veteran') return [];
    try {
      const payload = await request('/api/documents/me');
      return payload.data || [];
    } catch (error) {
      return [];
    }
  }

  async function getMyApplications() {
    const user = getCurrentSessionUser();
    if (!user) return [];
    try {
      const payload = await request('/api/applications/me');
      return payload.data || [];
    } catch (error) {
      return [];
    }
  }

  async function getApplicationsByType(type) {
    try {
      const payload = await request(`/api/admin/applications?service=${type}`);
      return payload.data || [];
    } catch (error) {
      return [];
    }
  }

  async function getDocumentsByStatus(status) {
    const docs = await getDocuments();
    return docs.filter((doc) => doc.status === status);
  }

  window.mockData = {
    request,
    getVeterans,
    getAdmins,
    getApplications,
    getDocuments,
    getCurrentSessionUser,
    setCurrentSessionUser,
    getCurrentVeteranDocuments,
    getMyApplications,
    getApplicationsByType,
    getDocumentsByStatus
  };
})();
