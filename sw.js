const CACHE_NAME = 'metagram-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'https://i.postimg.cc/wBPN1Dtt/telegram.png',
    'https://i.postimg.cc/CMjdw2gt/f53d2db3262d9950d1e0fb1b74244d-removebg-preview.png',
    'https://flagcdn.com/ru.svg'
];

// Установка сервис-воркера и кэширование ресурсов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэширование ресурсов');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('Ошибка кэширования:', err))
    );
    self.skipWaiting(); // Активируем сервис-воркер сразу после установки
});

// Обработка запросов
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Возвращаем из кэша
                }
                return fetch(event.request)
                    .then(networkResponse => {
                        // Кэшируем новые ресурсы динамически
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseToCache));
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Fallback на главную страницу при отсутствии сети
                        return caches.match('/index.html');
                    });
            })
    );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => self.clients.claim()) // Активируем контроль над клиентами
    );
});