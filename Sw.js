// 버전 바꾸면 캐시 자동 갱신됨
const CACHE = "our-space-v4";

const ASSETS = [
  "/365/schedule.html",
  "/365/css/schedule.css",
  "/365/js/schedule.js"
];

// 설치 시 캐시 저장
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // 기다리지 않고 바로 활성화
  self.skipWaiting();
});

// 활성화 시 오래된 캐시 삭제
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 요청 처리 — 네트워크 우선, 실패 시 캐시
self.addEventListener("fetch", e => {
  // API 요청은 캐시 안 함
  if (
    e.request.url.includes("script.google.com") ||
    e.request.url.includes("api.open-meteo.com") ||
    e.request.url.includes("air-quality-api.open-meteo.com") ||
    e.request.url.includes("api.ipify.org") ||
    e.request.url.includes("fonts.googleapis.com") ||
    e.request.url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 성공하면 캐시도 갱신
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});