self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() ?? 'Computer status update',
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'computer-update',
    renotify: true,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PCReserveTrack Update', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});