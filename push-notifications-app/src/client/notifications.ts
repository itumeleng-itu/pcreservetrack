export const requestNotificationPermission = async (): Promise<boolean> => {
    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    }
};