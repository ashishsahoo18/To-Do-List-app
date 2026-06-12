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
/* ==========================================================
CLOCK + QUOTE
========================================================== */

function startClock(){

function tick(){

const now=
new Date();

clockTime.textContent=

now.toLocaleTimeString(
[],
{
hour:'2-digit',
minute:'2-digit'
}
);

clockDate.textContent=

now.toLocaleDateString(
[],
{
weekday:'long',
month:'long',
day:'numeric'
}
);

}

tick();

setInterval(
tick,
1000
);

}



function setQuote(){

quoteText.textContent=

QUOTES[
Math.floor(
Math.random()
*
QUOTES.length
)
];

}



/* ==========================================================
NOTIFICATIONS
========================================================== */

function requestNotify(){

if(
'Notification'
in window
){

Notification
.requestPermission();

}

}



function notify(
msg
){

if(

'Notification'
in window

&&

Notification.permission
===
'granted'

){

new Notification(
msg
);

}

}



/* ==========================================================
UTILS
========================================================== */

function uid(){

return

Date.now()
.toString(
36
)

+

Math.random()
.toString(
36
)
.slice(
2,
7
);

}



function escapeHtml(
str
){

return str

.replace(
/&/g,
'&amp;'
)

.replace(
/</g,
'&lt;'
)

.replace(
/>/g,
'&gt;'
);

}



function timeAgo(
ts
){

const s=

Math.floor(
(
Date.now()
-
ts
)
/
1000
);

if(
s<60
)
return'now';

if(
s<3600
)
return Math.floor(
s/60
)+'m';

if(
s<86400
)
return Math.floor(
s/3600
)+'h';

return Math.floor(
s/86400
)+'d';

}



/* ==========================================================
TASK HELPERS
========================================================== */

function isOverdue(
task
){

if(
!task.dueDate
||
task.completed
)

return false;

const today=
new Date();

today.setHours(
0,
0,
0,
0
);

const due=
new Date(
task.dueDate
);

return due<today;

}



/* ==========================================================
ADD TASK
========================================================== */

function addTask(){

const text=

taskInput.value
.trim();

if(
!text
)
return;



tasks.unshift({

id:
uid(),

text,

priority:
prioritySelect.value,

completed:
false,

dueDate:

dueDateInput.value

||

null,

createdAt:
Date.now()

});



saveTasks();



taskInput.value='';

dueDateInput.value='';

prioritySelect.value='medium';

charCount.textContent='160';



render();

notify(
'Task added'
);

showToast(
'Task added'
);

}



/* ==========================================================
TASK ACTIONS
========================================================== */

function toggleTask(
id
){

const task=

tasks.find(
t=>
t.id===id
);

if(
!task
)return;

task.completed=

!task.completed;

saveTasks();

render();

}



function deleteTask(
id
){

const index=

tasks.findIndex(
t=>
t.id===id
);

if(
index<0
)
return;



undoStack={

task:
tasks[index],

index

};



tasks.splice(
index,
1
);



saveTasks();

render();



showToast(
'Deleted',
true
);

}



function undoDelete(){

if(
!undoStack
)
return;

tasks.splice(

undoStack.index,

0,

undoStack.task

);

undoStack=null;

saveTasks();

render();

}



/* ==========================================================
CLEAR
========================================================== */

function clearAll(){

tasks=[];

saveTasks();

render();

modalOverlay
.classList
.remove(
'is-open'
);

}