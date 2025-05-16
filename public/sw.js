// Service Worker for GTgram
const CACHE_NAME = 'gtgram-cache-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.png'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Force waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Helper function to determine if a request is an API call
const isApiRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('firestore.googleapis.com') || 
         url.includes('firebasestorage.googleapis.com');
};

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', 
    '.svg', '.ico', '.woff', '.woff2', '.ttf'
  ];
  
  return staticExtensions.some(ext => url.endsWith(ext)) || 
         url.includes('/images/') || 
         url.includes('/assets/');
};

// Fetch event - network first with cache fallback for API, 
// cache first with network fallback for static assets
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;
  
  // Skip cross-origin requests
  if (!requestUrl.startsWith(self.location.origin) && 
      !requestUrl.includes('firebasestorage.googleapis.com') &&
      !requestUrl.includes('firestore.googleapis.com')) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests (network first, cache fallback)
  if (isApiRequest(requestUrl)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          
          // Only cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } 
  // Handle static assets (cache first, network fallback)
  else if (isStaticAsset(requestUrl)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached response if found
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise fetch from network
          return fetch(event.request)
            .then((response) => {
              // Clone the response to store in cache
              const responseToCache = response.clone();
              
              // Only cache successful responses
              if (response.status === 200) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            });
        })
    );
  }
  // Default fetch behavior for other requests
  else {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
}); 