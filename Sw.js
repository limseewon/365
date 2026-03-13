const CACHE = "schedule-v1";
const ASSETS = [
  "/365/schedule.html",
  "/365/css/schedule.css",
  "/365/js/schedule.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});