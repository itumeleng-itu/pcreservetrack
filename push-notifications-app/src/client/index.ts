import { register } from './serviceWorker';
import { requestNotificationPermission, subscribeUser } from './notifications';

async function init() {
    // Register the service worker
    await register();

    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
        // Subscribe the user for push notifications
        await subscribeUser();
    } else {
        console.error('Notification permission denied');
    }
}

// Initialize the application
init();