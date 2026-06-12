/* ═══════════════════════════════════════════════════════════════
   Fokus — script.js
   Features:
     • Core CRUD (add, edit, delete, toggle complete)
     • LocalStorage persistence
     • Search + filter (all / pending / completed / overdue)
     • Stats + progress bar
     • Clock + motivational quotes
     • Dark / light theme (saved)
     • Due dates + overdue detection          ← NEW
     • Undo delete with 5-second timer        ← NEW
     • Keyboard shortcuts                     ← NEW
     • Export as .txt and .json               ← NEW
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Storage keys ───────────────────────────────────────────── */
const STORAGE_TASKS = 'fokus_tasks_v2';
const STORAGE_THEME = 'fokus_theme';

/* ── State ──────────────────────────────────────────────────── */
let tasks        = [];      // master task array
let filter       = 'all';   // current filter tab
let searchQuery  = '';       // live search string
let undoStack    = null;     // { task, index } — single-level undo
let undoTimer    = null;     // setTimeout reference for undo window
let toastTimer   = null;     // setTimeout reference for toast hide

/* ── Quotes ──────────────────────────────────────────────────── */
const QUOTES = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "You don't have to be great to start, but you have to start to be great.",
  "Action is the foundational key to all success. — Pablo Picasso",
  "Done is better than perfect. — Sheryl Sandberg",
  "Small daily improvements over time lead to stunning results.",
  "The key is not to prioritize what's on your schedule, but to schedule your priorities. — Stephen Covey",
  "It always seems impossible until it's done. — Nelson Mandela",
];

/* ══════════════════════════════════════════════════════════════
   DOM REFERENCES
══════════════════════════════════════════════════════════════ */
const taskInput      = document.getElementById('taskInput');
const dueDateInput   = document.getElementById('dueDateInput');
const prioritySelect = document.getElementById('prioritySelect');
const addTaskBtn     = document.getElementById('addTaskBtn');
const taskList       = document.getElementById('taskList');
const emptyState     = document.getElementById('emptyState');
const searchInput    = document.getElementById('searchInput');
const filterTabs     = document.querySelectorAll('.filter-tab');
const clearAllBtn    = document.getElementById('clearAllBtn');
const charCount      = document.getElementById('charCount');

// Stats
const statTotal    = document.getElementById('statTotal');
const statDone     = document.getElementById('statDone');
const statPending  = document.getElementById('statPending');
const progressFill = document.getElementById('progressFill');
const progressPct  = document.getElementById('progressPct');
const progressTrack= document.getElementById('progressTrack');

// Clock
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');
const quoteText = document.getElementById('quoteText');

// Theme
const themeToggle = document.getElementById('themeToggle');
const themeLabel  = document.getElementById('themeLabel');

// Modals
const modalOverlay    = document.getElementById('modalOverlay');
const modalCancel     = document.getElementById('modalCancel');
const modalConfirm    = document.getElementById('modalConfirm');
const shortcutsOverlay= document.getElementById('shortcutsOverlay');
const shortcutsClose  = document.getElementById('shortcutsClose');
const shortcutsBtn    = document.getElementById('shortcutsBtn');

// Toast
const toastEl    = document.getElementById('toast');
const toastMsg   = document.getElementById('toastMsg');
const toastIcon  = document.getElementById('toastIcon');
const toastUndo  = document.getElementById('toastUndo');
const toastTimerEl = document.getElementById('toastTimer');

// Export
const exportTxt  = document.getElementById('exportTxt');
const exportJson = document.getElementById('exportJson');

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
function init() {
  loadTasks();
  loadTheme();
  startClock();
  setQuote();
  setMinDate();
  render();
  bindEvents();
}

/* ── Set min date for date picker to today ───────────────────── */
function setMinDate() {
  // Allow past dates — useful for logging old tasks. No min enforced.
}

/* ── Pick a random quote ─────────────────────────────────────── */
function setQuote() {
  quoteText.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/* ── Clock ───────────────────────────────────────────────────── */
function startClock() {
  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    clockTime.textContent = `${hh}:${mm}`;
    clockDate.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }
  tick();
  setInterval(tick, 1000);
}

/* ══════════════════════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════════════════════ */
function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(STORAGE_TASKS)) || [];
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
}

/* ══════════════════════════════════════════════════════════════
   THEME
══════════════════════════════════════════════════════════════ */
function loadTheme() {
  const saved = localStorage.getItem(STORAGE_THEME) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  themeLabel.textContent = saved === 'dark' ? 'Dark mode' : 'Light mode';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_THEME, next);
  themeLabel.textContent = next === 'dark' ? 'Dark mode' : 'Light mode';
}

/* ══════════════════════════════════════════════════════════════
   TASK HELPERS
══════════════════════════════════════════════════════════════ */

/**
 * Returns true if a task is overdue:
 * - Has a dueDate
 * - Not completed
 * - Due date is before today (ignoring time)
 */
function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate + 'T00:00:00'); // treat as local
  return due < today;
}

/**
 * Formats a due date string (YYYY-MM-DD) to a human-readable label.
 * Returns an object: { label, isOverdue, isToday, isTomorrow }
 */
function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const due      = new Date(dateStr + 'T00:00:00');

  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));

  let label;
  if (diff === 0)       label = 'Today';
  else if (diff === 1)  label = 'Tomorrow';
  else if (diff === -1) label = 'Yesterday';
  else if (diff < -1)   label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' (overdue)';
  else                  label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    label,
    isOverdue : diff < 0,
    isToday   : diff === 0,
    isTomorrow: diff === 1,
  };
}

/* ── Generate a unique ID ────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ══════════════════════════════════════════════════════════════
   ADD TASK
══════════════════════════════════════════════════════════════ */
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    // Shake the input to signal validation error
    taskInput.classList.add('shake');
    setTimeout(() => taskInput.classList.remove('shake'), 500);
    return;
  }

  const task = {
    id        : uid(),
    text,
    priority  : prioritySelect.value,
    completed : false,
    createdAt : Date.now(),
    dueDate   : dueDateInput.value || null,   // "YYYY-MM-DD" or null
  };

  tasks.unshift(task);
  saveTasks();

  // Reset inputs
  taskInput.value     = '';
  dueDateInput.value  = '';
  prioritySelect.value = 'medium';
  charCount.textContent = '160';

  render();
  showToast('Task added', 'success');
  taskInput.focus();
}

/* ══════════════════════════════════════════════════════════════
   TOGGLE COMPLETE
══════════════════════════════════════════════════════════════ */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
  showToast(task.completed ? 'Task completed ✓' : 'Marked as pending', 'success');
}

/* ══════════════════════════════════════════════════════════════
   DELETE TASK  (with 5-second undo)
══════════════════════════════════════════════════════════════ */
function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return;

  const task = tasks[index];

  // Animate out
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (li) {
    li.classList.add('is-removing');
  }

  setTimeout(() => {
    tasks.splice(index, 1);
    saveTasks();
    render();

    // Push to undo stack
    undoStack = { task, index };

    // Clear any previous undo timer
    if (undoTimer) clearTimeout(undoTimer);

    showToast('Task deleted', 'delete', true);

    // Auto-dismiss undo after 5 seconds
    undoTimer = setTimeout(() => {
      undoStack = null;
      hideToast();
    }, 5000);

  }, 260);
}

/* ── Undo the last delete ────────────────────────────────────── */
function undoDelete() {
  if (!undoStack) return;
  const { task, index } = undoStack;
  tasks.splice(index, 0, task);
  saveTasks();
  undoStack = null;
  if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
  hideToast();
  render();
  showToast('Task restored', 'success');
}

/* ══════════════════════════════════════════════════════════════
   EDIT TASK  (inline)
══════════════════════════════════════════════════════════════ */
function startEdit(id) {
  const li = taskList.querySelector(`[data-id="${id}"]`);
  if (!li) return;

  const task     = tasks.find(t => t.id === id);
  const textSpan = li.querySelector('.task-text');
  const actionsEl= li.querySelector('.task-actions');

  // Replace text span with an input
  const input = document.createElement('input');
  input.type  = 'text';
  input.value = task.text;
  input.maxLength = 160;
  input.className = 'task-edit-input';
  input.setAttribute('aria-label', 'Edit task text');

  textSpan.replaceWith(input);
  input.focus();
  input.select();

  // Swap edit button for save button
  const editBtn = li.querySelector('.task-action-btn--edit');
  if (editBtn) {
    editBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    editBtn.classList.add('task-action-btn--save');
    editBtn.classList.remove('task-action-btn--edit');
    editBtn.title = 'Save (Enter)';
  }

  function saveEdit() {
    const newText = input.value.trim();
    if (newText) {
      task.text = newText;
      saveTasks();
    }
    render();
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { render(); /* cancel */ }
  });

  if (editBtn) {
    editBtn.addEventListener('click', saveEdit, { once: true });
  }
}

/* ══════════════════════════════════════════════════════════════
   CLEAR ALL
══════════════════════════════════════════════════════════════ */
function confirmClearAll() {
  modalOverlay.classList.add('is-open');
}

function clearAll() {
  tasks = [];
  saveTasks();
  modalOverlay.classList.remove('is-open');
  render();
  showToast('All tasks cleared', 'delete');
}

/* ══════════════════════════════════════════════════════════════
   RENDER
══════════════════════════════════════════════════════════════ */
function render() {
  const query = searchQuery.toLowerCase().trim();

  const visible = tasks.filter(task => {
    // Search filter
    if (query && !task.text.toLowerCase().includes(query)) return false;
    // Tab filter
    if (filter === 'pending')   return !task.completed;
    if (filter === 'completed') return task.completed;
    if (filter === 'overdue')   return isOverdue(task);
    return true; // 'all'
  });

  // Stats (always from full tasks array)
  const total     = tasks.length;
  const done      = tasks.filter(t => t.completed).length;
  const pending   = total - done;
  const pct       = total ? Math.round((done / total) * 100) : 0;
  const overdueCount = tasks.filter(t => isOverdue(t)).length;

  statTotal.textContent   = total;
  statDone.textContent    = done;
  statPending.textContent = pending;
  progressFill.style.width = pct + '%';
  progressPct.textContent  = pct + '%';
  progressTrack.setAttribute('aria-valuenow', pct);

  // Color-shift progress fill: red → yellow → green
  if (pct < 34) {
    progressFill.style.background = 'linear-gradient(90deg,#ef4444,#f97316)';
  } else if (pct < 67) {
    progressFill.style.background = 'linear-gradient(90deg,#f59e0b,#eab308)';
  } else {
    progressFill.style.background = 'linear-gradient(90deg,#6366f1,#8b5cf6)';
  }

  // Update "Overdue" tab badge
  const overdueTab = document.querySelector('[data-filter="overdue"]');
  if (overdueTab) {
    overdueTab.innerHTML = overdueCount > 0
      ? `<i class="fa-solid fa-circle-exclamation" style="font-size:11px"></i> Overdue <span class="overdue-badge">${overdueCount}</span>`
      : `<i class="fa-solid fa-circle-exclamation" style="font-size:11px"></i> Overdue`;
  }

  // Empty state
  if (visible.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.add('is-visible');

    const msgs = {
      all      : ['Nothing here yet',        'Add your first task above to get started.'],
      pending  : ['All caught up!',           'No pending tasks. Great work!'],
      completed: ['No completed tasks yet',   'Finish a task to see it here.'],
      overdue  : ['No overdue tasks',         'You\'re right on schedule.'],
    };
    const [title, sub] = msgs[filter] || msgs.all;
    emptyState.querySelector('.empty-state__title').textContent = title;
    emptyState.querySelector('.empty-state__sub').textContent   = sub;
    return;
  }

  emptyState.classList.remove('is-visible');
  taskList.innerHTML = '';

  visible.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' is-done' : '') + (isOverdue(task) ? ' is-overdue' : '');
    li.setAttribute('data-id', task.id);
    li.style.animationDelay = (i * 0.04) + 's';

    // Priority badge
    const pLabel = { high: 'High', medium: 'Medium', low: 'Low' }[task.priority] || 'Medium';
    const pClass = `priority-badge--${task.priority}`;

    // Due date chip
    let dueDateHtml = '';
    if (task.dueDate) {
      const fmt = formatDueDate(task.dueDate);
      const chipClass = fmt.isOverdue
        ? 'due-chip due-chip--overdue'
        : fmt.isToday
          ? 'due-chip due-chip--today'
          : fmt.isTomorrow
            ? 'due-chip due-chip--tomorrow'
            : 'due-chip';
      const icon = fmt.isOverdue
        ? 'fa-circle-exclamation'
        : 'fa-calendar-days';
      dueDateHtml = `<span class="${chipClass}"><i class="fa-solid ${icon}"></i>${fmt.label}</span>`;
    }

    li.innerHTML = `
      <button
        class="task-check${task.completed ? ' checked' : ''}"
        data-action="toggle"
        aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
        title="${task.completed ? 'Mark incomplete' : 'Mark complete'}"
      >
        <i class="fa-solid fa-check" aria-hidden="true"></i>
      </button>

      <div class="task-body">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-meta">
          <span class="priority-badge ${pClass}">${pLabel}</span>
          ${dueDateHtml}
          <span class="task-time">${timeAgo(task.createdAt)}</span>
        </div>
      </div>

      <div class="task-actions" role="group" aria-label="Task actions">
        <button class="task-action-btn task-action-btn--edit" data-action="edit" title="Edit task" aria-label="Edit task">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
        </button>
        <button class="task-action-btn task-action-btn--delete" data-action="delete" title="Delete task" aria-label="Delete task">
          <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
        </button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

/* ── Event delegation on task list ──────────────────────────── */
function onTaskListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const li  = btn.closest('.task-item');
  const id  = li?.dataset.id;
  if (!id) return;

  const action = btn.dataset.action;
  if (action === 'toggle') toggleTask(id);
  if (action === 'delete') deleteTask(id);
  if (action === 'edit')   startEdit(id);
}

/* ══════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════ */
function showToast(msg, type = 'success', withUndo = false) {
  if (toastTimer) clearTimeout(toastTimer);

  toastMsg.textContent = msg;

  // Icon + colour
  if (type === 'delete') {
    toastIcon.className = 'fa-solid fa-trash-can toast__icon toast__icon--delete';
  } else {
    toastIcon.className = 'fa-solid fa-circle-check toast__icon';
  }

  // Undo button
  toastUndo.style.display = withUndo ? 'inline-flex' : 'none';

  toastEl.classList.add('is-visible');

  // Auto-hide (unless it's an undo toast — that's handled by undoTimer)
  if (!withUndo) {
    toastTimer = setTimeout(hideToast, 2800);
  }
}

function hideToast() {
  toastEl.classList.remove('is-visible');
}

/* ══════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════ */

/** Download a string as a file */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export all tasks as a plain-text file */
function exportAsTxt() {
  if (!tasks.length) { showToast('No tasks to export', 'delete'); return; }

  const lines = [
    'FOKUS — Task Export',
    `Generated: ${new Date().toLocaleString()}`,
    `Total: ${tasks.length} | Done: ${tasks.filter(t=>t.completed).length} | Pending: ${tasks.filter(t=>!t.completed).length}`,
    '─'.repeat(50),
    '',
  ];

  const groups = { high: [], medium: [], low: [] };
  tasks.forEach(t => groups[t.priority]?.push(t));

  for (const [prio, list] of Object.entries(groups)) {
    if (!list.length) continue;
    lines.push(`▸ ${prio.toUpperCase()} PRIORITY`);
    list.forEach(t => {
      const status  = t.completed ? '[✓]' : '[ ]';
      const due     = t.dueDate   ? ` | Due: ${t.dueDate}` : '';
      const overdue = isOverdue(t) ? ' ⚠ OVERDUE' : '';
      lines.push(`  ${status} ${t.text}${due}${overdue}`);
    });
    lines.push('');
  }

  downloadFile(lines.join('\n'), `fokus-tasks-${dateSlug()}.txt`, 'text/plain');
  showToast('Exported as .txt', 'success');
}

/** Export all tasks as a JSON file */
function exportAsJson() {
  if (!tasks.length) { showToast('No tasks to export', 'delete'); return; }

  const payload = {
    exportedAt : new Date().toISOString(),
    total      : tasks.length,
    completed  : tasks.filter(t => t.completed).length,
    pending    : tasks.filter(t => !t.completed).length,
    tasks      : tasks.map(t => ({
      id        : t.id,
      text      : t.text,
      priority  : t.priority,
      completed : t.completed,
      dueDate   : t.dueDate || null,
      overdue   : isOverdue(t),
      createdAt : new Date(t.createdAt).toISOString(),
    })),
  };

  downloadFile(JSON.stringify(payload, null, 2), `fokus-tasks-${dateSlug()}.json`, 'application/json');
  showToast('Exported as .json', 'success');
}

function dateSlug() {
  return new Date().toISOString().slice(0, 10);
}

/* ══════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════════════════════ */
function onKeyDown(e) {
  const tag    = document.activeElement?.tagName?.toLowerCase();
  const inInput= tag === 'input' || tag === 'textarea' || tag === 'select';

  // ? — show shortcuts (only when not typing)
  if (e.key === '?' && !inInput) {
    shortcutsOverlay.classList.add('is-open');
    return;
  }

  // Escape — close modals / cancel
  if (e.key === 'Escape') {
    modalOverlay.classList.remove('is-open');
    shortcutsOverlay.classList.remove('is-open');
    // If an edit input is active, re-render to cancel
    if (document.activeElement?.classList.contains('task-edit-input')) {
      render();
    }
    return;
  }

  // N — focus new task input (only when not typing in another field)
  if (e.key === 'n' && !inInput) {
    e.preventDefault();
    taskInput.focus();
    return;
  }

  // Ctrl+Z — undo delete
  if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    if (undoStack) {
      e.preventDefault();
      undoDelete();
    }
    return;
  }

  // Ctrl+E — export .txt
  if (e.key === 'e' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
    e.preventDefault();
    exportAsTxt();
    return;
  }

  // Ctrl+Shift+E — export .json
  if (e.key === 'E' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
    e.preventDefault();
    exportAsJson();
    return;
  }

  // Ctrl+F — focus search
  if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }
}

/* ══════════════════════════════════════════════════════════════
   BIND EVENTS
══════════════════════════════════════════════════════════════ */
function bindEvents() {
  // Add task
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // Character counter
  taskInput.addEventListener('input', () => {
    charCount.textContent = 160 - taskInput.value.length;
  });

  // Task list delegation
  taskList.addEventListener('click', onTaskListClick);

  // Search
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value;
    render();
  });

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('filter-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('filter-tab--active');
      tab.setAttribute('aria-selected', 'true');
      filter = tab.dataset.filter;
      render();
    });
  });

  // Clear all
  clearAllBtn.addEventListener('click', confirmClearAll);
  modalCancel.addEventListener('click',  () => modalOverlay.classList.remove('is-open'));
  modalConfirm.addEventListener('click', clearAll);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('is-open');
  });

  // Shortcuts modal
  shortcutsBtn.addEventListener('click',   () => shortcutsOverlay.classList.add('is-open'));
  shortcutsClose.addEventListener('click', () => shortcutsOverlay.classList.remove('is-open'));
  shortcutsOverlay.addEventListener('click', e => {
    if (e.target === shortcutsOverlay) shortcutsOverlay.classList.remove('is-open');
  });

  // Toast undo
  toastUndo.addEventListener('click', undoDelete);

  // Theme
  themeToggle.addEventListener('click', toggleTheme);

  // Export buttons
  exportTxt.addEventListener('click',  exportAsTxt);
  exportJson.addEventListener('click', exportAsJson);

  // Global keyboard shortcuts
  document.addEventListener('keydown', onKeyDown);
}

/* ══════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════ */

/** Escape HTML to prevent XSS in task text */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Human-readable relative time */
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)         return 'just now';
  if (diff < 3600)       return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)      return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

/* ══════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);