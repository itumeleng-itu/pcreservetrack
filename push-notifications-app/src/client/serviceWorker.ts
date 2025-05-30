self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};

    const title = data.title || 'Urgent Update!';
    const options = {
        body: data.body || 'Check it out!',
        icon: 'icon.png', // Path to an icon image
        badge: 'badge.png' // Path to a badge image
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://your-app-url.com') // Replace with your app's URL
    );
});