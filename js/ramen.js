// ── 방문자 기록 ──
fetch("https://api.ipify.org?format=json")
  .then(r => r.json())
  .then(data => {
    const webhookUrl = "https://script.google.com/macros/s/AKfycbwwhQm9BURT9ZOJzmg955vOYkUdVV2GWG1qCqcloEsqXlwlnS7Kh6vZuQLV3HBTyUG4/exec";
    const ua = encodeURIComponent(navigator.userAgent);
    fetch(`${webhookUrl}?ip=${data.ip}&ua=${ua}&page=ramen`, { mode: "no-cors" });
  })
  .catch(() => {});

/* ── 잠금화면 ── */
function lockFocus(el) {
  el.style.borderColor = "rgba(180,180,180,0.7)"; el.style.borderBottomColor = "#d8d8d8";
  el.style.boxShadow = "0 0 0 3px rgba(160,160,160,0.12)";
  el.style.background = "rgba(200,200,200,0.16)";
}
function lockBlur(el) {
  el.style.borderColor = "rgba(190,190,190,0.3)"; el.style.borderBottomColor = "rgba(180,180,180,0.6)";
  el.style.boxShadow = "none"; el.style.background = "rgba(200,200,200,0.12)";
}
function onlyNums(el) { el.value = el.value.replace(/\D/g, ""); }

/* 비밀번호(날짜) = 2026-05-09 */
const LOCK_DATE = "2026-05-09";

function checkDate() {
  const y = document.getElementById("inYear").value.trim();
  const m = document.getElementById("inMonth").value.trim().padStart(2, "0");
  const d = document.getElementById("inDay").value.trim().padStart(2, "0");
  if (y.length < 4 || m.length < 2 || d.length < 2) return;
  if (`${y}-${m}-${d}` === LOCK_DATE) {
    const lock = document.getElementById("lockScreen");
    const duck = document.getElementById("lockDuck");
    duck.style.animation = "none";
    duck.innerHTML = '<div style="font-size:4rem;">🎉</div>';
    setTimeout(() => {
      lock.style.transition = "opacity 1s ease"; lock.style.opacity = "0";
      setTimeout(() => { lock.style.display = "none"; }, 1000);
    }, 1000);
  } else {
    const msg = document.getElementById("lockErrMsg");
    const inputs = document.getElementById("dateInputs");
    msg.style.opacity = "1";
    inputs.classList.remove("lock-shake"); void inputs.offsetWidth; inputs.classList.add("lock-shake");
    ["inYear", "inMonth", "inDay"].forEach(id => {
      const el = document.getElementById(id);
      el.style.borderBottomColor = "rgba(255,100,80,0.8)"; el.style.boxShadow = "0 0 0 3px rgba(255,80,60,0.08)";
      setTimeout(() => { el.style.borderBottomColor = "rgba(180,180,180,0.5)"; el.style.boxShadow = "none"; }, 700);
    });
    document.getElementById("inDay").value = "";
    setTimeout(() => { msg.style.opacity = "0"; }, 2600);
    document.getElementById("inYear").focus();
  }
}

/* ── 잠금화면 파티클 ── */
(function () {
  const c = document.getElementById("lockCanvas");
  if (!c) return;
  let W, H, pts = [];
  function resize() { W = c.width = innerWidth; H = c.height = innerHeight; }
  function mkPt() {
    return {
      x: Math.random() * W, y: Math.random() * H + H,
      vx: (Math.random() - .5) * .4, vy: -(Math.random() * .6 + .2),
      a: Math.random() * .5 + .1, r: Math.random() * 1.5 + .3,
      life: 0, maxLife: 200 + Math.random() * 300
    };
  }
  for (let i = 0; i < 60; i++) { pts.push(mkPt()); pts[i].y = Math.random() * H; }
  function draw() {
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    pts.forEach((p, i) => {
      p.life++; p.x += p.vx; p.y += p.vy;
      const fade = p.life < 30 ? p.life / 30 : p.life > p.maxLife - 30 ? 1 - (p.life - (p.maxLife - 30)) / 30 : 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,210,210,${p.a * fade * .7})`; ctx.fill();
      if (p.life > p.maxLife) pts[i] = mkPt();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize); resize(); draw();
})();

/* ── D+ count ── */
const start = new Date(LOCK_DATE);
const dayCountEl = document.getElementById("dayCount");
if (dayCountEl) {
  dayCountEl.textContent = `D+${Math.max(1, Math.floor((new Date() - start) / 86400000))}일`;
}

/* ── Scroll reveal (IntersectionObserver) ── */
const revealObs = new IntersectionObserver(
  (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add("show")),
  { threshold: 0.1 }
);
document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

/* ── Music player ── */
const audio = document.getElementById("bgm");
const pbar = document.getElementById("pbar");
let playing = false;
if (audio) {
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) pbar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  });
}
function toggleMusic() {
  playing ? audio.pause() : audio.play().catch(() => { });
  playing = !playing;
  document.getElementById("playIcon").style.display = playing ? "none" : "";
  document.getElementById("pauseIcon").style.display = playing ? "" : "none";
}

/* ── Letter ── */
function openLetter() {
  document.getElementById("envWrap").style.display = "none";
  const box = document.getElementById("letterBox");
  box.style.display = "block";
  requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("show")));
}


/* ══════════════════════════════════════════════════════
   슬라이드쇼 팩토리
══════════════════════════════════════════════════════ */
const AUTOPLAY_DELAY = 3500;

function createSlideshow({ id, images, base, idxElId, totalElId, imgElId, stripElId, progressElId, autoBtnId, fallbackEmoji }) {
  let idx = 0;
  let autoOn = true;
  let timer = null;
  const el = document.getElementById(id);
  if (!el) return;
  const imgEl = document.getElementById(imgElId);

  function buildStrip() {
    document.getElementById(stripElId).innerHTML = images.map((f, i) =>
      `<div class="ss-dot${i === idx ? " active" : ""}" id="${id}_dot_${i}" onclick="${id}_go(${i})">
         <img src="${base}${f}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=ss-dot-fb>${fallbackEmoji}</div>'"/>
       </div>`
    ).join("");
  }

  function updateStrip() {
    document.querySelectorAll(`#${stripElId} .ss-dot`).forEach((d, i) => d.classList.toggle("active", i === idx));
    const dot = document.getElementById(`${id}_dot_${idx}`);
    if (dot) dot.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function setImg(src) {
    imgEl.classList.add("fading");
    setTimeout(() => {
      imgEl.src = src;
      const done = () => imgEl.classList.remove("fading");
      imgEl.onload = done; imgEl.onerror = done;
    }, 200);
  }

  function startAuto() {
    if (!autoOn || images.length < 2) return;
    stopAuto();
    const bar = document.getElementById(progressElId);
    bar.style.transition = "none"; bar.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = `width ${AUTOPLAY_DELAY}ms linear`;
      bar.style.width = "100%";
    }));
    timer = setTimeout(() => { move(1); startAuto(); }, AUTOPLAY_DELAY);
  }
  function stopAuto() {
    clearTimeout(timer); timer = null;
    const bar = document.getElementById(progressElId);
    if (bar) { bar.style.transition = "none"; bar.style.width = "0%"; }
  }

  function move(dir) {
    if (!images.length) return;
    idx = (idx + dir + images.length) % images.length;
    document.getElementById(idxElId).textContent = idx + 1;
    setImg(base + images[idx]);
    updateStrip();
    if (autoOn) { stopAuto(); startAuto(); }
  }
  function go(i) {
    if (!images.length) return;
    idx = i;
    document.getElementById(idxElId).textContent = idx + 1;
    setImg(base + images[idx]);
    updateStrip();
    if (autoOn) { stopAuto(); startAuto(); }
  }

  function onKey(e) {
    if (e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowRight") move(1);
    if (e.key === "Escape") close();
  }

  function open(startIdx) {
    idx = startIdx || 0;
    el.classList.add("open");
    document.body.style.overflow = "hidden";
    document.getElementById(totalElId).textContent = images.length;
    buildStrip();
    if (images.length) {
      document.getElementById(idxElId).textContent = idx + 1;
      setImg(base + images[idx]);
    } else {
      document.getElementById(idxElId).textContent = 0;
    }
    document.addEventListener("keydown", onKey);
    startAuto();
  }
  function close() {
    el.classList.remove("open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    stopAuto();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    const btn = document.getElementById(autoBtnId);
    if (autoOn) {
      btn.textContent = "▶ AUTO";
      btn.style.color = "rgba(205,205,205,0.6)";
      btn.style.borderColor = "rgba(200,200,200,0.25)";
      startAuto();
    } else {
      btn.textContent = "⏸ AUTO";
      btn.style.color = "rgba(190,190,190,0.9)";
      btn.style.borderColor = "rgba(200,200,200,0.5)";
      stopAuto();
    }
  }

  el.addEventListener("click", e => { if (e.target === el) close(); });

  let tx = 0;
  el.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1); });

  window[`${id}_open`] = open;
  window[`${id}_close`] = close;
  window[`${id}_move`] = move;
  window[`${id}_go`] = go;
  window[`${id}_toggleAuto`] = toggleAuto;

  const num = id.replace("slideshow", "");
  const closeBtnId = num === "" ? "ssCloseBtn" : `ssCloseBtn${num}`;
  setTimeout(() => {
    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
      closeBtn.addEventListener("touchend", e => { e.preventDefault(); e.stopPropagation(); close(); }, { passive: false });
      closeBtn.addEventListener("click", e => { e.stopPropagation(); close(); });
    }
  }, 0);
}

/* ── 추억 슬라이드쇼 (사진은 추후 추가) ── */
createSlideshow({
  id: "slideshow",
  images: [],
  base: "./images/memory/",
  idxElId: "ssIdx", totalElId: "ssTotal", imgElId: "ssImg",
  stripElId: "ssStrip", progressElId: "ssProgress", autoBtnId: "ssAutoBtn",
  fallbackEmoji: "🖼️",
});

/* ── 인생네컷 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow2",
  images: ["인생네컷1.jpg", "인생네컷2.jpg", "인생네컷3.jpg"],
  base: "./images/인생네컷/",
  idxElId: "ssIdx2", totalElId: "ssTotal2", imgElId: "ssImg2",
  stripElId: "ssStrip2", progressElId: "ssProgress2", autoBtnId: "ssAutoBtn2",
  fallbackEmoji: "📷",
});

/* ── 야구 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow3",
  images: ["야구1.jpg", "야구2.jpg", "야구3.jpg", "야구4.jpg", "야구5.jpg", "야구6.jpg", "야구7.jpg"],
  base: "./images/야구/",
  idxElId: "ssIdx3", totalElId: "ssTotal3", imgElId: "ssImg3",
  stripElId: "ssStrip3", progressElId: "ssProgress3", autoBtnId: "ssAutoBtn3",
  fallbackEmoji: "⚾",
});
