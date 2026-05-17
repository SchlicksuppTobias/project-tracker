const CAT_COLORS = {
    Renovierung:   { color: '#C84B2F', bg: '#FCEEE9' },
    Nebenprojekte: { color: '#2F6E4A', bg: '#E9F5EE' },
    Weiterbildung: { color: '#2A5FA8', bg: '#E9F0FB' },
    Fitnessziele:  { color: '#9B3DB8', bg: '#F3E9F9' }
};
const CAT_ICONS = {
    Renovierung: '🔨', Nebenprojekte: '💡', Weiterbildung: '📚', Fitnessziele: '🏃'
};
const PRIO_DOT = { Niedrig: '#2F6E4A', Mittel: '#D4952A', Hoch: '#C84B2F' };

let projects = JSON.parse(localStorage.getItem('pt-projects') || '[]');
let activeFilter = 'Alle';
let selectedCat = '';
let selectedPrio = 'Mittel';

function save() {
    localStorage.setItem('pt-projects', JSON.stringify(projects));
}

function formatDate(d) {
    if (!d) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}.${m}.${y}`;
}

function isOverdue(p) {
    if (!p.deadline || p.done) return false;
    return new Date(p.deadline) < new Date(new Date().toDateString());
}

function updateStats() {
    const total = projects.length;
    const done = projects.filter(p => p.done).length;
    const overdue = projects.filter(p => isOverdue(p)).length;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = total - done;
    document.getElementById('stat-done').textContent = done;
    document.getElementById('stat-overdue').textContent = overdue;
}

function getProgress(p) {
    if (!p.tasks || p.tasks.length === 0) return p.done ? 100 : 0;
    return Math.round(p.tasks.filter(t => t.done).length / p.tasks.length * 100);
}

function renderProjects() {
    const grid = document.getElementById('project-grid');
    const empty = document.getElementById('empty-state');
    const filtered = activeFilter === 'Alle' ? projects : projects.filter(p => p.cat === activeFilter);

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.add('visible');
    } else {
        empty.classList.remove('visible');
        grid.innerHTML = filtered.map(p => cardHTML(p)).join('');
    }
    updateStats();
}

function cardHTML(p) {
    const cc = CAT_COLORS[p.cat] || { color: '#888', bg: '#eee' };
    const progress = getProgress(p);
    const overdue = isOverdue(p);

    const tasksHTML = (p.tasks || []).map(t => `
    <div class="task-item">
      <input type="checkbox" class="task-check" ${t.done ? 'checked' : ''}
        onchange="toggleTask('${p.id}','${t.id}',this.checked)">
      <span class="task-text ${t.done ? 'checked' : ''}">${escHtml(t.text)}</span>
      <button class="task-del" onclick="deleteTask('${p.id}','${t.id}')" title="Löschen">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');

    const deadlineHTML = p.deadline ? `
    <span class="card-deadline ${overdue ? 'overdue' : ''}">
      <i class="fa-regular fa-calendar"></i>
      ${overdue ? 'Überfällig: ' : ''}${formatDate(p.deadline)}
    </span>` : `<span></span>`;

    const doneBtn = p.done
        ? `<button class="action-btn undone-btn" onclick="toggleDone('${p.id}')"><i class="fa-solid fa-rotate-left"></i> Reaktivieren</button>`
        : `<button class="action-btn done-btn" onclick="toggleDone('${p.id}')"><i class="fa-regular fa-circle-check"></i> Fertig</button>`;

    return `
  <div class="project-card ${p.done ? 'done-card' : ''}" id="card-${p.id}">
    <div class="card-cat-stripe" style="background:${cc.color}"></div>
    <div class="card-top">
      <div class="card-title-group">
        <div class="card-title">${escHtml(p.name)}</div>
        ${p.desc ? `<div class="card-desc">${escHtml(p.desc)}</div>` : ''}
      </div>
      <span class="cat-badge" style="background:${cc.bg};color:${cc.color}">
        ${CAT_ICONS[p.cat]} ${p.cat}
      </span>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span><span class="prio-dot" style="background:${PRIO_DOT[p.prio]||'#888'}"></span> ${p.prio}</span>
        <span>${progress}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%;background:${cc.color}"></div>
      </div>
    </div>

    <div class="tasks-section">
      <div class="tasks-header">
        <span class="tasks-label">Aufgaben (${(p.tasks||[]).filter(t=>t.done).length}/${(p.tasks||[]).length})</span>
        <button class="add-task-btn" onclick="toggleAddTask('${p.id}')" title="Aufgabe hinzufügen">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
      <div id="tasks-${p.id}">${tasksHTML}</div>
      <div class="add-task-form" id="atf-${p.id}">
        <input type="text" class="add-task-input" id="ati-${p.id}" placeholder="Neue Aufgabe..."
          onkeydown="if(event.key==='Enter')addTask('${p.id}')">
        <button class="task-confirm-btn" onclick="addTask('${p.id}')">OK</button>
      </div>
    </div>

    <div class="card-footer">
      ${deadlineHTML}
      <div class="card-actions">
        ${doneBtn}
        <button class="action-btn delete-btn" onclick="deleteProject('${p.id}')"><i class="fa-regular fa-trash-can"></i></button>
      </div>
    </div>
  </div>`;
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Actions ──────────────────────────────────────────────

function toggleDone(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    p.done = !p.done;
    save(); renderProjects();
}

function deleteProject(id) {
    if (!confirm('Projekt wirklich löschen?')) return;
    projects = projects.filter(x => x.id !== id);
    save(); renderProjects();
}

function toggleAddTask(pid) {
    const form = document.getElementById('atf-' + pid);
    form.classList.toggle('open');
    if (form.classList.contains('open')) document.getElementById('ati-' + pid).focus();
}

function addTask(pid) {
    const inp = document.getElementById('ati-' + pid);
    const text = inp.value.trim();
    if (!text) return;
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    if (!p.tasks) p.tasks = [];
    p.tasks.push({ id: Date.now().toString(36), text, done: false });
    inp.value = '';
    save(); renderProjects();
}

function toggleTask(pid, tid, checked) {
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    const t = p.tasks.find(x => x.id === tid);
    if (t) t.done = checked;
    save(); renderProjects();
}

function deleteTask(pid, tid) {
    const p = projects.find(x => x.id === pid);
    if (!p) return;
    p.tasks = p.tasks.filter(x => x.id !== tid);
    save(); renderProjects();
}

// ── Modal ─────────────────────────────────────────────────

function openModal() {
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('f-name').focus();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('f-start').value = today;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    resetForm();
}

function handleOverlayClick(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function resetForm() {
    document.getElementById('f-name').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('f-start').value = '';
    document.getElementById('f-deadline').value = '';
    document.querySelectorAll('.cat-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.prio-option').forEach(el => el.classList.remove('selected'));
    document.querySelector('.prio-option[data-prio="Mittel"]').classList.add('selected');
    selectedCat = '';
    selectedPrio = 'Mittel';
}

function selectCat(el) {
    document.querySelectorAll('.cat-option').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    selectedCat = el.dataset.cat;
}

function selectPrio(el) {
    document.querySelectorAll('.prio-option').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    selectedPrio = el.dataset.prio;
}

function saveProject() {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { alert('Bitte einen Projektnamen eingeben.'); return; }
    if (!selectedCat) { alert('Bitte eine Kategorie wählen.'); return; }
    const p = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name,
        desc: document.getElementById('f-desc').value.trim(),
        cat: selectedCat,
        start: document.getElementById('f-start').value,
        deadline: document.getElementById('f-deadline').value,
        prio: selectedPrio,
        done: false,
        tasks: [],
        createdAt: Date.now()
    };
    projects.unshift(p);
    save();
    closeModal();
    activeFilter = 'Alle';
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === 'Alle'));
    renderProjects();
}

// ── Filter tabs ───────────────────────────────────────────

document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.dataset.cat;
        renderProjects();
    });
});

// ── Date display ──────────────────────────────────────────

const now = new Date();
document.getElementById('date-display').textContent =
    now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ── Initial render ────────────────────────────────────────

renderProjects();

// ── Keyboard shortcuts ────────────────────────────────────

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'n' && !e.ctrlKey && document.activeElement === document.body) openModal();
});
