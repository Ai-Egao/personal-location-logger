const API_BASE = 'http://localhost:3000/api';

/* ══════════════════════════════════
   LOAD
══════════════════════════════════ */
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

/* ══════════════════════════════════
   RENDER
══════════════════════════════════ */
function renderTable(visits) {
  const tbody = document.getElementById('visitsBody');
  tbody.innerHTML = '';

  if (visits.length === 0) {
    document.getElementById('emptyState').style.display = 'block';
  } else {
    document.getElementById('emptyState').style.display = 'none';
    visits.forEach(v => tbody.appendChild(buildRow(v)));
  }

  hideLoading();
  updateCount();
}

function buildRow(v) {
  const tr = document.createElement('tr');
  tr.dataset.id       = v.id;
  tr.dataset.location = (v.location || '').toLowerCase();
  tr.dataset.notes    = (v.notes    || '').toLowerCase();

  const displayDate = v.date
    ? new Date(v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  tr.innerHTML = `
    <td><span class="id-badge">#${v.id}</span></td>
    <td>
      <div class="location-cell">
        <div class="location-dot"></div>
        <span class="location-name">${esc(v.location || '—')}</span>
      </div>
    </td>
    <td><span class="date-cell">${displayDate}</span></td>
    <td class="hide-mobile">
      <span class="notes-cell ${v.notes ? '' : 'empty'}">${v.notes ? esc(v.notes) : 'No notes'}</span>
    </td>`;

  return tr;
}

/* ══════════════════════════════════
   SEARCH / FILTER
══════════════════════════════════ */
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

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function hideLoading() {
  document.getElementById('loadingState').style.display   = 'none';
  document.getElementById('tableContainer').style.display = 'block';
}

function showError(msg) {
  document.getElementById('errorMsg').textContent      = msg;
  document.getElementById('errorBanner').style.display = 'block';
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

loadVisits();