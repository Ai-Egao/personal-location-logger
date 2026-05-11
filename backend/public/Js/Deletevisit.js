const API_BASE = 'http://localhost:3000/api';

let pendingDeleteId  = null;
let pendingDeleteRow = null;

/* ── LOAD ── */
async function loadVisits() {
  try {
    const res = await fetch(`${API_BASE}/visits/all`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    renderTable(await res.json());
  } catch (err) {
    showError('Could not load visits. Is your server running? — ' + err.message);
    hideLoading();
  }
}

/* ── RENDER ── */
function renderTable(visits) {
  const tbody = document.getElementById('visitsBody');
  tbody.innerHTML = '';

  if (visits.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
  } else {
    document.getElementById('emptyState').style.display = 'none';
    visits.forEach(v => {
      const tr = document.createElement('tr');
      tr.dataset.id       = v.id;
      tr.dataset.location = (v.location || '').toLowerCase();
      tr.dataset.notes    = (v.notes    || '').toLowerCase();

      const date = v.date
        ? new Date(v.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
        : '—';

      tr.innerHTML = `
        <td><span class="id-badge">#${v.id}</span></td>
        <td>
          <div class="location-cell">
            <div class="location-dot"></div>
            <span class="location-name">${esc(v.location || '—')}</span>
          </div>
        </td>
        <td><span class="date-cell">${date}</span></td>
        <td class="hide-mobile">
          <span class="notes-cell ${v.notes ? '' : 'empty'}">${v.notes ? esc(v.notes) : 'No notes'}</span>
        </td>
        <td class="action-cell">
          <button class="btn-delete" onclick="openModal(${v.id}, '${escAttr(v.location)}', this.closest('tr'))">
            🗑 Delete
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  hideLoading();
  updateCount();
}

/* ── SEARCH ── */
function filterTable() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let visible = 0;
  document.querySelectorAll('#visitsBody tr').forEach(row => {
    const show = !q || row.dataset.location.includes(q) || row.dataset.notes.includes(q);
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('emptyState').style.display = visible === 0 ? 'block' : 'none';
  document.getElementById('visibleCount').textContent = visible;
}

function updateCount() {
  const total = document.querySelectorAll('#visitsBody tr').length;
  document.getElementById('totalCount').textContent   = total;
  document.getElementById('visibleCount').textContent = total;
  document.getElementById('visitCount').style.display = total > 0 ? 'block' : 'none';
}

/* ── MODAL ── */
function openModal(id, location, row) {
  pendingDeleteId  = id;
  pendingDeleteRow = row;
  document.getElementById('modalLocationLabel').textContent = location || `Visit #${id}`;
  document.getElementById('confirmModal').classList.add('active');
}

function closeModal() {
  pendingDeleteId = pendingDeleteRow = null;
  document.getElementById('confirmModal').classList.remove('active');
}

document.getElementById('confirmModal').addEventListener('click', e => {
  if (e.target === document.getElementById('confirmModal')) closeModal();
});

/* ── DELETE ── */
async function confirmDelete() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId, row = pendingDeleteRow;
  closeModal();
  if (row) row.classList.add('deleting');

  try {
    const res = await fetch(`${API_BASE}/visits/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visit_id: id })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    if (row) {
      row.classList.remove('deleting');
      row.classList.add('deleted-row');
      setTimeout(() => { row.remove(); updateCount(); filterTable(); }, 400);
    }
    showToast('✓ Visit deleted successfully', 'success');
  } catch (err) {
    if (row) row.classList.remove('deleting');
    showToast('✗ Failed to delete — ' + err.message, 'error');
  }
}

/* ── HELPERS ── */
function hideLoading() {
  document.getElementById('loadingState').style.display   = 'none';
  document.getElementById('tableContainer').style.display = 'block';
}

function showError(msg) {
  document.getElementById('errorMsg').textContent      = msg;
  document.getElementById('errorBanner').style.display = 'block';
}

let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Kick off on page load
loadVisits();