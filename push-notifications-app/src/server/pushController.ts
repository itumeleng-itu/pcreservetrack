class PushController {
    private subscriptions: Set<PushSubscription>;

    constructor() {
        this.subscriptions = new Set<PushSubscription>();
    }

    public subscribeUser(subscription: PushSubscription): void {
        this.subscriptions.add(subscription);
    }

    public sendNotification(title: string, body: string): void {
        this.subscriptions.forEach(subscription => {
            const payload = JSON.stringify({ title, body });

            subscription.sendNotification(payload).catch(error => {
                console.error('Error sending notification:', error);
            });
        });
    }
}

export default PushController;