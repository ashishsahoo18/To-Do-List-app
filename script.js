// Elements
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Add Task
function addTask() {
    const text = taskInput.value.trim();

    if (!text) {
        alert("Please enter a task");
        return;
    }

    const task = {
        id: Date.now(),
        text: text,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    taskInput.value = "";
}

// Save to Local Storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Delete Task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// Toggle Complete
function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();
    renderTasks();
}

// Render Tasks
function renderTasks() {

    taskList.innerHTML = "";

    if(tasks.length === 0){
        emptyState.classList.add("is-visible");
    } else {
        emptyState.classList.remove("is-visible");
    }

    tasks.forEach(task => {

        const li = document.createElement("li");
        li.className = `task-item ${task.completed ? "is-done" : ""}`;

        li.innerHTML = `
            <button class="task-check">
                ✔
            </button>

            <div class="task-body">
                <div class="task-text">${task.text}</div>
            </div>

            <div class="task-actions">
                <button class="task-action-btn delete-btn">
                    🗑
                </button>
            </div>
        `;

        li.querySelector(".task-check").addEventListener("click", () => {
            toggleTask(task.id);
        });

        li.querySelector(".delete-btn").addEventListener("click", () => {
            deleteTask(task.id);
        });

        taskList.appendChild(li);
    });
}

// Events
addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter"){
        addTask();
    }
});

renderTasks();