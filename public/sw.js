/**
 * Service Worker for Rhinos Training App
 * Handles notifications and offline caching
 */

const CACHE_NAME = 'rhinos-training-v1';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim()); // Take control immediately
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);

  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Handle push notifications (for future backend integration)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Rhinos Training';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Fetch event - can be used for offline caching in the future
self.addEventListener('fetch', (event) => {
  // For now, just let requests pass through
  // In the future, can add caching strategy here
});
