
import React, { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useComputers } from "@/context/ComputerContext";
import { useAuth } from "@/context/AuthContext";
import { AdminConfirmationDialog } from "./AdminConfirmationDialog";
import { Computer } from "@/types";

export function NotificationHandler() {
  const { notifications, markAsRead } = useNotifications();
  const { confirmFix, computers } = useComputers();
  const { currentUser } = useAuth();
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    notification: any;
    computer: Computer | null;
  }>({
    isOpen: false,
    notification: null,
    computer: null,
  });

  useEffect(() => {
    if (currentUser?.role === "admin") {
      const fixConfirmationNotifications = notifications.filter(
        n => !n.read && n.data?.type === "fix_confirmation"
      );

      if (fixConfirmationNotifications.length > 0) {
        const latestNotification = fixConfirmationNotifications[0];
        const computer = computers.find(c => c.id === latestNotification.data.computerId);
        
        if (computer) {
          setConfirmationDialog({
            isOpen: true,
            notification: latestNotification,
            computer: computer,
          });
        }
      }
    }
  }, [notifications, currentUser, computers]);

  const handleConfirmation = async (confirmed: boolean) => {
    if (confirmationDialog.notification && confirmationDialog.computer) {
      await confirmFix(
        confirmationDialog.computer.id,
        confirmed,
        confirmed ? undefined : "Admin review deemed fix incomplete"
      );
      
      // Mark notification as read
      await markAsRead(confirmationDialog.notification.id);
      
      setConfirmationDialog({
        isOpen: false,
        notification: null,
        computer: null,
      });
    }
  };

  const handleClose = () => {
    setConfirmationDialog({
      isOpen: false,
      notification: null,
      computer: null,
    });
  };

  return (
    <AdminConfirmationDialog
      isOpen={confirmationDialog.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirmation}
      computer={confirmationDialog.computer}
      technicianName={confirmationDialog.notification?.data?.technicianName || ""}
    />
  );
}
