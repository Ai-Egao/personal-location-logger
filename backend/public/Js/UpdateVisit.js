const API_BASE = 'http://localhost:3000/api';

let editingId = null;

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

  // Store the raw ISO date on the row so we can send it back on save
  tr.dataset.date = v.date ? v.date : '';

  const displayDate = v.date
    ? new Date(v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  tr.innerHTML = `
    <td><span class="id-badge">#${v.id}</span></td>
    <td class="cell-location">
      <div class="location-cell">
        <div class="location-dot"></div>
        <span class="location-name">${esc(v.location || '—')}</span>
      </div>
    </td>
    <td><span class="date-cell">${displayDate}</span></td>
    <td class="cell-notes hide-mobile">
      <span class="notes-cell ${v.notes ? '' : 'empty'}">${v.notes ? esc(v.notes) : 'No notes'}</span>
    </td>
    <td class="action-cell">
      <button class="btn-edit" onclick="startEdit(${v.id}, this.closest('tr'))">✏️ Edit</button>
    </td>`;

  return tr;
}

/* ══════════════════════════════════
   INLINE EDIT — START
══════════════════════════════════ */
function startEdit(id, row) {
  if (editingId && editingId !== id) cancelEdit();

  editingId = id;
  row.classList.add('editing');

  const currentLocation = row.querySelector('.location-name').textContent.trim();
  const currentNotes    = row.querySelector('.notes-cell').textContent.trim();
  const notesVal        = currentNotes === 'No notes' ? '' : currentNotes;

  row.querySelector('.cell-location').innerHTML = `
    <input
      class="inline-input"
      id="edit-location-${id}"
      type="text"
      value="${escAttr(currentLocation)}"
      placeholder="Enter location"
      onkeydown="handleKey(event, ${id}, this.closest('tr'))"
    />`;

  row.querySelector('.cell-notes').innerHTML = `
    <input
      class="inline-input"
      id="edit-notes-${id}"
      type="text"
      value="${escAttr(notesVal)}"
      placeholder="Add notes…"
      onkeydown="handleKey(event, ${id}, this.closest('tr'))"
    />`;

  row.querySelector('.action-cell').innerHTML = `
    <div class="edit-actions">
      <button class="btn-save"        onclick="saveEdit(${id}, this.closest('tr'))">✓ Save</button>
      <button class="btn-cancel-edit" onclick="cancelEdit()">✕</button>
    </div>`;

  document.getElementById(`edit-location-${id}`).focus();
}

/* ══════════════════════════════════
   INLINE EDIT — SAVE
══════════════════════════════════ */
async function saveEdit(id, row) {
  const locationInput = document.getElementById(`edit-location-${id}`);
  const notesInput    = document.getElementById(`edit-notes-${id}`);

  const location = locationInput.value.trim();
  const notes    = notesInput.value.trim();

  // Preserve the original date stored on the row — never wipe it
  const date = row.dataset.date || null;

  if (!location) {
    locationInput.classList.add('input-error');
    locationInput.placeholder = 'Location is required';
    locationInput.focus();
    return;
  }

  locationInput.disabled = true;
  notesInput.disabled    = true;
  row.querySelector('.btn-save').disabled        = true;
  row.querySelector('.btn-cancel-edit').disabled = true;
  row.classList.add('saving');

  try {
    const res = await fetch(`${API_BASE}/visits/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visit_id: id, location, notes, date })  // send all three
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    editingId = null;
    row.classList.remove('editing', 'saving');

    // Restore display cells with updated values
    row.querySelector('.cell-location').innerHTML = `
      <div class="location-cell">
        <div class="location-dot"></div>
        <span class="location-name">${esc(location)}</span>
      </div>`;

    row.querySelector('.cell-notes').innerHTML = `
      <span class="notes-cell ${notes ? '' : 'empty'}">${notes ? esc(notes) : 'No notes'}</span>`;

    row.querySelector('.action-cell').innerHTML = `
      <button class="btn-edit" onclick="startEdit(${id}, this.closest('tr'))">✏️ Edit</button>`;

    // Keep search attributes up to date
    row.dataset.location = location.toLowerCase();
    row.dataset.notes    = notes.toLowerCase();

    row.classList.add('row-saved');
    setTimeout(() => row.classList.remove('row-saved'), 1500);

    showToast('✓ Visit updated successfully', 'success');

  } catch (err) {
    locationInput.disabled = false;
    notesInput.disabled    = false;
    row.querySelector('.btn-save').disabled        = false;
    row.querySelector('.btn-cancel-edit').disabled = false;
    row.classList.remove('saving');
    showToast('✗ Failed to update — ' + err.message, 'error');
  }
}

/* ══════════════════════════════════
   INLINE EDIT — CANCEL
══════════════════════════════════ */
function cancelEdit() {
  if (!editingId) return;
  editingId = null;
  loadVisits();
}

/* ══════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════ */
function handleKey(e, id, row) {
  if (e.key === 'Enter')  saveEdit(id, row);
  if (e.key === 'Escape') cancelEdit();
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

loadVisits();