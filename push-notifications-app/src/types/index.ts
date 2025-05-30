export interface PushNotification {
    title: string;
    body: string;
    icon?: string;
    data?: any;
}

export interface UserSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}