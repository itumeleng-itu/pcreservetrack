
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "action_required";
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
  data?: any; // Additional data for the notification
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

  // Load notifications from Supabase when user logs in
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            const newNotification: Notification = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              read: payload.new.read,
              created_at: new Date(payload.new.created_at),
              data: payload.new.data
            };
            setNotifications(prev => [newNotification, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    const mappedNotifications: Notification[] = data.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      read: item.read,
      created_at: new Date(item.created_at),
      data: item.data
    }));

    setNotifications(mappedNotifications);
  };

  const addNotification = async (notification: Omit<Notification, "id" | "created_at" | "read">) => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: currentUser.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: false,
        data: notification.data
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return;
    }

    // The real-time subscription will handle adding it to the state
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', currentUser.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotification = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return;
    }

    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = async () => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Error deleting all notifications:', error);
      return;
    }

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
