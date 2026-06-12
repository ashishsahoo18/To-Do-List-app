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
/* ==========================================================
RENDER
========================================================== */

function render(){

const query=

searchQuery
.toLowerCase();

const visible=

tasks.filter(
t=>{

if(
query
&&
!t.text
.toLowerCase()
.includes(
query
)
)
return false;

if(
filter==='pending'
)
return !t.completed;

if(
filter==='completed'
)
return t.completed;

if(
filter==='overdue'
)
return isOverdue(
t
);

return true;

}
);



statTotal.textContent=
tasks.length;

statDone.textContent=
tasks.filter(
t=>
t.completed
).length;

statPending.textContent=
tasks.filter(
t=>
!t.completed
).length;



const pct=

tasks.length

?

Math.round(

tasks.filter(
t=>
t.completed
).length

/

tasks.length

*

100

)

:

0;



progressPct.textContent=
pct+'%';

progressFill.style.width=
pct+'%';



taskList.innerHTML='';



if(
!visible.length
){

emptyState
.classList
.add(
'is-visible'
);

return;

}



emptyState
.classList
.remove(
'is-visible'
);



visible.forEach(
task=>{

const li=
document.createElement(
'li'
);

li.className=

'task-item'

+

(
task.completed

?

' is-done'

:

''

);

li.draggable=true;

li.dataset.id=
task.id;



li.innerHTML=`

<div class="task-body">

<div class="task-text">

${escapeHtml(
task.text
)}

</div>

<div class="task-meta">

<span>

${task.priority}

</span>

${
task.dueDate

?

`<span>

${task.dueDate}

</span>`

:

''

}

<span>

${timeAgo(
task.createdAt
)}

</span>

</div>

</div>


<div class="task-actions">

<button
data-toggle>

✓

</button>

<button
data-delete>

🗑

</button>

</div>

`;



li
.querySelector(
'[data-toggle]'
)
.onclick=
()=>
toggleTask(
task.id
);



li
.querySelector(
'[data-delete]'
)
.onclick=
()=>
deleteTask(
task.id
);



taskList.append(
li
);

}

);

}



/* ==========================================================
DRAG DROP
========================================================== */

let drag=null;



taskList.addEventListener(
'dragstart',
e=>{

drag=
e.target;

}
);



taskList.addEventListener(
'dragover',
e=>{

e.preventDefault();

}
);



taskList.addEventListener(
'drop',
e=>{

const target=

e.target.closest(
'.task-item'
);

if(
target
&&
drag
){

taskList.insertBefore(
drag,
target
);

}

saveTasks();

});



/* ==========================================================
EXPORT
========================================================== */

function download(
name,
content,
type
){

const blob=

new Blob(
[
content
],
{
type
}
);

const a=
document.createElement(
'a'
);

a.href=

URL
.createObjectURL(
blob
);

a.download=
name;

a.click();

}



function exportTxtFile(){

download(

'tasks.txt',

JSON.stringify(
tasks,
null,
2
),

'text/plain'

);

}



function exportJsonFile(){

download(

'tasks.json',

JSON.stringify(
tasks,
null,
2
),

'application/json'

);

}



/* ==========================================================
IMPORT
========================================================== */

function importTasks(){

importFile.click();

}



function readImport(
e
){

const file=
e.target.files[0];

if(
!file
)
return;



const reader=
new FileReader();



reader.onload=
()=>{

try{

tasks=

JSON.parse(
reader.result
);

saveTasks();

render();

}

catch{

showToast(
'Invalid file'
);

}

};



reader.readAsText(
file
);

}



/* ==========================================================
POMODORO
========================================================== */

function updateTimer(){

const m=

Math.floor(
focusSeconds
/
60
);

const s=

String(

focusSeconds
%
60

)
.padStart(
2,
'0'
);

timer.textContent=

`${m}:${s}`;

}



function startPomodoro(){

clearInterval(
focusInterval
);

focusSeconds=
1500;

updateTimer();



focusInterval=

setInterval(
()=>{

focusSeconds--;

updateTimer();

if(
focusSeconds
<=0
){

clearInterval(
focusInterval
);

notify(
'Focus complete'
);

}

},
1000
);

}



/* ==========================================================
TOAST
========================================================== */

function showToast(
msg,
undo=false
){

toastMsg.textContent=
msg;

toast.classList
.add(
'is-visible'
);

toastUndo.style.display=

undo

?

'inline-flex'

:

'none';



clearTimeout(
toastTimer
);

toastTimer=

setTimeout(
()=>{

toast
.classList
.remove(
'is-visible'
);

},
3000
);

}



/* ==========================================================
EVENTS
========================================================== */

function bindEvents(){

addTaskBtn.onclick=
addTask;

taskInput.onkeydown=
e=>{

if(
e.key==='Enter'
)
addTask();

};



taskInput.oninput=
()=>{

charCount.textContent=

160

-

taskInput.value.length;

};



searchInput.oninput=
e=>{

searchQuery=
e.target.value;

render();

};



filterTabs.forEach(
t=>{

t.onclick=
()=>{

filter=
t.dataset.filter;

filterTabs.forEach(
x=>
x.classList.remove(
'filter-tab--active'
)
);

t.classList.add(
'filter-tab--active'
);

render();

};

});



themeToggle.onclick=
toggleTheme;

clearAllBtn.onclick=
()=>{

modalOverlay
.classList
.add(
'is-open'
);

};

modalCancel.onclick=
()=>{

modalOverlay
.classList
.remove(
'is-open'
);

};

modalConfirm.onclick=
clearAll;



toastUndo.onclick=
undoDelete;



exportTxt.onclick=
exportTxtFile;

exportJson.onclick=
exportJsonFile;

importJson.onclick=
importTasks;

importFile.onchange=
readImport;

startTimer.onclick=
startPomodoro;

}



/* ==========================================================
BOOT
========================================================== */

document
.addEventListener(
'DOMContentLoaded',
init
);