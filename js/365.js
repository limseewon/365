// ── 방문자 기록 ──
fetch("https://api.ipify.org?format=json")
  .then(r => r.json())
  .then(data => {
    const webhookUrl = "https://script.google.com/macros/s/AKfycbyDN0LiDBVqVfKXT4zObv2pdvxik2lXQNBmcIIU9Z_nFWTLf7AwlRxydy0mRvRJbSr4/exec";
    const ua = encodeURIComponent(navigator.userAgent);
    fetch(`${webhookUrl}?ip=${data.ip}&ua=${ua}`, { mode: "no-cors" });
  })
  .catch(() => { });

/* ── 잠금화면 ── */
function lockFocus(el) {
  el.style.borderColor = "rgba(255,210,50,0.7)"; el.style.borderBottomColor = "#ffd040";
  el.style.boxShadow = "0 0 0 3px rgba(255,200,40,0.12),0 0 16px rgba(255,180,0,0.12)";
  el.style.background = "rgba(255,200,50,0.14)";
}
function lockBlur(el) {
  el.style.borderColor = "rgba(255,190,40,0.25)"; el.style.borderBottomColor = "rgba(255,180,30,0.6)";
  el.style.boxShadow = "none"; el.style.background = "rgba(255,200,50,0.1)";
}
function onlyNums(el) { el.value = el.value.replace(/\D/g, ""); }

function checkDate() {
  const y = document.getElementById("inYear").value.trim();
  const m = document.getElementById("inMonth").value.trim().padStart(2, "0");
  const d = document.getElementById("inDay").value.trim().padStart(2, "0");
  if (y.length < 4 || m.length < 2 || d.length < 2) return;
  if (`${y}-${m}-${d}` === "2025-03-07") {
    const lock = document.getElementById("lockScreen");
    const duck = document.getElementById("lockDuck");
    duck.style.animation = "none";
    duck.innerHTML = '<div style="font-size:4rem;">🎉</div>';
    for (let i = 0; i < 28; i++) {
      setTimeout(() => {
        const el = document.createElement("img");
        const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 170;
        el.src = "./images/icon/pompom.png";
        const size = 28 + Math.random() * 24;
        el.style.cssText = `position:fixed;left:50%;top:50%;width:${size}px;height:${size}px;object-fit:contain;pointer-events:none;z-index:99999;transition:transform 1s cubic-bezier(.2,.8,.3,1),opacity 1s;opacity:1`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist}px)) scale(0.2) rotate(${Math.random() * 360}deg)`;
          el.style.opacity = "0";
        });
        setTimeout(() => el.remove(), 1100);
      }, i * 35);
    }
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
      setTimeout(() => { el.style.borderBottomColor = "rgba(255,180,30,0.5)"; el.style.boxShadow = "none"; }, 700);
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
      ctx.fillStyle = `rgba(255,${180 + Math.random() * 60 | 0},20,${p.a * fade * .7})`; ctx.fill();
      if (p.life > p.maxLife) pts[i] = mkPt();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize); resize(); draw();
})();

/* ── D+ count ── */
const start = new Date("2025-03-07");
document.getElementById("dayCount").textContent =
  `D+${Math.max(1, Math.floor((new Date() - start) / 86400000))}일`;

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
audio.addEventListener("timeupdate", () => {
  if (audio.duration) pbar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
});
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

/* ── Duck pop ── */
function duckPop(e) {
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const el = document.createElement("img");
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 160;
      el.src = "./images/icon/pompom.png";
      const size = 20 + Math.random() * 20;
      el.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;object-fit:contain;pointer-events:none;z-index:9000;transition:transform .9s cubic-bezier(.2,.8,.3,1),opacity .9s ease;opacity:1`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(.3) rotate(${Math.random() * 360}deg)`;
        el.style.opacity = "0";
      });
      setTimeout(() => el.remove(), 1000);
    }, i * 25);
  }
}

/* ── 일반 photo-card 줌 (슬라이드쇼 카드 제외) ── */
document.querySelectorAll(".photo-card:not(.gangneung-card):not(.gyeongju-card):not(.photobooth-card):not(.fukuoka-card):not(.daegu-card):not(.gyemdong-card)").forEach(card => {
  card.addEventListener("click", () => {
    const ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(20,18,14,.75);z-index:1000;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(10px);animation:fadeIn .25s ease";
    const cl = card.cloneNode(true);
    cl.style.cssText = "--r:0deg;transform:scale(1);max-width:300px;width:78vw;cursor:default;box-shadow:0 32px 80px rgba(0,0,0,0.3)";
    ov.appendChild(cl);
    ov.addEventListener("click", () => ov.remove());
    document.body.appendChild(ov);
  });
});

/* ══════════════════════════════════════════════════════
   슬라이드쇼 팩토리
══════════════════════════════════════════════════════ */
const AUTOPLAY_DELAY = 3500;

function createSlideshow({ id, images, base, idxElId, totalElId, imgElId, stripElId, progressElId, autoBtnId, fallbackEmoji }) {
  let idx = 0;
  let autoOn = true;
  let timer = null;
  const el = document.getElementById(id);
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
    if (!autoOn) return;
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
    idx = (idx + dir + images.length) % images.length;
    document.getElementById(idxElId).textContent = idx + 1;
    setImg(base + images[idx]);
    updateStrip();
    if (autoOn) { stopAuto(); startAuto(); }
  }
  function go(i) {
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
    document.getElementById(idxElId).textContent = idx + 1;
    document.getElementById(totalElId).textContent = images.length;
    buildStrip();
    setImg(base + images[idx]);
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
      btn.style.color = "rgba(255,210,100,0.6)";
      btn.style.borderColor = "rgba(255,200,60,0.25)";
      startAuto();
    } else {
      btn.textContent = "⏸ AUTO";
      btn.style.color = "rgba(255,180,75,0.9)";
      btn.style.borderColor = "rgba(255,200,60,0.5)";
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

/* ── 강릉여행 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow",
  images: [
    "KakaoTalk_20260305_104517673_07.jpg",
    "KakaoTalk_20260305_104517673.jpg",
    "KakaoTalk_20260305_104517673_01.jpg",
    "KakaoTalk_20260305_104517673_02.jpg",
    "KakaoTalk_20260305_104517673_03.jpg",
    "KakaoTalk_20260305_104517673_04.jpg",
    "KakaoTalk_20260305_104517673_05.jpg",
    "KakaoTalk_20260305_104517673_06.jpg",
    "KakaoTalk_20260305_104517673_08.jpg",
    "KakaoTalk_20260305_104517673_09.png",
    "KakaoTalk_20260305_104517673_10.png",
    "KakaoTalk_20260305_104517673_11.jpg",
    "KakaoTalk_20260305_104517673_12.jpg",
    "KakaoTalk_20260305_104517673_13.jpg",
    "KakaoTalk_20260305_104517673_14.jpg",
    "KakaoTalk_20260305_104517673_15.jpg",
    "KakaoTalk_20260305_104517673_16.jpg",
    "KakaoTalk_20260305_104517673_17.jpg",
    "KakaoTalk_20260305_104517673_18.jpg",
    "KakaoTalk_20260305_104517673_19.jpg",
  ],
  base: "./images/first/",
  idxElId: "ssIdx", totalElId: "ssTotal", imgElId: "ssImg",
  stripElId: "ssStrip", progressElId: "ssProgress", autoBtnId: "ssAutoBtn",
  fallbackEmoji: "🌊",
});

/* ── 경주여행 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow2",
  images: [
    "KakaoTalk_20260305_104533933_07.jpg",
    "KakaoTalk_20260305_104533933.jpg",
    "KakaoTalk_20260305_104533933_01.jpg",
    "KakaoTalk_20260305_104533933_02.jpg",
    "KakaoTalk_20260305_104533933_03.jpg",
    "KakaoTalk_20260305_104533933_04.jpg",
    "KakaoTalk_20260305_104533933_05.jpg",
    "KakaoTalk_20260305_104533933_06.jpg",
    "KakaoTalk_20260305_104533933_08.jpg",
    "KakaoTalk_20260305_104533933_09.jpg",
    "KakaoTalk_20260305_104533933_10.jpg",
  ],
  base: "./images/second/",
  idxElId: "ssIdx2", totalElId: "ssTotal2", imgElId: "ssImg2",
  stripElId: "ssStrip2", progressElId: "ssProgress2", autoBtnId: "ssAutoBtn2",
  fallbackEmoji: "🏛️",
});

/* ── 잠금화면 ── */
function lockFocus(el) {
  el.style.borderColor = "rgba(255,210,50,0.7)"; el.style.borderBottomColor = "#ffd040";
  el.style.boxShadow = "0 0 0 3px rgba(255,200,40,0.12),0 0 16px rgba(255,180,0,0.12)";
  el.style.background = "rgba(255,200,50,0.14)";
}
function lockBlur(el) {
  el.style.borderColor = "rgba(255,190,40,0.25)"; el.style.borderBottomColor = "rgba(255,180,30,0.6)";
  el.style.boxShadow = "none"; el.style.background = "rgba(255,200,50,0.1)";
}
function onlyNums(el) { el.value = el.value.replace(/\D/g, ""); }

function checkDate() {
  const y = document.getElementById("inYear").value.trim();
  const m = document.getElementById("inMonth").value.trim().padStart(2, "0");
  const d = document.getElementById("inDay").value.trim().padStart(2, "0");
  if (y.length < 4 || m.length < 2 || d.length < 2) return;
  if (`${y}-${m}-${d}` === "2025-03-07") {
    const lock = document.getElementById("lockScreen");
    const duck = document.getElementById("lockDuck");
    duck.style.animation = "none"; duck.textContent = "🎉"; duck.style.fontSize = "4rem";
    for (let i = 0; i < 28; i++) {
      setTimeout(() => {
        const el = document.createElement("div");
        const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 170;
        el.textContent = ["🍮", "🍮", "💛", "✨", "🌟", "🌼", "🍮"][Math.random() * 7 | 0];
        el.style.cssText = `position:fixed;left:50%;top:50%;font-size:${0.9 + Math.random() * 1.3}rem;pointer-events:none;z-index:9999;transition:transform 1s cubic-bezier(.2,.8,.3,1),opacity 1s;opacity:1`;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
          el.style.transform = `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist}px)) scale(0.2) rotate(${Math.random() * 360}deg)`;
          el.style.opacity = "0";
        });
        setTimeout(() => el.remove(), 1100);
      }, i * 35);
    }
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
      setTimeout(() => { el.style.borderBottomColor = "rgba(255,180,30,0.5)"; el.style.boxShadow = "none"; }, 700);
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
      ctx.fillStyle = `rgba(255,${180 + Math.random() * 60 | 0},20,${p.a * fade * .7})`; ctx.fill();
      if (p.life > p.maxLife) pts[i] = mkPt();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize); resize(); draw();
})();

/* ── 인생네컷 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow3",
  images: [
    "KakaoTalk_20260305_133543598.jpg",
    "KakaoTalk_20260305_133543598_01.jpg",
    "KakaoTalk_20260305_133543598_02.jpg",
    "KakaoTalk_20260305_133543598_03.jpg",
    "KakaoTalk_20260305_133543598_04.jpg",
    "KakaoTalk_20260305_133543598_05.jpg",
    "KakaoTalk_20260305_133543598_06.jpg",
    "KakaoTalk_20260305_133543598_07.jpg",
    "KakaoTalk_20260305_133543598_08.jpg",
    "KakaoTalk_20260305_133543598_09.jpg",
    "KakaoTalk_20260305_133543598_10.jpg",
    "KakaoTalk_20260305_133543598_11.jpg",
    "KakaoTalk_20260305_133543598_12.jpg",
    "KakaoTalk_20260305_133543598_13.webp",
    "KakaoTalk_20260305_133543598_14.jpg",
    "KakaoTalk_20260305_133543598_15.jpg",
  ],
  base: "./images/third/",
  idxElId: "ssIdx3", totalElId: "ssTotal3", imgElId: "ssImg3",
  stripElId: "ssStrip3", progressElId: "ssProgress3", autoBtnId: "ssAutoBtn3",
  fallbackEmoji: "📸",
});

/* ── 후쿠오카 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow4",
  images: [
    "KakaoTalk_20260307_102604166_05.jpg",
    "KakaoTalk_20260307_102604166.jpg",
    "KakaoTalk_20260307_102604166_01.jpg",
    "KakaoTalk_20260307_102604166_02.jpg",
    "KakaoTalk_20260307_102604166_03.jpg",
    "KakaoTalk_20260307_102604166_04.jpg",
    "KakaoTalk_20260307_102604166_06.jpg",
    "KakaoTalk_20260307_102604166_07.jpg",
    "KakaoTalk_20260307_102604166_08.jpg",
    "KakaoTalk_20260307_102604166_09.jpg",
    "KakaoTalk_20260307_102604166_10.jpg",
    "KakaoTalk_20260307_102604166_11.jpg",
    "KakaoTalk_20260307_102604166_12.jpg",
    "KakaoTalk_20260307_102604166_13.jpg",
    "KakaoTalk_20260307_102604166_14.jpg",
    "KakaoTalk_20260307_102604166_15.jpg",
    "KakaoTalk_20260307_102604166_16.jpg",
    "KakaoTalk_20260307_102604166_17.jpg",
    "KakaoTalk_20260307_102604166_18.jpg",
    "KakaoTalk_20260307_102604166_19.jpg",
    "KakaoTalk_20260307_102604166_20.png",
    "KakaoTalk_20260307_102604166_21.jpg",
    "KakaoTalk_20260307_102604166_22.webp",
    "KakaoTalk_20260307_102604166_23.webp",
    "KakaoTalk_20260307_102604166_24.jpg",
    "KakaoTalk_20260307_102604166_25.webp",
    "KakaoTalk_20260307_102604166_26.jpg",
  ],
  base: "./images/fourth/",
  idxElId: "ssIdx4", totalElId: "ssTotal4", imgElId: "ssImg4",
  stripElId: "ssStrip4", progressElId: "ssProgress4", autoBtnId: "ssAutoBtn4",
  fallbackEmoji: "✈️",
});

/* ── 대구 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow5",
  images: [
    "KakaoTalk_20260307_104300036_05.jpg",
    "KakaoTalk_20260307_104300036.jpg",
    "KakaoTalk_20260307_104300036_01.jpg",
    "KakaoTalk_20260307_104300036_02.jpg",
    "KakaoTalk_20260307_104300036_03.jpg",
    "KakaoTalk_20260307_104300036_04.jpg",
    "KakaoTalk_20260307_104300036_06.jpg",
    "KakaoTalk_20260307_104300036_07.jpg",
    "KakaoTalk_20260307_104300036_08.jpg",
    "KakaoTalk_20260307_104300036_09.jpg",
    "KakaoTalk_20260307_104328523.jpg",
    "KakaoTalk_20260307_104328523_01.jpg",
  ],
  base: "./images/fifth/",
  idxElId: "ssIdx5", totalElId: "ssTotal5", imgElId: "ssImg5",
  stripElId: "ssStrip5", progressElId: "ssProgress5", autoBtnId: "ssAutoBtn5",
  fallbackEmoji: "🎡",
});

/* ── 우주최강겸둥 슬라이드쇼 ── */
createSlideshow({
  id: "slideshow6",
  images: [
    "KakaoTalk_20260307_105306661_08.jpg",
    "KakaoTalk_20260307_105306661.jpg",
    "KakaoTalk_20260307_105306661_01.jpg",
    "KakaoTalk_20260307_105306661_02.jpg",
    "KakaoTalk_20260307_105306661_03.jpg",
    "KakaoTalk_20260307_105306661_04.jpg",
    "KakaoTalk_20260307_105306661_05.png",
    "KakaoTalk_20260307_105306661_06.png",
    "KakaoTalk_20260307_105306661_07.png",
    "KakaoTalk_20260307_105306661_09.jpg",
    "KakaoTalk_20260307_105306661_10.jpg",
    "KakaoTalk_20260307_105306661_11.jpg",
    "KakaoTalk_20260307_105306661_12.jpg",
    "KakaoTalk_20260307_105306661_13.webp",
    "KakaoTalk_20260307_105306661_14.jpg",
    "KakaoTalk_20260307_105306661_15.jpg",
    "KakaoTalk_20260307_105306661_16.jpg",
    "KakaoTalk_20260307_105306661_17.webp",
    "KakaoTalk_20260307_105306661_18.jpg",
    "KakaoTalk_20260307_105306661_19.jpg",
    "KakaoTalk_20260307_105306661_20.jpg",
    "KakaoTalk_20260307_105306661_21.jpg",
    "KakaoTalk_20260307_105306661_22.jpg",
    "KakaoTalk_20260307_105306661_23.jpg",
    "KakaoTalk_20260307_105306661_24.jpg",
  ],
  base: "./images/sixth/",
  idxElId: "ssIdx6", totalElId: "ssTotal6", imgElId: "ssImg6",
  stripElId: "ssStrip6", progressElId: "ssProgress6", autoBtnId: "ssAutoBtn6",
  fallbackEmoji: "🐥",
});