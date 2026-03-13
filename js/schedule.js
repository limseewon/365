const API = "https://script.google.com/macros/s/AKfycbw4k4ez9aVHSktRdkaiEWe6KokWYHudCGSElNCVBNld8oHFdtq-Hx9-lg_ovIlPD7F3/exec";

// ── 방문자 기록 ──
fetch("https://api.ipify.org?format=json")
  .then(r => r.json())
  .then(data => {
    const ua = encodeURIComponent(navigator.userAgent);
    fetch(`${API}?action=visit&ip=${data.ip}&ua=${ua}`, { mode: "no-cors" });
  })
  .catch(() => { });

// ── 상태 ──
let events = [];
let todos = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// ── 초기화 ──
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("todayBadge").textContent =
    `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  loadEvents();
  loadTodos();
});

// ── 탭 전환 ──
function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("active", c.id === `tab-${tab}`));
  // 탭 전환시 날짜 패널 닫기
  selectedDate = null;
  document.getElementById("dayPanel").style.display = "none";
  renderCalendar();
}

// ══ 캘린더 ══

function loadEvents() {
  fetch(`${API}?action=getEvents`, { mode: "no-cors" })
    .catch(() => { });
  // no-cors라 응답 못 읽음 → JSONP 방식으로 우회
  const s = document.createElement("script");
  s.src = `${API}?action=getEvents&callback=onEventsLoaded`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

function onEventsLoaded(data) {
  events = Array.isArray(data) ? data : [];
  renderCalendar();
}

function renderCalendar() {
  document.getElementById("calTitle").textContent =
    `${currentYear}년 ${currentMonth + 1}월`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

  const container = document.getElementById("calDays");
  container.innerHTML = "";

  // 빈 칸
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    container.appendChild(el);
  }

  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = events.filter(e => String(e.date) === dateStr);
    const dow = new Date(currentYear, currentMonth, d).getDay();

    const el = document.createElement("div");
    el.className = "cal-day";
    if (dateStr === todayStr) el.classList.add("today");
    if (dateStr === selectedDate) el.classList.add("selected");
    if (dow === 0) el.classList.add("sunday");
    if (dow === 6) el.classList.add("saturday");

    el.innerHTML = `
      <div class="cal-day-num">${d}</div>
      <div class="cal-dot-wrap">${dayEvents.slice(0, 3).map(() => `<div class="cal-dot"></div>`).join("")}</div>
    `;
    el.onclick = () => selectDate(dateStr);
    container.appendChild(el);
  }

  if (selectedDate) renderDayPanel();
}

function selectDate(dateStr) {
  selectedDate = selectedDate === dateStr ? null : dateStr;
  renderCalendar();
  const panel = document.getElementById("dayPanel");
  if (selectedDate) {
    panel.style.display = "block";
    renderDayPanel();
  } else {
    panel.style.display = "none";
  }
}

function renderDayPanel() {
  if (!selectedDate) return;
  const [y, m, d] = selectedDate.split("-");
  document.getElementById("dayPanelTitle").textContent = `${parseInt(m)}월 ${parseInt(d)}일`;

  const dayEvs = events.filter(e => String(e.date) === selectedDate);
  const container = document.getElementById("dayEvents");

  if (dayEvs.length === 0) {
    container.innerHTML = `<div class="event-empty">일정이 없어요 🌿</div>`;
    return;
  }

  container.innerHTML = dayEvs.map(ev => `
    <div class="event-item">
      <div class="event-bar"></div>
      <div class="event-info">
        <div class="event-title">${escHtml(ev.title)}</div>
        ${ev.memo ? `<div class="event-memo">${escHtml(ev.memo)}</div>` : ""}
      </div>
      <button class="event-del" onclick="deleteEvent('${ev.id}')">✕</button>
    </div>
  `).join("");
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  selectedDate = null;
  document.getElementById("dayPanel").style.display = "none";
  renderCalendar();
}

// ── 일정 모달 ──
function openEventModal() {
  document.getElementById("eventDate").value = selectedDate || todayStr;
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventMemo").value = "";
  document.getElementById("eventModal").style.display = "flex";
  setTimeout(() => document.getElementById("eventTitle").focus(), 100);
}
function closeEventModal() {
  document.getElementById("eventModal").style.display = "none";
}

function saveEvent() {
  const date = document.getElementById("eventDate").value;
  const title = document.getElementById("eventTitle").value.trim();
  const memo = document.getElementById("eventMemo").value.trim();
  if (!date || !title) { alert("날짜와 제목을 입력해주세요!"); return; }

  const id = Date.now().toString();
  events.push({ id, date, title, memo });
  renderCalendar();
  closeEventModal();

  const s = document.createElement("script");
  s.src = `${API}?action=addEvent&date=${date}&title=${encodeURIComponent(title)}&memo=${encodeURIComponent(memo)}&callback=onSaved`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

function onSaved() { }

function deleteEvent(id) {
  if (!confirm("일정을 삭제할까요?")) return;
  events = events.filter(e => e.id != id);
  renderCalendar();

  const s = document.createElement("script");
  s.src = `${API}?action=deleteEvent&id=${id}&callback=onSaved`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

// ══ 할일 ══

function loadTodos() {
  const s = document.createElement("script");
  s.src = `${API}?action=getTodos&callback=onTodosLoaded`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

function onTodosLoaded(data) {
  todos = Array.isArray(data) ? data : [];
  renderTodos();
}

function renderTodos() {
  const container = document.getElementById("todoList");
  if (todos.length === 0) {
    container.innerHTML = `<div class="loading-msg">할일이 없어요 ✨</div>`;
    return;
  }
  container.innerHTML = todos.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}" id="todo-${t.id}">
      <div class="todo-check" onclick="toggleTodo('${t.id}')">${t.done ? '✓' : ''}</div>
      <div class="todo-text">${escHtml(t.text)}</div>
      <button class="todo-del" onclick="deleteTodo('${t.id}')">✕</button>
    </div>
  `).join("");
}

function addTodo() {
  const input = document.getElementById("todoInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  const id = Date.now().toString();
  todos.push({ id, text, done: false });
  renderTodos();

  const s = document.createElement("script");
  s.src = `${API}?action=addTodo&text=${encodeURIComponent(text)}&callback=onSaved`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

function toggleTodo(id) {
  const t = todos.find(t => t.id == id);
  if (!t) return;
  t.done = !t.done;
  renderTodos();

  const s = document.createElement("script");
  s.src = `${API}?action=toggleTodo&id=${id}&callback=onSaved`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id != id);
  renderTodos();

  const s = document.createElement("script");
  s.src = `${API}?action=deleteTodo&id=${id}&callback=onSaved`;
  document.head.appendChild(s);
  setTimeout(() => s.remove(), 5000);
}

// ── 유틸 ──
function escHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}