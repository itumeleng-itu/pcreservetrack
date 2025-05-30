import webpush from 'web-push';

export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
  private static readonly VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
  private static readonly VAPID_SUBJECT = 'mailto:your-email@example.com';

  public static initialize(): void {
    webpush.setVapidDetails(
      this.VAPID_SUBJECT,
      this.VAPID_PUBLIC_KEY,
      this.VAPID_PRIVATE_KEY
    );
  }

  public static async sendNotification(
    subscription: webpush.PushSubscription,
    payload: string
  ): Promise<void> {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }
}