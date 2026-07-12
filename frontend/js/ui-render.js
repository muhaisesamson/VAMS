(function () {
  function statusBadge(status) {
    const normalized = (status || '').toLowerCase();
    const styles = {
      approved: 'pill green',
      pending: 'pill yellow',
      rejected: 'pill red',
      default: 'pill blue'
    };
    const label = normalized.charAt(0).toUpperCase() + normalized.slice(1) || 'Pending';
    return `<span class="${styles[normalized] || styles.default}">${label}</span>`;
  }

  function renderVeteranSummary(container, veteran) {
    if (!container || !veteran) return;
    container.innerHTML = `
      <div class="panel">
        <span class="badge">Veteran profile</span>
        <h2 style="margin:14px 0 10px">${veteran.fullName}</h2>
        <p class="subtle">Service number: ${veteran.serviceNumber || '—'}</p>
        <p class="subtle">Branch: ${veteran.branch || '—'} • Rank: ${veteran.rank || '—'}</p>
      </div>
    `;
  }

  function renderApplications(container, applications) {
    if (!container) return;
    if (!applications.length) {
      container.innerHTML = '<div class="note">No applications have been submitted yet.</div>';
      return;
    }
    container.innerHTML = applications.map((item) => `
      <article class="panel" style="margin-top:12px">
        <div class="section-head" style="margin-bottom:10px">
          <div>
            <h3>${item.type.toUpperCase()}</h3>
            <p>${item.decision}</p>
          </div>
          ${statusBadge(item.status)}
        </div>
        <div class="list">
          <div class="list-item"><strong>Submitted:</strong> ${item.submittedAt}</div>
          ${item.amount ? `<div class="list-item"><strong>Approved amount:</strong> UGX ${Number(item.amount).toLocaleString()}</div>` : ''}
          ${item.coverage ? `<div class="list-item"><strong>Coverage:</strong> ${item.coverage}</div>` : ''}
        </div>
      </article>
    `).join('');
  }

  function renderDocuments(container, documents) {
    if (!container) return;
    if (!documents.length) {
      container.innerHTML = '<div class="note">No documents have been uploaded yet.</div>';
      return;
    }
    container.innerHTML = documents.map((item) => `
      <div class="list-item">
        <div>
          <strong>${item.type}</strong>
          <div class="subtle">${item.fileName}</div>
        </div>
        ${statusBadge(item.status)}
      </div>
    `).join('');
  }

  window.uiRender = {
    statusBadge,
    renderVeteranSummary,
    renderApplications,
    renderDocuments
  };
})();
