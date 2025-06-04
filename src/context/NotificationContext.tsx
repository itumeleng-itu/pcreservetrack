
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { 
  mockNotifications, 
  addMockNotification, 
  markNotificationAsRead as mockMarkAsRead,
  markAllNotificationsAsRead as mockMarkAllAsRead,
  deleteNotification as mockDeleteNotification,
  deleteAllNotifications as mockDeleteAllNotifications,
  getUserNotifications,
  MockNotification
} from "@/services/mockData";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "action_required";
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "created_at" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentUser } = useAuth();

  // Load notifications when user changes
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // Poll for new notifications every 2 seconds (simulating real-time updates)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const loadNotifications = () => {
    if (!currentUser) return;

    const userNotifications = getUserNotifications(currentUser.id);
    const mappedNotifications: Notification[] = userNotifications.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      read: item.read,
      created_at: item.created_at,
      data: item.data || {}
    }));

    setNotifications(mappedNotifications);
  };

  const addNotification = (notification: Omit<Notification, "id" | "created_at" | "read">) => {
    if (!currentUser) return;

    addMockNotification({
      user_id: currentUser.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {}
    });

    // Immediately reload to show the new notification
    loadNotifications();
  };

  const markAsRead = (id: string) => {
    mockMarkAsRead(id);
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    if (!currentUser) return;

    mockMarkAllAsRead(currentUser.id);
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    mockDeleteNotification(id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;

    mockDeleteAllNotifications(currentUser.id);
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
