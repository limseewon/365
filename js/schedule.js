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
let diaries = [];
let selectedMood = "";
let selectedMedia = [];

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
  loadDiaries();
});

// ── 탭 전환 ──
function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("active", c.id === `tab-${tab}`));
  selectedDate = null;
  document.getElementById("dayPanel").style.display = "none";
  renderCalendar();
  if (tab === "weather") loadWeather();
}

// ══ 캘린더 ══
function loadEvents() {
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

// ══ 일기 ══
function loadDiaries() {
  try {
    const raw = localStorage.getItem("our_diaries");
    diaries = raw ? JSON.parse(raw) : [];
  } catch (e) { diaries = []; }
  renderDiaries();
}

function saveDiariesToStorage() {
  try {
    localStorage.setItem("our_diaries", JSON.stringify(diaries));
  } catch (e) {
    const slim = diaries.map(d => ({ ...d, media: [] }));
    localStorage.setItem("our_diaries", JSON.stringify(slim));
    alert("미디어 파일이 너무 커서 텍스트만 저장됐어요. 사진/영상은 다시 첨부해주세요 🙏");
  }
}

function renderDiaries() {
  const container = document.getElementById("diaryList");
  if (diaries.length === 0) {
    container.innerHTML = `
      <div class="diary-empty-state">
        <div class="diary-empty-icon">📷</div>
        <p>아직 기록이 없어요</p>
        <p class="diary-empty-sub">오늘의 사진이나 영상을 남겨봐요 🌸</p>
      </div>`;
    return;
  }

  const sorted = [...diaries].sort((a, b) => b.id - a.id);
  container.innerHTML = sorted.map(d => {
    const hasMedia = d.media && d.media.length > 0;
    const firstMedia = hasMedia ? d.media[0] : null;
    const mediaCount = hasMedia ? d.media.length : 0;

    let mediaHtml = "";
    if (hasMedia) {
      if (firstMedia.type === "video") {
        mediaHtml = `
          <div class="diary-card-media-wrap">
            <video src="${firstMedia.dataURL}" muted playsinline preload="metadata"></video>
            <div class="diary-card-video-badge">▶</div>
            ${mediaCount > 1 ? `<div class="diary-card-media-count">+${mediaCount - 1}</div>` : ""}
          </div>`;
      } else {
        mediaHtml = `
          <div class="diary-card-media-wrap">
            <img src="${firstMedia.dataURL}" alt="" />
            ${mediaCount > 1 ? `<div class="diary-card-media-count">+${mediaCount - 1}</div>` : ""}
          </div>`;
      }
    }

    const dateLabel = formatDateLabel(d.date);
    const moodHtml = d.mood ? `<span class="diary-card-mood">${d.mood}</span>` : "";
    const titleHtml = d.title ? `<div class="diary-card-title">${escHtml(d.title)}</div>` : "";
    const previewHtml = d.content ? `<div class="diary-card-preview">${escHtml(d.content)}</div>` : "";

    return `
      <div class="diary-card ${!hasMedia ? 'text-only' : ''}" onclick="openDiaryView('${d.id}')">
        ${mediaHtml}
        <div class="diary-card-body">
          <div class="diary-card-top">
            <span class="diary-card-date">${dateLabel}</span>
            ${moodHtml}
          </div>
          ${titleHtml}
          ${previewHtml}
        </div>
      </div>`;
  }).join("");
}

function openDiaryModal() {
  selectedMood = "";
  selectedMedia = [];
  document.getElementById("diaryDate").value = todayStr;
  document.getElementById("diaryTitle").value = "";
  document.getElementById("diaryContent").value = "";
  document.getElementById("mediaPreviewWrap").innerHTML = "";
  document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
  document.getElementById("diaryModal").style.display = "flex";
  setTimeout(() => document.getElementById("diaryTitle").focus(), 100);
}

function closeDiaryModal() {
  document.getElementById("diaryModal").style.display = "none";
}

function selectMood(btn) {
  document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedMood = btn.dataset.mood;
}

function handleMediaSelect(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  const remaining = 9 - selectedMedia.length;
  const toAdd = files.slice(0, remaining);
  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const isVideo = file.type.startsWith("video/");
      selectedMedia.push({ id: Date.now() + Math.random(), file, dataURL: e.target.result, type: isVideo ? "video" : "image" });
      renderMediaPreview();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = "";
}

function renderMediaPreview() {
  const wrap = document.getElementById("mediaPreviewWrap");
  wrap.innerHTML = selectedMedia.map((m, i) => {
    const mediaEl = m.type === "video"
      ? `<video src="${m.dataURL}" muted playsinline preload="metadata"></video>`
      : `<img src="${m.dataURL}" alt="" />`;
    return `<div class="media-preview-item">${mediaEl}<button class="media-preview-remove" onclick="removeMedia(${i})">✕</button></div>`;
  }).join("");
}

function removeMedia(index) {
  selectedMedia.splice(index, 1);
  renderMediaPreview();
}

function saveDiary() {
  const date = document.getElementById("diaryDate").value;
  const title = document.getElementById("diaryTitle").value.trim();
  const content = document.getElementById("diaryContent").value.trim();
  if (!date) { alert("날짜를 선택해주세요!"); return; }
  if (!title && !content && selectedMedia.length === 0) {
    alert("제목, 내용, 또는 사진/영상 중 하나는 입력해주세요!"); return;
  }
  const id = Date.now().toString();
  diaries.push({ id, date, title, content, mood: selectedMood, media: selectedMedia.map(m => ({ dataURL: m.dataURL, type: m.type })) });
  saveDiariesToStorage();
  renderDiaries();
  closeDiaryModal();
}

function openDiaryView(id) {
  const d = diaries.find(d => d.id === id);
  if (!d) return;
  document.getElementById("diaryViewMood").textContent = d.mood || "";
  document.getElementById("diaryViewDate").textContent = formatDateLabel(d.date);
  document.getElementById("diaryViewTitle").textContent = d.title || "";
  document.getElementById("diaryViewContent").textContent = d.content || "";

  const mediaContainer = document.getElementById("diaryViewMedia");
  if (d.media && d.media.length > 0) {
    mediaContainer.innerHTML = d.media.map(m => {
      const el = m.type === "video"
        ? `<video src="${m.dataURL}" controls playsinline preload="metadata"></video>`
        : `<img src="${m.dataURL}" alt="" />`;
      return `<div class="diary-view-media-item">${el}</div>`;
    }).join("");
  } else {
    mediaContainer.innerHTML = "";
  }
  document.getElementById("diaryViewDelBtn").onclick = () => deleteDiary(id);
  document.getElementById("diaryViewModal").style.display = "flex";
}

function closeDiaryViewModal() {
  document.getElementById("diaryViewModal").style.display = "none";
}

function deleteDiary(id) {
  if (!confirm("이 일기를 삭제할까요?")) return;
  diaries = diaries.filter(d => d.id !== id);
  saveDiariesToStorage();
  renderDiaries();
  closeDiaryViewModal();
}

// ══ 날씨 ══
const LOCATIONS = [
  { name: "hoegi", label: "회기동", desc: "동대문구", lat: 37.5894, lon: 127.0547 },
  { name: "eungam", label: "응암동", desc: "은평구", lat: 37.6019, lon: 126.9196 }
];

// WMO 코드
function wmoInfo(code, isDay = 1) {
  const map = {
    0: { emoji: isDay ? "☀️" : "🌙", text: "맑음" },
    1: { emoji: "🌤️", text: "대체로 맑음" },
    2: { emoji: "⛅", text: "부분 구름" },
    3: { emoji: "☁️", text: "흐림" },
    45: { emoji: "🌫️", text: "안개" },
    48: { emoji: "🌫️", text: "짙은 안개" },
    51: { emoji: "🌦️", text: "이슬비" },
    53: { emoji: "🌦️", text: "이슬비" },
    55: { emoji: "🌧️", text: "강한 이슬비" },
    61: { emoji: "🌧️", text: "가벼운 비" },
    63: { emoji: "🌧️", text: "비" },
    65: { emoji: "🌧️", text: "강한 비" },
    71: { emoji: "🌨️", text: "가벼운 눈" },
    73: { emoji: "❄️", text: "눈" },
    75: { emoji: "❄️", text: "강한 눈" },
    77: { emoji: "🌨️", text: "눈송이" },
    80: { emoji: "🌦️", text: "소나기" },
    81: { emoji: "🌧️", text: "소나기" },
    82: { emoji: "⛈️", text: "강한 소나기" },
    85: { emoji: "🌨️", text: "눈 소나기" },
    86: { emoji: "❄️", text: "강한 눈 소나기" },
    95: { emoji: "⛈️", text: "뇌우" },
    96: { emoji: "⛈️", text: "우박 뇌우" },
    99: { emoji: "⛈️", text: "강한 우박 뇌우" },
  };
  return map[code] || { emoji: "🌡️", text: "알 수 없음" };
}

function windDir(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
const windDirKo = { N: "북", NE: "북동", E: "동", SE: "남동", S: "남", SW: "남서", W: "서", NW: "북서" };

// ── API 호출 (날씨 + 대기질 동시) ──
async function fetchWeatherForLocation(loc) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,` +
    `wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,surface_pressure` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,` +
    `uv_index_max,wind_speed_10m_max,sunrise,sunset` +
    `&timezone=Asia%2FSeoul&forecast_days=3`;

  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=pm10,pm2_5,us_aqi` +
    `&timezone=Asia%2FSeoul`;

  const [wRes, aRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
  if (!wRes.ok) throw new Error("날씨 요청 실패");
  const weather = await wRes.json();
  const air = aRes.ok ? await aRes.json() : null;
  return { weather, air };
}

// ── 대기질 등급 ──
function pmGrade(pm10, pm25) {
  const pm = Math.max(pm10 ?? 0, (pm25 ?? 0) * 1.5);
  if (pm <= 30) return { text: "좋음", color: "#4caf50", emoji: "😊", bg: "#f0faf0" };
  if (pm <= 80) return { text: "보통", color: "#d4a800", emoji: "🙂", bg: "#fffbea" };
  if (pm <= 150) return { text: "나쁨", color: "#ff7043", emoji: "😷", bg: "#fff3f0" };
  return { text: "매우 나쁨", color: "#c62828", emoji: "🚫", bg: "#fce4e4" };
}

function aqiGrade(aqi) {
  if (!aqi) return null;
  if (aqi <= 50) return { text: "좋음", color: "#4caf50" };
  if (aqi <= 100) return { text: "보통", color: "#d4a800" };
  if (aqi <= 150) return { text: "민감군 주의", color: "#ff9800" };
  if (aqi <= 200) return { text: "나쁨", color: "#f44336" };
  return { text: "매우 나쁨", color: "#9c27b0" };
}

// ── 자외선 ──
function uvGrade(uv) {
  if (uv <= 2) return { text: "낮음", color: "#4caf50", comment: "자외선 걱정 없어요 ✌️" };
  if (uv <= 5) return { text: "보통", color: "#d4a800", comment: "선크림 바르는 게 좋아요 🧴" };
  if (uv <= 7) return { text: "높음", color: "#ff9800", comment: "외출 시 선크림 필수예요 ☀️" };
  if (uv <= 10) return { text: "매우 높음", color: "#f44336", comment: "모자·선글라스 챙겨요 🕶️" };
  return { text: "위험", color: "#9c27b0", comment: "가능하면 외출 자제해요 🚨" };
}

// ── 바람 강도 ──
function windComment(speed, gusts) {
  if (speed < 4) return "바람이 거의 없어서 쾌적해요 🍃";
  if (speed < 9) return `살랑살랑 바람이 불어요 (${Math.round(speed)}km/h) 🌬️`;
  if (speed < 14) return `바람이 좀 있어요 (${Math.round(speed)}km/h), 가벼운 옷 주의!`;
  if (speed < 20) return `바람이 강해요 (${Math.round(speed)}km/h) — 머리카락 날릴 수 있어요 💨`;
  return `강풍 주의! (${Math.round(speed)}km/h) 🌪️ 우산 쓰기 힘들 수 있어요`;
}

// ── 습도 코멘트 ──
function humidityComment(rh) {
  if (rh < 30) return `건조해요 (${rh}%) — 수분 자주 보충해요 💧`;
  if (rh < 50) return `쾌적한 습도예요 (${rh}%) 😊`;
  if (rh < 70) return `습도가 적당해요 (${rh}%)`;
  if (rh < 85) return `습해요 (${rh}%) — 불쾌지수 높을 수 있어요 😓`;
  return `매우 습해요 (${rh}%) — 끈적끈적할 거예요 🥵`;
}

// ── 체감온도 코멘트 ──
function feelsComment(feels, actual) {
  const diff = Math.round(feels - actual);
  const base = `체감 ${Math.round(feels)}°C`;
  if (Math.abs(diff) <= 1) return `${base} (실제와 비슷해요)`;
  if (diff <= -5) return `${base} — 실제보다 훨씬 춥게 느껴져요 🥶`;
  if (diff < 0) return `${base} — 체감은 좀 더 추워요`;
  if (diff >= 5) return `${base} — 실제보다 많이 덥게 느껴져요 🥵`;
  return `${base} — 체감은 좀 더 더워요`;
}

// ── 비 구간 분석 ──
function buildRainComment(hourly, datePrefix) {
  const nowHour = new Date().getHours();
  const isToday = datePrefix === todayStr;

  const hours = hourly.time
    .map((t, i) => ({ hour: parseInt(t.slice(11, 13)), prob: hourly.precipitation_probability[i], precip: hourly.precipitation[i], t }))
    .filter(h => h.t.startsWith(datePrefix));

  const remaining = isToday ? hours.filter(h => h.hour >= nowHour) : hours;
  if (remaining.length === 0) return null;

  const RAIN_THR = 40;
  const segments = [];
  let cur = null;

  remaining.forEach(h => {
    const rainy = h.prob >= RAIN_THR || h.precip >= 0.1;
    if (!cur || cur.rainy !== rainy) {
      if (cur) segments.push(cur);
      cur = { rainy, start: h.hour, end: h.hour, maxProb: h.prob, maxPrecip: h.precip };
    } else {
      cur.end = h.hour;
      cur.maxProb = Math.max(cur.maxProb, h.prob);
      cur.maxPrecip = Math.max(cur.maxPrecip, h.precip);
    }
  });
  if (cur) segments.push(cur);

  const anyRain = segments.some(s => s.rainy);
  if (!anyRain) {
    const maxP = Math.max(...remaining.map(h => h.prob));
    return {
      type: "clear", text: maxP < 10
        ? "비 소식 없어요 — 우산 필요 없어요 ☂️"
        : `비 확률 최대 ${maxP}% — 우산 없어도 될 것 같아요`
    };
  }

  const lines = [];
  const firstSeg = segments[0];
  if (firstSeg.rainy && isToday && firstSeg.start <= nowHour) {
    lines.push(`지금 비가 오고 있어요 (${firstSeg.maxProb}%)`);
  }

  segments.forEach((seg, idx) => {
    if (idx === 0 && seg.rainy && isToday && seg.start <= nowHour) return;
    const s = seg.start === nowHour && isToday ? "지금" : `${seg.start}시`;
    const e = seg.end < 23 ? `${seg.end + 1}시` : "자정";
    if (seg.rainy) {
      const intensity = seg.maxPrecip >= 5 ? "강하게 " : seg.maxPrecip < 0.5 ? "약하게 " : "";
      lines.push(`${s} ~ ${e} 비 ${intensity}올 수 있어요 (${seg.maxProb}%)`);
    } else if (idx > 0) {
      lines.push(`${s}부터 비 그칠 것 같아요`);
    }
  });

  const last = segments[segments.length - 1];
  if (last.rainy && last.end >= 22) lines.push("저녁 내내 이어져요 — 우산 꼭 챙겨요!");

  return { type: "rain", lines };
}

// ── 시간별 파싱 ──
function parseHourlyForDate(hourly, datePrefix) {
  const seen = new Set();
  return hourly.time
    .map((t, i) => ({
      t,
      hour: parseInt(t.slice(11, 13)),
      prob: hourly.precipitation_probability[i],
      precip: hourly.precipitation[i],
      temp: hourly.temperature_2m[i],
      wind: hourly.wind_speed_10m[i],
      code: hourly.weather_code[i]
    }))
    .filter(h => {
      if (!h.t.startsWith(datePrefix)) return false;
      if (seen.has(h.hour)) return false;
      seen.add(h.hour);
      return true;
    });
}

// ── 시간별 막대 하나 ──
function renderHourlyItem(h, isNow) {
  const pct = h.prob;
  const isRainy = pct >= 40 || h.precip >= 0.1;
  const isHeavy = pct >= 70 || h.precip >= 3;
  const fillClass = isHeavy ? 'heavy-rain' : isRainy ? 'has-rain' : 'no-rain';
  const barH = Math.max(pct, 4);
  const probClass = pct === 0 ? 'zero' : isRainy ? 'rainy' : '';
  const info = wmoInfo(h.code);
  const label = isNow ? '지금' : `${h.hour}시`;
  return `
    <div class="hourly-bar-item ${isNow ? 'hourly-now' : ''}">
      <div class="hourly-prob ${probClass}">${pct}%</div>
      <div class="hourly-bar-track">
        <div class="hourly-bar-fill ${fillClass}" style="height:${barH}%"></div>
      </div>
      <div class="hourly-emoji">${info.emoji}</div>
      <div class="hourly-temp">${Math.round(h.temp)}°</div>
      <div class="hourly-time">${label}</div>
    </div>`;
}

// ── 오늘/내일 탭 차트 ──
function buildHourlySection(hourly, cardId) {
  const nowHour = new Date().getHours();
  const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
  const tmrStr = tmr.toISOString().slice(0, 10);

  // 오늘: 0시~23시 전체 (현재 시간 강조), 내일: 0~23시
  const todayData = parseHourlyForDate(hourly, todayStr);
  const tmrData = parseHourlyForDate(hourly, tmrStr);

  const todayBars = todayData.map(h => renderHourlyItem(h, h.hour === nowHour)).join("");
  const tmrBars = tmrData.map(h => renderHourlyItem(h, false)).join("");

  const id = `hbar_${cardId}`;
  return `
    <div class="hourly-section">
      <div class="hourly-header">
        <span class="hourly-title">시간별 강수확률 💧</span>
        <div class="hourly-day-tabs">
          <button class="hourly-day-tab active" onclick="switchHourlyTab('${id}',this)">오늘</button>
          <button class="hourly-day-tab" onclick="switchHourlyTab('${id}',this)">내일</button>
        </div>
      </div>
      <div class="hourly-scroll-wrap">
        <div id="${id}_0" class="hourly-bar-wrap">${todayBars}</div>
        <div id="${id}_1" class="hourly-bar-wrap" style="display:none">${tmrBars}</div>
      </div>
      <div class="hourly-legend">
        <span class="legend-dot rain"></span><span>비 올 확률 높음</span>
        <span class="legend-dot clear"></span><span>비 없음</span>
      </div>
    </div>`;
}

function switchHourlyTab(id, btn) {
  const tabs = btn.closest('.hourly-day-tabs').querySelectorAll('.hourly-day-tab');
  let idx = 0;
  tabs.forEach((t, i) => { t.classList.remove('active'); if (t === btn) idx = i; });
  btn.classList.add('active');
  [0, 1].forEach(i => {
    const el = document.getElementById(`${id}_${i}`);
    if (el) el.style.display = i === idx ? 'flex' : 'none';
  });
}

// ── 종합 날씨 코멘트 카드들 ──
function buildCommentCards(weather, air, daily) {
  const c = weather.current;
  const nowHour = new Date().getHours();
  const uv = uvGrade(c.uv_index);
  const pm = air ? pmGrade(air.current.pm10, air.current.pm2_5) : null;
  const sunrise = daily.sunrise?.[0]?.slice(11, 16);
  const sunset = daily.sunset?.[0]?.slice(11, 16);

  const cards = [];

  // 🌡️ 기온
  const tempDiff = Math.round(c.apparent_temperature - c.temperature_2m);
  const tempEmoji = c.temperature_2m >= 28 ? "🔥" : c.temperature_2m >= 20 ? "😊" : c.temperature_2m >= 10 ? "🍂" : c.temperature_2m >= 0 ? "🧥" : "🥶";
  cards.push({ icon: tempEmoji, label: "기온", value: `${Math.round(c.temperature_2m)}°C`, comment: feelsComment(c.apparent_temperature, c.temperature_2m), color: "#ff7043" });

  // 💨 바람
  const wSpeed = c.wind_speed_10m;
  const wGusts = c.wind_gusts_10m;
  const wDirLabel = windDirKo[windDir(c.wind_direction_10m)] || "";
  const windEmoji = wSpeed < 4 ? "🍃" : wSpeed < 14 ? "🌬️" : "💨";
  cards.push({ icon: windEmoji, label: "바람", value: `${wDirLabel} ${Math.round(wSpeed)}km/h`, comment: windComment(wSpeed, wGusts), color: "#5c8fd4" });

  // 💧 습도
  const rhEmoji = c.relative_humidity_2m < 40 ? "🏜️" : c.relative_humidity_2m > 75 ? "🌊" : "💧";
  cards.push({ icon: rhEmoji, label: "습도", value: `${c.relative_humidity_2m}%`, comment: humidityComment(c.relative_humidity_2m), color: "#42a5f5" });

  // ☀️ 자외선
  cards.push({ icon: "🌞", label: "자외선", value: `${Math.round(c.uv_index)} (${uv.text})`, comment: uv.comment, color: uv.color });

  // 🌫️ 미세먼지
  if (pm) {
    const pm10v = Math.round(air.current.pm10 ?? 0);
    const pm25v = Math.round(air.current.pm2_5 ?? 0);
    const maskComment = pm.text === "좋음" || pm.text === "보통"
      ? "마스크 없어도 괜찮아요 😊"
      : "마스크 착용 권장해요 😷";
    cards.push({ icon: pm.emoji, label: "미세먼지", value: `PM10 ${pm10v} · PM2.5 ${pm25v}`, comment: `${pm.text} — ${maskComment}`, color: pm.color, bg: pm.bg });
  }

  // 🌅 일출/일몰
  if (sunrise && sunset) {
    const nowMins = nowHour * 60 + new Date().getMinutes();
    const [srH, srM] = sunrise.split(":").map(Number);
    const [ssH, ssM] = sunset.split(":").map(Number);
    const srMins = srH * 60 + srM, ssMins = ssH * 60 + ssM;
    const isDaytime = nowMins >= srMins && nowMins < ssMins;
    const timeToSunset = ssMins - nowMins;
    const sunComment = isDaytime
      ? (timeToSunset < 60 ? `곧 해가 져요 — ${sunset}에 일몰 🌅` : `일몰까지 ${Math.floor(timeToSunset / 60)}시간 ${timeToSunset % 60}분 남았어요`)
      : `내일 ${sunrise}에 해 뜨고 ${sunset}에 저요 🌄`;
    cards.push({ icon: "🌅", label: "일출·일몰", value: `${sunrise} · ${sunset}`, comment: sunComment, color: "#ff9800" });
  }

  return cards.map(card => `
    <div class="wx-comment-card" style="${card.bg ? `background:${card.bg}` : ''}">
      <div class="wx-cc-left">
        <span class="wx-cc-icon">${card.icon}</span>
        <div>
          <div class="wx-cc-label">${card.label}</div>
          <div class="wx-cc-value" style="color:${card.color}">${card.value}</div>
        </div>
      </div>
      <div class="wx-cc-comment">${card.comment}</div>
    </div>`).join("");
}

// ── 날씨 카드 렌더 ──
function renderWeatherCard(loc, wdata) {
  const { weather: data, air } = wdata;
  const c = data.current;
  const d = data.daily;
  const h = data.hourly;
  const info = wmoInfo(c.weather_code, c.is_day);

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // 5일 예보
  const forecastHtml = d.time.map((dateStr, i) => {
    const isToday = i === 0;
    const dayLabel = isToday ? "오늘" : dayNames[new Date(dateStr).getDay()];
    const fi = wmoInfo(d.weather_code[i]);
    const rp = d.precipitation_probability_max[i];
    return `
      <div class="forecast-item ${isToday ? 'forecast-today' : ''}">
        <div class="forecast-day">${dayLabel}</div>
        <div class="forecast-emoji">${fi.emoji}</div>
        <div class="forecast-temp">
          <span class="forecast-high">${Math.round(d.temperature_2m_max[i])}°</span>
          <span class="forecast-low">${Math.round(d.temperature_2m_min[i])}°</span>
        </div>
        <div class="forecast-rain ${rp > 20 ? 'active' : ''}">${rp > 20 ? rp + '%' : '-'}</div>
      </div>`;
  }).join("");

  // 비 코멘트
  const rain = buildRainComment(h, todayStr);
  const rainHtml = rain
    ? `<div class="wx-rain-banner ${rain.type === 'clear' ? 'clear' : 'rain'}">
        <span class="wx-rain-icon">${rain.type === 'clear' ? '☂️' : '🌧️'}</span>
        <div class="wx-rain-text">
          ${rain.type === 'clear'
      ? rain.text
      : rain.lines.map(l => `<div>${l}</div>`).join("")}
        </div>
      </div>`
    : "";

  // 코멘트 카드들
  const commentHtml = buildCommentCards(data, air, d);

  // 시간별 차트
  const hourlyHtml = buildHourlySection(h, loc.name);

  return `
    <div class="weather-card">

      <!-- 헤더 -->
      <div class="wx-header">
        <div class="wx-header-left">
          <div class="wx-location">${loc.label}</div>
          <div class="wx-location-sub">${loc.desc}</div>
          <div class="wx-temp-big">${Math.round(c.temperature_2m)}<span class="wx-deg">°</span></div>
        </div>
        <div class="wx-header-right">
          <div class="wx-main-emoji">${info.emoji}</div>
          <div class="wx-condition">${info.text}</div>
          <div class="wx-hilo">
            <span class="hi">${Math.round(d.temperature_2m_max[0])}°</span>
            <span class="lo">${Math.round(d.temperature_2m_min[0])}°</span>
          </div>
        </div>
      </div>

      <!-- 비 배너 -->
      ${rainHtml}

      <!-- 코멘트 카드들 -->
      <div class="wx-comments">
        ${commentHtml}
      </div>

      <!-- 시간별 차트 -->
      ${hourlyHtml}

      <!-- 5일 예보 -->
      <div class="wx-forecast-wrap">
        <div class="wx-section-title">5일 예보</div>
        <div class="weather-forecast">${forecastHtml}</div>
      </div>

    </div>`;
}

let weatherLoaded = false;

async function loadWeather() {
  if (weatherLoaded) return;
  const container = document.getElementById("weatherContent");
  container.innerHTML = `<div class="weather-loading"><div class="weather-loading-spinner"></div><p>날씨 불러오는 중...</p></div>`;

  try {
    const [w1, w2] = await Promise.all(LOCATIONS.map(loc => fetchWeatherForLocation(loc)));
    const updatedAt = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

    container.innerHTML =
      renderWeatherCard(LOCATIONS[0], w1) +
      renderWeatherCard(LOCATIONS[1], w2) +
      `<div class="weather-updated">마지막 업데이트 ${updatedAt} · <button class="weather-refresh-btn" onclick="refreshWeather()">새로고침 ↻</button></div>`;

    weatherLoaded = true;
  } catch (e) {
    container.innerHTML = `<div class="weather-error">😢 날씨를 불러오지 못했어요<br><small>${e.message}</small><br><button class="add-btn" style="margin-top:14px" onclick="refreshWeather()">다시 시도</button></div>`;
  }
}

function refreshWeather() {
  weatherLoaded = false;
  loadWeather();
}

// ── 날짜 포맷 ──
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${y}년 ${m}월 ${d}일 (${days[date.getDay()]})`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/365/sw.js');
}