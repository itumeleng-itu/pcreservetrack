import React, { useEffect, useState } from 'react';
import { NotificationService } from '../services/NotificationService';

export const NotificationPermission: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const subscription = await NotificationService.subscribeToPushNotifications();
      if (subscription) {
        setPermission('granted');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="notification-permission-banner">
      <p>Get instant updates when computers become available!</p>
      <button onClick={handleEnableNotifications}>
        Enable Push Notifications
      </button>
    </div>
  );
};