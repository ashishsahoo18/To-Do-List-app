/* ==========================================================
   FOKUS — script.js
   PART 1
========================================================== */

'use strict';

/* ───────── STORAGE ───────── */

const STORAGE_TASKS='fokus_tasks_v3';

const STORAGE_THEME='fokus_theme';



/* ───────── STATE ───────── */

let tasks=[];

let filter='all';

let searchQuery='';

let undoStack=null;

let undoTimer=null;

let toastTimer=null;



/* Pomodoro */

let focusInterval=null;

let focusSeconds=1500;



/* ───────── QUOTES ───────── */

const QUOTES=[

'Small progress is still progress.',

'Done beats perfect.',

'Focus creates results.',

'Consistency compounds.',

'Action beats intention.',

'Stay focused. Ship things.',

'One task at a time.',

'Start before you feel ready.'

];


/* ==========================================================
DOM
========================================================== */

const taskInput=
document.getElementById(
'taskInput'
);

const dueDateInput=
document.getElementById(
'dueDateInput'
);

const prioritySelect=
document.getElementById(
'prioritySelect'
);

const addTaskBtn=
document.getElementById(
'addTaskBtn'
);

const taskList=
document.getElementById(
'taskList'
);

const emptyState=
document.getElementById(
'emptyState'
);

const searchInput=
document.getElementById(
'searchInput'
);

const filterTabs=
document.querySelectorAll(
'.filter-tab'
);

const clearAllBtn=
document.getElementById(
'clearAllBtn'
);

const charCount=
document.getElementById(
'charCount'
);


/* Stats */

const statTotal=
document.getElementById(
'statTotal'
);

const statDone=
document.getElementById(
'statDone'
);

const statPending=
document.getElementById(
'statPending'
);

const progressFill=
document.getElementById(
'progressFill'
);

const progressPct=
document.getElementById(
'progressPct'
);


/* Clock */

const clockTime=
document.getElementById(
'clockTime'
);

const clockDate=
document.getElementById(
'clockDate'
);

const quoteText=
document.getElementById(
'quoteText'
);


/* Theme */

const themeToggle=
document.getElementById(
'themeToggle'
);

const themeLabel=
document.getElementById(
'themeLabel'
);


/* Modal */

const modalOverlay=
document.getElementById(
'modalOverlay'
);

const modalCancel=
document.getElementById(
'modalCancel'
);

const modalConfirm=
document.getElementById(
'modalConfirm'
);


/* Toast */

const toast=
document.getElementById(
'toast'
);

const toastMsg=
document.getElementById(
'toastMsg'
);

const toastUndo=
document.getElementById(
'toastUndo'
);


/* Export */

const exportTxt=
document.getElementById(
'exportTxt'
);

const exportJson=
document.getElementById(
'exportJson'
);


/* Import */

const importJson=
document.getElementById(
'importJson'
);

const importFile=
document.getElementById(
'importFile'
);


/* Pomodoro */

const timer=
document.getElementById(
'timer'
);

const startTimer=
document.getElementById(
'startTimer'
);



/* ==========================================================
INIT
========================================================== */

function init(){

loadTasks();

loadTheme();

startClock();

setQuote();

render();

bindEvents();

requestNotify();

updateTimer();

}



/* ==========================================================
STORAGE
========================================================== */

function loadTasks(){

try{

tasks=

JSON.parse(

localStorage.getItem(
STORAGE_TASKS
)

)

||

[];

}

catch{

tasks=[];

}

}



function saveTasks(){

localStorage.setItem(

STORAGE_TASKS,

JSON.stringify(
tasks
)

);

}



/* ==========================================================
THEME
========================================================== */

function loadTheme(){

const mode=

localStorage.getItem(
STORAGE_THEME
)

||

'light';

document.documentElement
.setAttribute(
'data-theme',
mode
);

themeLabel.textContent=

mode==='dark'

?

'Dark Mode'

:

'Light Mode';

}



function toggleTheme(){

const current=

document.documentElement
.getAttribute(
'data-theme'
);

const next=

current==='dark'

?

'light'

:

'dark';

document.documentElement
.setAttribute(
'data-theme',
next
);

localStorage.setItem(
STORAGE_THEME,
next
);

themeLabel.textContent=

next==='dark'

?

'Dark Mode'

:

'Light Mode';

}
