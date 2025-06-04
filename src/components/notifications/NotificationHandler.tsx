
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useComputers } from "@/context/ComputerContext";
import { getNotificationsForUser, markNotificationAsRead, Notification } from "@/services/mockData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NotificationHandler() {
  const { currentUser } = useAuth();
  const { approveFix } = useComputers();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = () => {
      const userNotifications = getNotificationsForUser(currentUser.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleApprove = (computerId: string, notificationId: string) => {
    approveFix(computerId);
    markNotificationAsRead(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => prev - 1);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => prev - 1);
  };

  if (!currentUser) return null;

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute top-full right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div key={notification.id} className={`p-4 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {notification.type === "fix_approval_needed" && currentUser.role === "admin" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(notification.computerId!, notification.id)}
                          className="h-8 px-3"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                      
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-8 px-3"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pop-up notifications for students */}
      {unreadNotifications.map((notification) => {
        if (notification.type === "computer_fixed" && currentUser.role === "student") {
          return (
            <div key={`popup-${notification.id}`} className="fixed top-4 right-4 z-50">
              <Alert className="w-80 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">{notification.title}</AlertTitle>
                <AlertDescription className="text-green-700">
                  {notification.message}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 h-6 px-2"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
