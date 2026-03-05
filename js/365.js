// D+ count
const start = new Date("2025-03-07");
const days = Math.max(1, Math.floor((new Date() - start) / 86400000));
document.getElementById("dayCount").textContent = `D+${days}일`;

// Scroll reveal
document.querySelectorAll(".reveal").forEach((el) =>
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) el.classList.add("show");
    },
    { threshold: 0.1 },
  ).observe(el),
);

// Music
const audio = document.getElementById("bgm");
const pbar = document.getElementById("pbar");
let playing = false;
audio.addEventListener("timeupdate", () => {
  if (audio.duration)
    pbar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
});
function toggleMusic() {
  if (playing) {
    audio.pause();
    document.getElementById("playIcon").style.display = "";
    document.getElementById("pauseIcon").style.display = "none";
  } else {
    audio.play().catch(() => { });
    document.getElementById("playIcon").style.display = "none";
    document.getElementById("pauseIcon").style.display = "";
  }
  playing = !playing;
}

// Letter
function openLetter() {
  document.getElementById("envWrap").style.display = "none";
  const box = document.getElementById("letterBox");
  box.style.display = "block";
  setTimeout(() => box.classList.add("show"), 30);
}

// Duck pop
function duckPop(e) {
  const items = ["🐥", "🐥", "🐥", "🐣", "💛", "✨", "🌟", "🌼", "💝"];
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      const ang = Math.random() * Math.PI * 2,
        dist = 70 + Math.random() * 160,
        size = 0.9 + Math.random() * 1;
      el.textContent = items[Math.floor(Math.random() * items.length)];
      el.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:${size}rem;pointer-events:none;z-index:1000;transition:transform .9s cubic-bezier(.2,.8,.3,1),opacity .9s ease;opacity:1`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(.3) rotate(${Math.random() * 360}deg)`;
        el.style.opacity = "0";
      });
      setTimeout(() => el.remove(), 1000);
    }, i * 25);
  }
}

// 기존 photo-card zoom (강릉 카드는 onclick 없음)
document
  .querySelectorAll(".photo-card:not(.gangneung-card)")
  .forEach((card) => {
    card.addEventListener("click", () => {
      const ov = document.createElement("div");
      ov.style.cssText =
        "position:fixed;inset:0;background:rgba(20,18,14,.75);z-index:1000;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(10px);animation:fadeIn .25s ease";
      const cl = card.cloneNode(true);
      cl.style.cssText =
        "--r:0deg;transform:scale(1);max-width:300px;width:78vw;cursor:default;box-shadow:0 32px 80px rgba(0,0,0,0.3)";
      ov.appendChild(cl);
      ov.addEventListener("click", () => ov.remove());
      document.body.appendChild(ov);
    });
  });

// ══════════════════════════════════
// 강릉여행 슬라이드쇼
// ══════════════════════════════════

// 📁 강릉여행 이미지 목록 (총 20장)
const gangneungImages = [
  "KakaoTalk_20260305_104517673_07.jpg", // 대표 썸네일
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
];
const BASE = "./images/first/";
let ssIdx = 0;

function buildStrip() {
  document.getElementById("ssStrip").innerHTML = gangneungImages
    .map(
      (f, i) => `
          <div class="ss-dot${i === ssIdx ? " active" : ""}" id="ssdot${i}" onclick="ssGo(${i})">
            <img src="${BASE}${f}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=ss-dot-fb>🌊</div>'"/>
          </div>`,
    )
    .join("");
}

function updateStrip() {
  document
    .querySelectorAll(".ss-dot")
    .forEach((d, i) => d.classList.toggle("active", i === ssIdx));
  const dot = document.getElementById(`ssdot${ssIdx}`);
  if (dot)
    dot.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
}

function ssSetImg(src) {
  const img = document.getElementById("ssImg");
  img.classList.add("fading");
  setTimeout(() => {
    img.src = src;
    img.onload = () => img.classList.remove("fading");
    img.onerror = () => img.classList.remove("fading");
  }, 200);
}

function openSlideshow(startIdx) {
  ssIdx = startIdx || 0;
  document.getElementById("slideshow").classList.add("open");
  document.body.style.overflow = "hidden";
  document.getElementById("ssIdx").textContent = ssIdx + 1;
  document.getElementById("ssTotal").textContent = gangneungImages.length;
  buildStrip();
  ssSetImg(BASE + gangneungImages[ssIdx]);
  document.addEventListener("keydown", ssKey);
  startAutoplay();
}

function closeSlideshow() {
  document.getElementById("slideshow").classList.remove("open");
  document.body.style.overflow = "";
  document.removeEventListener("keydown", ssKey);
  stopAutoplay();
}

function ssMove(dir) {
  ssIdx = (ssIdx + dir + gangneungImages.length) % gangneungImages.length;
  document.getElementById("ssIdx").textContent = ssIdx + 1;
  ssSetImg(BASE + gangneungImages[ssIdx]);
  updateStrip();
  if (autoOn) resetAutoplay();
}

function ssGo(i) {
  ssIdx = i;
  document.getElementById("ssIdx").textContent = ssIdx + 1;
  ssSetImg(BASE + gangneungImages[ssIdx]);
  updateStrip();
  if (autoOn) resetAutoplay();
}

function ssKey(e) {
  if (e.key === "ArrowLeft") ssMove(-1);
  if (e.key === "ArrowRight") ssMove(1);
  if (e.key === "Escape") closeSlideshow();
}

// 배경 클릭 닫기
document
  .getElementById("slideshow")
  .addEventListener("click", function (e) {
    if (e.target === this) closeSlideshow();
  });

// 터치 스와이프
let tx = 0;
document.getElementById("slideshow").addEventListener(
  "touchstart",
  (e) => {
    tx = e.touches[0].clientX;
  },
  { passive: true },
);
document.getElementById("slideshow").addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) ssMove(dx < 0 ? 1 : -1);
});

// ── 자동재생 ──
const AUTOPLAY_DELAY = 3500; // ms
let autoOn = true;
let autoTimer = null;
let progressAnim = null;

function startAutoplay() {
  if (!autoOn) return;
  stopAutoplay();
  // 진행 바 애니메이션
  const bar = document.getElementById("ssProgress");
  bar.style.transition = "none";
  bar.style.width = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.transition = `width ${AUTOPLAY_DELAY}ms linear`;
      bar.style.width = "100%";
    });
  });
  autoTimer = setTimeout(() => {
    ssMove(1);
    startAutoplay();
  }, AUTOPLAY_DELAY);
}

function stopAutoplay() {
  clearTimeout(autoTimer);
  autoTimer = null;
  const bar = document.getElementById("ssProgress");
  if (bar) {
    bar.style.transition = "none";
    bar.style.width = "0%";
  }
}

function resetAutoplay() {
  stopAutoplay();
  startAutoplay();
}

function toggleAutoplay() {
  autoOn = !autoOn;
  const btn = document.getElementById("ssAutoBtn");
  if (autoOn) {
    btn.textContent = "▶ AUTO";
    btn.style.color = "rgba(255,210,100,0.6)";
    btn.style.borderColor = "rgba(255,200,60,0.25)";
    startAutoplay();
  } else {
    btn.textContent = "⏸ AUTO";
    btn.style.color = "rgba(255,180,75,0.9)";
    btn.style.borderColor = "rgba(255,200,60,0.5)";
    stopAutoplay();
  }
}