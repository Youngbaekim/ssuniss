// 🎾 슈니스 SSUNISS Service Worker v1

const CACHE_NAME = 'ssuniss-cache-v1';

const STATIC_ASSETS = [
  '/ssuniss/',
  '/ssuniss/index.html',
  '/ssuniss/manifest.json',
  '/ssuniss/icons/icon-192.png',
  '/ssuniss/icons/icon-512.png'
];

// 설치: 정적 파일 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 네트워크 요청 처리 (Network First 전략)
self.addEventListener('fetch', (event) => {
  // Supabase API는 캐싱 제외
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(r => r || caches.match('/ssuniss/'))
      )
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🎾 슈니스', {
      body: data.body || '새 알림이 있어요!',
      icon: '/ssuniss/icons/icon-192.png',
      badge: '/ssuniss/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/ssuniss/' }
    })
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) {
        if (c.url.includes('/ssuniss/')) return c.focus();
      }
      return clients.openWindow('/ssuniss/');
    })
  );
});
