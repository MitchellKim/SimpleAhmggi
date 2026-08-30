// SimpleAhmggi 서비스워커
// 앱 셸(HTML/아이콘/매니페스트)을 캐시해서 오프라인에서도 열리게 하고,
// 홈 화면 설치(설치 가능 조건: manifest + service worker + https)를 지원합니다.
// 단어 데이터 자체는 IndexedDB에 저장되며 이 캐시와는 무관합니다.

const CACHE_NAME = 'simpleahmggi-cache-v1';
const APP_SHELL = [
  './',
  './SimpleAhmggi.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => { /* 일부 파일을 찾지 못해도 설치 자체는 계속 진행 */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      // 캐시가 있으면 즉시 응답(빠른 로딩), 없으면 네트워크 대기
      return cached || network;
    })
  );
});
