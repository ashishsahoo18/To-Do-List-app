const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const prioritySelect = document.getElementById("prioritySelect");
const themeToggle = document.getElementById("themeToggle");
const clearAllBtn = document.getElementById("clearAllBtn");

let currentFilter = "all";

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

/* ---------------------- SAVE ---------------------- */

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ---------------------- TOAST ---------------------- */

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMsg");

    toastMsg.textContent = message;
    toast.classList.add("is-visible");

    setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 2500);
}

/* ---------------------- ADD TASK ---------------------- */

function addTask() {
    const text = taskInput.value.trim();

    if (!text) {
        showToast("Please enter a task");
        return;
    }

    tasks.push({
        id: Date.now(),
        text,
        priority: prioritySelect.value,
        completed: false
    });

    saveTasks();
    renderTasks();

    taskInput.value = "";

    showToast("Task Added");
}

/* ---------------------- DELETE ---------------------- */

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();

    showToast("Task Deleted");
}

/* ---------------------- TOGGLE ---------------------- */

function toggleTask(id) {

    tasks = tasks.map(task => {

        if (task.id === id) {
            task.completed = !task.completed;
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

/* ---------------------- EDIT ---------------------- */

function editTask(id) {

    const task = tasks.find(t => t.id === id);

    const newText = prompt("Edit Task", task.text);

    if (newText === null) return;

    task.text = newText.trim();

    saveTasks();
    renderTasks();

    showToast("Task Updated");
}

/* ---------------------- STATS ---------------------- */

function updateStats() {

    const total = tasks.length;

    const done = tasks.filter(task => task.completed).length;

    const pending = total - done;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statDone").textContent = done;
    document.getElementById("statPending").textContent = pending;

    const percent =
        total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById("progressPct").textContent =
        percent + "%";

    document.getElementById("progressFill").style.width =
        percent + "%";
}

/* ---------------------- FILTER ---------------------- */

function getFilteredTasks() {

    const search = searchInput.value.toLowerCase();

    return tasks.filter(task => {

        const matchesSearch =
            task.text.toLowerCase().includes(search);

        let matchesFilter = true;

        if (currentFilter === "completed") {
            matchesFilter = task.completed;
        }

        if (currentFilter === "pending") {
            matchesFilter = !task.completed;
        }

        return matchesSearch && matchesFilter;
    });
}

/* ---------------------- RENDER ---------------------- */

function renderTasks() {

    taskList.innerHTML = "";

    const filteredTasks = getFilteredTasks();

    emptyState.classList.toggle(
        "is-visible",
        filteredTasks.length === 0
    );

    filteredTasks.forEach(task => {

        const li = document.createElement("li");

        li.className =
            `task-item ${task.completed ? "is-done" : ""}`;

        li.innerHTML = `
            <button class="task-check">
                <i class="fa-solid fa-check"></i>
            </button>

            <div class="task-body">
                <div class="task-text">${task.text}</div>

                <div class="task-meta">
                    <span class="priority-badge priority-badge--${task.priority}">
                        ${task.priority}
                    </span>
                </div>
            </div>

            <div class="task-actions">

                <button class="task-action-btn edit-btn">
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button class="task-action-btn task-action-btn--delete delete-btn">
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>
        `;

        li.querySelector(".task-check")
            .addEventListener("click", () => {
                toggleTask(task.id);
            });

        li.querySelector(".delete-btn")
            .addEventListener("click", () => {
                deleteTask(task.id);
            });

        li.querySelector(".edit-btn")
            .addEventListener("click", () => {
                editTask(task.id);
            });

        taskList.appendChild(li);
    });

    updateStats();
}

/* ---------------------- SEARCH ---------------------- */

searchInput.addEventListener("input", renderTasks);

/* ---------------------- FILTER BUTTONS ---------------------- */

document
.querySelectorAll(".filter-tab")
.forEach(btn => {

    btn.addEventListener("click", () => {

        document
        .querySelectorAll(".filter-tab")
        .forEach(tab =>
            tab.classList.remove("filter-tab--active")
        );

        btn.classList.add("filter-tab--active");

        currentFilter = btn.dataset.filter;

        renderTasks();
    });
});

/* ---------------------- DARK MODE ---------------------- */

const savedTheme =
    localStorage.getItem("theme") || "light";

document.documentElement.setAttribute(
    "data-theme",
    savedTheme
);

themeToggle.addEventListener("click", () => {

    const current =
        document.documentElement.getAttribute("data-theme");

    const next =
        current === "light" ? "dark" : "light";

    document.documentElement.setAttribute(
        "data-theme",
        next
    );

    localStorage.setItem("theme", next);
});

/* ---------------------- CLEAR ALL ---------------------- */

clearAllBtn.addEventListener("click", () => {

    if (!confirm("Delete all tasks?")) return;

    tasks = [];

    saveTasks();

    renderTasks();

    showToast("All Tasks Deleted");
});

/* ---------------------- CLOCK ---------------------- */

function updateClock() {

    const now = new Date();

    document.getElementById("clockTime")
        .textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    document.getElementById("clockDate")
        .textContent =
        now.toDateString();
}

setInterval(updateClock, 1000);

updateClock();

/* ---------------------- QUOTES ---------------------- */

const quotes = [
    "Focus on progress, not perfection.",
    "Small steps every day.",
    "Discipline creates freedom.",
    "Done is better than perfect.",
    "Success starts with action."
];

document.getElementById("quoteText")
.textContent =
quotes[Math.floor(Math.random() * quotes.length)];

/* ---------------------- EVENTS ---------------------- */

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", e => {

    if (e.key === "Enter") {
        addTask();
    }
});

/* ---------------------- INIT ---------------------- */

renderTasks();